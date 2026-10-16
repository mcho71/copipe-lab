import { test } from "node:test";
import assert from "node:assert/strict";
import {
  differences,
  isYorimichi,
  likeliestAnswers,
  makePair,
  orderParts,
  roll,
  toAnswers,
  toScreen,
  uniformProbabilities,
  yorimichiAnswers
} from "../lib/screen.js";
import { KATA_IDS } from "../lib/kata.js";
import { PART_IDS } from "../lib/parts.js";

// 再現できる乱数
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

function certain(answers) {
  const probabilities = uniformProbabilities();
  for (const [id, answer] of Object.entries(answers)) {
    for (const option of Object.keys(probabilities[id])) {
      probabilities[id][option] = option === answer ? 1 : 0;
    }
  }
  return probabilities;
}

const JEV = {
  clock: "small",
  nextEvent: "large",
  todaySchedule: "none",
  topTasks: "medium",
  weather: "none",
  unread: "none",
  memo: "small",
  columns: "two",
  spacing: "normal",
  text: "normal",
  ground: "white"
};

test("大きい部品を上に並べ、同じ大きさは部品の定義順", () => {
  const parts = orderParts([
    { part: "memo", size: "small" },
    { part: "weather", size: "large" },
    { part: "clock", size: "small" },
    { part: "topTasks", size: "medium" }
  ]);
  assert.deepEqual(
    parts.map(({ part }) => part),
    ["weather", "topTasks", "clock", "memo"]
  );
});

test("画面案と答えは行き来できる", () => {
  const screen = toScreen(JEV);
  assert.deepEqual(screen.parts.map(({ part }) => part), ["nextEvent", "topTasks", "clock", "memo"]);
  assert.deepEqual(screen.kata, { columns: "two", spacing: "normal", text: "normal", ground: "white" });
  assert.deepEqual(toAnswers(screen), JEV);
});

test("確率どおりに答えを選ぶ", () => {
  const p = { none: 0.1, small: 0.2, medium: 0.3, large: 0.4 };
  const options = ["none", "small", "medium", "large"];
  assert.equal(roll(p, options, () => 0.05), "none");
  assert.equal(roll(p, options, () => 0.25), "small");
  assert.equal(roll(p, options, () => 0.55), "medium");
  assert.equal(roll(p, options, () => 0.99), "large");
});

test("Jev の案は各質問で一番確率の高い答え", () => {
  assert.deepEqual(likeliestAnswers(certain(JEV)), JEV);
});

test("Jev の案で部品が1つも出ないときは、一番出そうな部品を1つ置く", () => {
  const probabilities = certain({ ...JEV, ...Object.fromEntries(PART_IDS.map((id) => [id, "none"])) });
  probabilities.weather = { none: 0.6, small: 0.1, medium: 0.25, large: 0.05 };
  const answers = likeliestAnswers(probabilities);
  assert.deepEqual(
    PART_IDS.filter((id) => answers[id] !== "none").map((id) => [id, answers[id]]),
    [["weather", "medium"]]
  );
});

test("寄り道の案は Jev の案から2か所以上、うち1か所以上は型を変える", () => {
  const rng = seeded(1);
  for (let i = 0; i < 200; i++) {
    const answers = yorimichiAnswers(JEV, certain(JEV), rng);
    const changed = differences(JEV, answers);
    assert.ok(changed.length >= 2, `変わったのは ${changed}`);
    assert.ok(changed.some((id) => KATA_IDS.includes(id)));
    assert.ok(isYorimichi(JEV, answers));
  }
});

test("2枚はいつも違い、最初の1組には Jev の案が無い", () => {
  const rng = seeded(7);
  const sides = new Set();
  for (let i = 0; i < 100; i++) {
    const first = makePair(null, rng);
    assert.equal(first.jevSide, null);
    assert.ok(isYorimichi(toAnswers(first.left), toAnswers(first.right)) || isYorimichi(toAnswers(first.right), toAnswers(first.left)));

    const pair = makePair(certain(JEV), rng);
    sides.add(pair.jevSide);
    assert.deepEqual(toAnswers(pair[pair.jevSide]), JEV);
    const other = pair[pair.jevSide === "left" ? "right" : "left"];
    assert.ok(isYorimichi(JEV, toAnswers(other)));
    assert.ok(other.parts.length > 0);
  }
  assert.deepEqual([...sides].sort(), ["left", "right"]);
});
