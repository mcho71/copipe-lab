import { test } from "node:test";
import assert from "node:assert/strict";
import { median, summarize } from "../lib/summary.js";

const KATA = { columns: "two", spacing: "normal", text: "normal", ground: "white" };
const PARTS = ["clock", "nextEvent", "todaySchedule", "topTasks", "weather", "unread", "memo"];

const screen = (n, nextEvent = "small") => ({
  parts: PARTS.slice(0, n).map((part) => ({ part, size: part === "nextEvent" ? nextEvent : "small" })),
  kata: KATA
});

// jevScreens[i] が i+1 回目の Jev の案。寄り道の案はいつも部品7個の黒地。
function trial({ picks, jevScreens, jevSides }) {
  const pairs = jevScreens.map((jev, i) => {
    const jevSide = jevSides?.[i] === undefined ? (i === 0 ? null : "left") : jevSides[i];
    const yorimichi = { ...screen(7), kata: { ...KATA, ground: "black" } };
    return jevSide === "right" ? { left: yorimichi, right: jev, jevSide } : { left: jev, right: yorimichi, jevSide };
  });
  return { pairs, picks: picks.map((p) => ({ kore: false, hitokoto: "", jevMs: 300, ...p })) };
}

test("中央値", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.equal(median([]), null);
});

test("最後の10回で Jev の案が選ばれた割合が最初の10回より高ければ育った", () => {
  // Jev の案はいつも左（最初の1組を除く）。最初の10回は右、最後の10回は左を選ぶ。
  const picks = [
    ...Array(10).fill({ picked: "right" }),
    ...Array(10).fill({ picked: "left" }),
    ...Array(8).fill({ picked: "left" }),
    { picked: "left", kore: true },
    { picked: "left", kore: true }
  ];
  const result = summarize(trial({ picks, jevScreens: Array(31).fill(screen(4)) }));
  assert.equal(result.growth.firstRate, 0); // 最初の1組は数えないので 0/9
  assert.equal(result.growth.lastRate, 1);
  assert.equal(result.growth.pass, true);
  assert.equal(result.kore.count, 2);
  assert.equal(result.kore.pass, true);
  assert.equal(result.speed.pass, true);
});

test("呼び出し時間の中央値が0.5秒を超えたら速さは不合格", () => {
  const picks = Array(30).fill({ picked: "left", jevMs: 501 });
  const result = summarize(trial({ picks, jevScreens: Array(31).fill(screen(4)) }));
  assert.equal(result.speed.pass, false);
});

test("もっとスッキリの直後3回の Jev の案の部品数の平均が、直前3回より少なければ合格", () => {
  const counts = [6, 6, 5, 6, 3, 3, 2, 4];
  const picks = Array(7).fill({ picked: "right" });
  picks[3] = { picked: "right", hitokoto: "もっとスッキリ" };
  // 4回目に一言 → 直前は2〜4回目(6,5,6)、直後は5〜7回目(3,3,2)
  const result = summarize(trial({ picks, jevScreens: counts.map((n) => screen(n)) }));
  const [check] = result.hitokoto.sukkiri.checks;
  assert.equal(check.no, 4);
  assert.equal(check.beforeCount, 17 / 3);
  assert.equal(check.afterCount, 8 / 3);
  assert.equal(result.hitokoto.sukkiri.pass, true);
  assert.equal(result.hitokoto.yotei.pass, null);
});

test("直前に Jev の案が無ければ（最初の1組だけなら）判定しない", () => {
  const picks = [{ picked: "left", hitokoto: "もっとスッキリ" }, ...Array(3).fill({ picked: "left" })];
  const result = summarize(trial({ picks, jevScreens: [5, 3, 3, 3, 3].map((n) => screen(n)) }));
  assert.equal(result.hitokoto.sukkiri.pass, null);
});

test("予定を大きくの直後3回の Jev の案で次の予定が中以上でなければ不合格", () => {
  const jevScreens = [screen(3), screen(2, "large"), screen(2, "medium"), screen(1)];
  const picks = [{ picked: "left", hitokoto: "予定を大きくして" }, { picked: "left" }, { picked: "left" }];
  const result = summarize(trial({ picks, jevScreens }));
  assert.deepEqual(result.hitokoto.yotei.checks[0].sizes, ["large", "medium", "none"]);
  assert.equal(result.hitokoto.yotei.pass, false);
});

test("直後の Jev の案が3回に満たなければ判定しない", () => {
  const picks = [{ picked: "left" }, { picked: "left", hitokoto: "もっとスッキリ" }];
  const result = summarize(trial({ picks, jevScreens: [screen(4), screen(4), screen(3)] }));
  assert.equal(result.hitokoto.sukkiri.pass, null);
});
