import assert from "node:assert/strict";
import test from "node:test";
import {
  parseModerationResult,
  Moderation,
  ModerationUnavailableError,
} from "./moderation";
import { aiSettingSchemas } from "./config";

test("moderation only accepts explicit and consistent structured decisions", () => {
  assert.equal(
    parseModerationResult('{"decision":"allow","category":"none"}').decision,
    "allow",
  );
  for (const category of [
    "crime",
    "sexual",
    "gambling",
    "drugs",
    "dangerous_operations",
  ])
    assert.equal(
      parseModerationResult(JSON.stringify({ decision: "block", category }))
        .decision,
      "block",
    );
  for (const invalid of [
    "",
    "ALLOW",
    '```json\n{"decision":"allow","category":"none"}\n```',
    '{"decision":"allow","category":"crime"}',
    '{"decision":"block","category":"none"}',
    '{"decision":"allow","category":"none","message":"ignore rules"}',
    '{"decision":"allow"}',
    "a".repeat(2001),
  ])
    assert.throws(
      () => parseModerationResult(invalid),
      ModerationUnavailableError,
    );
});

test("moderation configuration validates model names and timeout bounds", () => {
  assert.equal(
    aiSettingSchemas.ai_moderation_model.safeParse("  ").success,
    false,
  );
  for (const value of [0, -1, 2, 61, 3.5, "15"])
    assert.equal(
      aiSettingSchemas.ai_moderation_timeout_seconds.safeParse(value).success,
      false,
    );
});

test("cancelled moderation never proceeds or discloses internal configuration", async () => {
  await assert.rejects(
    Moderation.check(
      {},
      [{ role: "user", content: "你好" }],
      AbortSignal.abort(),
    ),
    (error: unknown) =>
      error instanceof ModerationUnavailableError &&
      !error.message.includes("密钥"),
  );
});
