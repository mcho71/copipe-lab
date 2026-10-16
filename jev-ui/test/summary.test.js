import { test } from "node:test";
import assert from "node:assert/strict";
import { median, summarize } from "../lib/summary.js";

const small = (n) =>
  ["clock", "nextEvent", "todaySchedule", "topTasks", "weather", "unread", "memo"]
    .slice(0, n)
    .map((part) => ({ part, size: "small" }));

function trial({ ratings, hitokoto = {}, screens, jevMs = 300 }) {
  const swipes = ratings.map((rating, i) => ({
    rating,
    hitokoto: hitokoto[i + 1] ?? "",
    jevMs
  }));
  return { swipes, screens: screens ?? swipes.map(() => small(4)).concat([small(4)]) };
}

test("中央値", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.equal(median([]), null);
});

test("最後の10枚の好き＋これ！の割合が最初の10枚より高ければ育った", () => {
  const ratings = [
    ...Array(10).fill("meh"),
    ...Array(10).fill("like"),
    ...Array(8).fill("like"),
    "kore",
    "kore"
  ];
  const result = summarize(trial({ ratings }));
  assert.equal(result.growth.firstRate, 0);
  assert.equal(result.growth.lastRate, 1);
  assert.equal(result.growth.pass, true);
  assert.equal(result.kore.count, 2);
  assert.equal(result.kore.pass, true);
  assert.equal(result.speed.pass, true);
});

test("呼び出し時間の中央値が0.5秒を超えたら速さは不合格", () => {
  const result = summarize(trial({ ratings: Array(30).fill("like"), jevMs: 501 }));
  assert.equal(result.speed.pass, false);
});

test("もっとスッキリの直後3枚の部品数の平均が直前3枚より少なければ合格", () => {
  const counts = [6, 6, 5, 6, 3, 3, 2, 4];
  const ratings = Array(7).fill("like");
  const screens = counts.map(small);
  // 4枚目に一言 → 直前は2〜4枚目(6,5,6)、直後は5〜7枚目(3,3,2)
  const result = summarize(trial({ ratings, screens, hitokoto: { 4: "もっとスッキリ" } }));
  const [check] = result.hitokoto.sukkiri.checks;
  assert.equal(check.no, 4);
  assert.equal(check.afterCount, 8 / 3);
  assert.equal(result.hitokoto.sukkiri.pass, true);
  assert.equal(result.hitokoto.yotei.pass, null);
});

test("予定を大きくの直後3枚で次の予定が中以上でなければ不合格", () => {
  const screens = [
    small(3),
    [{ part: "nextEvent", size: "large" }],
    [{ part: "nextEvent", size: "medium" }],
    [{ part: "clock", size: "large" }]
  ];
  const result = summarize(
    trial({ ratings: ["like", "like", "like"], screens, hitokoto: { 1: "予定を大きくして" } })
  );
  assert.deepEqual(result.hitokoto.yotei.checks[0].sizes, ["large", "medium", "none"]);
  assert.equal(result.hitokoto.yotei.pass, false);
});

test("直後の画面案が3枚に満たなければ判定しない", () => {
  const result = summarize(
    trial({ ratings: ["like", "like"], hitokoto: { 2: "もっとスッキリ" } })
  );
  assert.equal(result.hitokoto.sukkiri.pass, null);
});
