import { test } from "node:test";
import assert from "node:assert/strict";
import {
  orderScreen,
  rollScreen,
  rollSize,
  uniformProbabilities
} from "../lib/screen.js";
import { PART_IDS } from "../lib/parts.js";

function sequence(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test("大きい部品を上に並べ、同じ大きさは部品の定義順", () => {
  const screen = orderScreen([
    { part: "memo", size: "small" },
    { part: "weather", size: "large" },
    { part: "clock", size: "small" },
    { part: "topTasks", size: "medium" }
  ]);
  assert.deepEqual(
    screen.map(({ part }) => part),
    ["weather", "topTasks", "clock", "memo"]
  );
});

test("確率どおりに大きさを選ぶ", () => {
  const p = { none: 0.1, small: 0.2, medium: 0.3, large: 0.4 };
  assert.equal(rollSize(p, () => 0.05), "none");
  assert.equal(rollSize(p, () => 0.25), "small");
  assert.equal(rollSize(p, () => 0.55), "medium");
  assert.equal(rollSize(p, () => 0.99), "large");
});

test("出さないが確実な部品は画面案に入らない", () => {
  const probabilities = uniformProbabilities();
  probabilities.weather = { none: 1, small: 0, medium: 0, large: 0 };
  const screen = rollScreen(probabilities, sequence(0.3, 0.6, 0.9));
  assert.ok(screen.every(({ part }) => part !== "weather"));
});

test("部品が1つも出ない場合は一番出そうな部品を1つ置く", () => {
  const probabilities = Object.fromEntries(
    PART_IDS.map((part) => [
      part,
      { none: 0.9, small: 0.05, medium: 0.03, large: 0.02 }
    ])
  );
  probabilities.nextEvent = { none: 0.6, small: 0.1, medium: 0.1, large: 0.2 };
  const screen = rollScreen(probabilities, () => 0);
  assert.deepEqual(screen, [{ part: "nextEvent", size: "large" }]);
});
