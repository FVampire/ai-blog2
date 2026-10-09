import assert from "node:assert/strict";
import test from "node:test";
import { AIQuotaError, nextUsage, visitorAddress } from "./limits";
import { aiSettingSchemas } from "./config";

const now = Date.parse("2026-09-11T12:00:00+08:00");
test("global rate uses a rolling minute, including the exact boundary", () => {
  let global = {};
  for (let i = 0; i < 4; i++)
    global = nextUsage({}, global, {}, now + i * 1000, false).global;
  assert.throws(
    () => nextUsage({}, global, {}, now + 59999, false),
    (e: unknown) => e instanceof AIQuotaError && e.retryAfter === 1,
  );
  assert.equal(
    nextUsage({}, global, {}, now + 60000, false).global.recent.length,
    4,
  );
});
test("anonymous admission counts once; subsequent model calls do not consume visitor quota", () => {
  let visitor = {};
  for (let i = 0; i < 5; i++)
    visitor = nextUsage({}, {}, visitor, now, true).visitor;
  assert.throws(() => nextUsage({}, {}, visitor, now, true), /访客配额/);
  assert.equal(nextUsage({}, {}, visitor, now, false).global.count, 1);
  assert.equal(nextUsage({}, {}, {}, now, true).global.count, 0);
});
test("daily request budget defaults off and rejects exactly at configured maximum", () => {
  const global = { day: "2026-09-11", count: 100, recent: [] };
  assert.equal(nextUsage({}, global, {}, now, false).global.count, 101);
  assert.throws(
    () => nextUsage({ ai_daily_request_budget: 100 }, global, {}, now, false),
    /全站 AI 请求预算/,
  );
  assert.equal(
    nextUsage({ ai_daily_request_budget: 101 }, global, {}, now, false).global
      .count,
    101,
  );
});
test("Shanghai midnight resets daily quotas but preserves rolling rate", () => {
  const midnight = Date.parse("2026-09-12T00:00:00+08:00");
  const global = { day: "2026-09-11", count: 100, recent: [midnight - 500] };
  const visitor = { day: "2026-09-11", count: 5 };
  const result = nextUsage(
    { ai_daily_request_budget: 1 },
    global,
    visitor,
    midnight,
    true,
  );
  assert.equal(result.visitor.count, 1);
  assert.equal(result.global.count, 0);
  assert.equal(result.global.recent.length, 1);
  assert.throws(
    () =>
      nextUsage(
        { ai_global_requests_per_minute: 1 },
        global,
        visitor,
        midnight,
        false,
      ),
    /全站 AI 请求较多/,
  );
});
test("limit settings reject invalid values rather than silently disable protection", () => {
  for (const key of [
    "ai_global_requests_per_minute",
    "ai_anonymous_requests_per_day",
    "ai_daily_request_budget",
  ] as const) {
    for (const value of [-1, 0.5, NaN, Infinity, "5"])
      assert.equal(aiSettingSchemas[key].safeParse(value).success, false);
  }
  assert.throws(() =>
    nextUsage({ ai_global_requests_per_minute: 0 }, {}, {}, now, false),
  );
});
test("visitor identification ignores untrusted headers and canonicalizes IPv6", () => {
  const previous = process.env.TRUST_PROXY;
  try {
    delete process.env.TRUST_PROXY;
    assert.equal(
      visitorAddress(new Headers({ "x-forwarded-for": "1.2.3.4" })),
      "unknown",
    );
    process.env.TRUST_PROXY = "true";
    assert.equal(
      visitorAddress(new Headers({ "x-forwarded-for": "invalid" })),
      "unknown",
    );
    assert.equal(
      visitorAddress(
        new Headers({ "x-forwarded-for": "2001:0db8:0:0:0:0:0:1" }),
      ),
      "2001:db8::1",
    );
    assert.equal(
      visitorAddress(new Headers({ "x-forwarded-for": "::ffff:192.0.2.1" })),
      "192.0.2.1",
    );
  } finally {
    if (previous === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previous;
  }
});
