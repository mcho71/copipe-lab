import { test } from "node:test";
import assert from "node:assert/strict";
import { createTrialStore, PICKS_PER_TRIAL } from "../lib/trial.js";
import { uniformProbabilities } from "../lib/screen.js";

function store() {
  const logs = [];
  const calls = [];
  const trials = createTrialStore({
    askNext: async (history) => {
      calls.push(history);
      return { probabilities: uniformProbabilities(), jevMs: 200, model: "fake", usage: {} };
    },
    appendLog: async (trialId, record) => logs.push({ trialId, ...record })
  });
  return { trials, logs, calls };
}

test("2枚と選んだほう、これ！、一言を Jev に渡す", async () => {
  const { trials, calls } = store();
  const first = await trials.start();
  await trials.pick(first.trialId, { picked: "right", kore: true, hitokoto: " もっとスッキリ " });
  assert.equal(calls.length, 1);
  const [entry] = calls[0];
  assert.deepEqual(entry.pair.left, first.pair.left);
  assert.deepEqual(entry.pair.right, first.pair.right);
  assert.equal(entry.picked, "right");
  assert.equal(entry.kore, true);
  assert.equal(entry.hitokoto, "もっとスッキリ");
});

test("画面にはどちらが Jev の案かを渡さず、記録には残す", async () => {
  const { trials, logs } = store();
  const first = await trials.start();
  const second = await trials.pick(first.trialId, { picked: "left" });
  assert.equal("jevSide" in second.pair, false);
  await trials.pick(first.trialId, { picked: "left" });
  const [, secondPick] = logs.filter(({ type }) => type === "pick");
  assert.ok(["left", "right"].includes(secondPick.pair.jevSide));
  assert.equal(secondPick.pickedJev, secondPick.pair.jevSide === "left");
});

test("30 回で終わり、集計と記録が残る", async () => {
  const { trials, logs } = store();
  let view = await trials.start();
  for (let i = 0; i < PICKS_PER_TRIAL; i++) {
    view = await trials.pick(view.trialId, { picked: i % 2 ? "left" : "right", kore: i % 10 === 0 });
  }
  assert.equal(view.done, true);
  assert.equal(view.summary.speed.medianMs, 200);
  assert.equal(view.summary.kore.count, 3);
  assert.equal(logs.filter(({ type }) => type === "pick").length, PICKS_PER_TRIAL);
  assert.equal(logs.at(-1).type, "summary");
  await assert.rejects(trials.pick(view.trialId, { picked: "left" }), { status: 409 });
});

test("左右以外は受け付けない", async () => {
  const { trials } = store();
  const first = await trials.start();
  await assert.rejects(trials.pick(first.trialId, { picked: "like" }), { status: 400 });
});
