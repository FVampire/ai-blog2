import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { getClient } from "../db";
import { aiDefaults, aiSettingSchemas } from "./config";

export class AIQuotaError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
  ) {
    super(message);
  }
}

export function visitorAddress(headers: Headers): string {
  if (process.env.TRUST_PROXY !== "true") return "unknown";
  const value = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  // The trusted proxy must overwrite, rather than append to, client input.
  if (!isIP(value)) return "unknown";
  if (isIP(value) === 4) return value;
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  if (normalized.startsWith("::ffff:")) {
    const parts = normalized.slice(7).split(":");
    if (parts.length === 2) {
      const n = parts.map((part) => parseInt(part, 16));
      return [n[0] >> 8, n[0] & 255, n[1] >> 8, n[1] & 255].join(".");
    }
  }
  return normalized;
}

type State = { day?: string; count?: number; recent?: number[] };
export function nextUsage(
  settings: Record<string, unknown>,
  global: State,
  visitor: State,
  now: number,
  countVisitor: boolean,
) {
  const read = (
    key:
      | "ai_global_requests_per_minute"
      | "ai_anonymous_requests_per_day"
      | "ai_daily_request_budget",
  ) => aiSettingSchemas[key].parse(settings[key] ?? aiDefaults[key]);
  const rpm = read("ai_global_requests_per_minute");
  const quota = read("ai_anonymous_requests_per_day");
  const budget = read("ai_daily_request_budget");
  // A fixed UTC+8 calendar day, independent of each application server's timezone.
  const day = new Date(now + 8 * 3600000).toISOString().slice(0, 10);
  const resetAt = Date.parse(`${day}T00:00:00+08:00`) + 86400000;
  const retryDay = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const count = global.day === day ? global.count || 0 : 0;
  const visits = visitor.day === day ? visitor.count || 0 : 0;
  const recent = (global.recent || []).filter((at) => at > now - 60000);
  if (countVisitor && visits >= quota)
    throw new AIQuotaError("今日访客配额已用完，请明天再来", retryDay);
  if (budget > 0 && count >= budget)
    throw new AIQuotaError("今日全站 AI 请求预算已用完，请明天再来", retryDay);
  if (recent.length >= rpm)
    throw new AIQuotaError(
      "全站 AI 请求较多，请稍后再试",
      Math.max(1, Math.ceil((recent[0] + 60000 - now) / 1000)),
    );
  return {
    global: {
      day,
      count: count + (countVisitor ? 0 : 1),
      recent: countVisitor ? recent : [...recent, now],
    },
    visitor: { day, count: visits + 1 },
    resetAt,
  };
}

export const AIUsage = {
  async reserve(
    settings: Record<string, unknown>,
    address: string,
    countVisitor = true,
  ) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '5s'");
      // Serialize the entire read/check/write across all instances. No overshoot.
      await client.query("SELECT pg_advisory_xact_lock(732410, 1)");
      const { rows: clock } = await client.query(
        "SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::double precision AS now",
      );
      const now = Number(clock[0].now);
      const day = new Date(now + 8 * 3600000).toISOString().slice(0, 10);
      const key = `visitor:${createHash("sha256").update(`${day}:${address}`).digest("hex")}`;
      const { rows } = await client.query(
        "SELECT key, state FROM ai_usage_limits WHERE key = ANY($1::text[])",
        [["global", key]],
      );
      const states = new Map(rows.map((row) => [row.key, row.state]));
      const next = nextUsage(
        settings,
        states.get("global") || {},
        states.get(key) || {},
        now,
        countVisitor,
      );
      await client.query(
        "DELETE FROM ai_usage_limits WHERE expires_at <= to_timestamp($1 / 1000.0)",
        [now],
      );
      // Keep the global rolling minute across midnight; visitor rows expire daily.
      for (const [id, state, expiry] of [
        ["global", next.global, next.resetAt + 60000],
        ...(countVisitor ? [[key, next.visitor, next.resetAt]] : []),
      ]) {
        await client.query(
          "INSERT INTO ai_usage_limits (key, state, expires_at) VALUES ($1, $2::jsonb, to_timestamp($3 / 1000.0)) ON CONFLICT (key) DO UPDATE SET state = EXCLUDED.state, expires_at = EXCLUDED.expires_at",
          [id, JSON.stringify(state), expiry],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
