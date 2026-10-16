// 1回の試しの集計。完了条件の4項目を判定する。

import { SIZES } from "./parts.js";
import { sizeOf } from "./screen.js";

export const SPEED_LIMIT_MS = 500;
const WINDOW = 10;
const AROUND = 3;

export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function positiveRate(swipes) {
  if (swipes.length === 0) return null;
  const positive = swipes.filter(
    ({ rating }) => rating === "like" || rating === "kore"
  ).length;
  return positive / swipes.length;
}

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// 一言を添えた画面案を n 枚目として、直前の3枚は n-2〜n 枚目、直後の3枚は n+1〜n+3 枚目。
function around(screens, index) {
  return {
    before: screens.slice(Math.max(0, index - AROUND + 1), index + 1),
    after: screens.slice(index + 1, index + 1 + AROUND)
  };
}

function hitokotoIndexes(swipes, phrase) {
  return swipes
    .map((swipe, index) => (swipe.hitokoto?.includes(phrase) ? index : -1))
    .filter((index) => index >= 0);
}

function allPass(checks) {
  if (checks.length === 0) return null;
  if (checks.some(({ pass }) => pass === null)) return null;
  return checks.every(({ pass }) => pass);
}

// screens: これまでに出した画面案（swipes より1枚多いことがある）
// swipes: [{ rating: "like" | "meh" | "kore", hitokoto, jevMs }]
export function summarize({ screens, swipes }) {
  const medianMs = median(swipes.map(({ jevMs }) => jevMs).filter(Number.isFinite));

  const firstRate = positiveRate(swipes.slice(0, WINDOW));
  const lastRate = positiveRate(swipes.slice(-WINDOW));

  const koreCount = swipes.filter(({ rating }) => rating === "kore").length;

  const sukkiri = hitokotoIndexes(swipes, "もっとスッキリ").map((index) => {
    const { before, after } = around(screens, index);
    const beforeCount = average(before.map((screen) => screen.length));
    const afterCount =
      after.length === AROUND ? average(after.map((screen) => screen.length)) : null;
    return {
      no: index + 1,
      beforeCount,
      afterCount,
      pass: afterCount === null ? null : afterCount < beforeCount
    };
  });

  const yotei = hitokotoIndexes(swipes, "予定を大きく").map((index) => {
    const { after } = around(screens, index);
    const sizes = after.map((screen) => sizeOf(screen, "nextEvent"));
    return {
      no: index + 1,
      sizes,
      pass:
        after.length === AROUND
          ? sizes.every((size) => SIZES.indexOf(size) >= SIZES.indexOf("medium"))
          : null
    };
  });

  return {
    swipeCount: swipes.length,
    speed: {
      medianMs,
      limitMs: SPEED_LIMIT_MS,
      pass: medianMs === null ? null : medianMs <= SPEED_LIMIT_MS
    },
    growth: {
      firstRate,
      lastRate,
      pass:
        swipes.length < WINDOW * 2 ? null : lastRate > firstRate
    },
    kore: { count: koreCount, pass: koreCount >= 2 },
    hitokoto: {
      sukkiri: { checks: sukkiri, pass: allPass(sukkiri) },
      yotei: { checks: yotei, pass: allPass(yotei) }
    }
  };
}
