import { test } from "node:test";
import assert from "node:assert/strict";
import { createTrialStore, SWIPES_PER_TRIAL } from "../lib/trial.js";
import { uniformProbabilities } from "../lib/screen.js";

function store() {
  const logs = [];
  const calls = [];
  const trials = createTrialStore({
    askSizes: async (history) => {
      calls.push(history);
      return { probabilities: uniformProbabilities(), jevMs: 200, model: "fake", usage: {} };
    },
    appendLog: async (trialId, record) => logs.push({ trialId, ...record })
  });
  return { trials, logs, calls };
}

test("一言は表示中の画面案にひもづけて Jev に渡す", async () => {
  const { trials, calls } = store();
  const first = await trials.start();
  await trials.swipe(first.trialId, { rating: "like", hitokoto: " もっとスッキリ " });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [
    { screen: first.screen, rating: "like", hitokoto: "もっとスッキリ" }
  ]);
});

test("30 スワイプで終わり、集計と記録が残る", async () => {
  const { trials, logs } = store();
  let view = await trials.start();
  for (let i = 0; i < SWIPES_PER_TRIAL; i++) {
    view = await trials.swipe(view.trialId, { rating: i % 3 ? "like" : "kore" });
  }
  assert.equal(view.done, true);
  assert.equal(view.summary.speed.medianMs, 200);
  assert.equal(logs.filter(({ type }) => type === "swipe").length, SWIPES_PER_TRIAL);
  assert.equal(logs.at(-1).type, "summary");
  await assert.rejects(trials.swipe(view.trialId, { rating: "like" }), { status: 409 });
});

test("不正な評価は受け付けない", async () => {
  const { trials } = store();
  const first = await trials.start();
  await assert.rejects(trials.swipe(first.trialId, { rating: "superlike" }), { status: 400 });
});
