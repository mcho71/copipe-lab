// 1回の試しの集計。完了条件の4項目を、2枚比べに読み替えて判定する。

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

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function jevScreen(pair) {
  return pair?.jevSide ? pair[pair.jevSide] : null;
}

// Jev の案が選ばれた割合。Jev の案が無い組（最初の1組）は数えない。
function jevPickedRate(entries) {
  const counted = entries.filter(({ pair }) => pair.jevSide);
  if (counted.length === 0) return null;
  return counted.filter(({ pair, pick }) => pick.picked === pair.jevSide).length / counted.length;
}

// n 回目に一言を添えたとき、直前の3回は n-2〜n 回目、直後の3回は n+1〜n+3 回目の Jev の案。
function around(pairs, index) {
  const jevOnly = (list) => list.map(jevScreen).filter(Boolean);
  return {
    before: jevOnly(pairs.slice(Math.max(0, index - AROUND + 1), index + 1)),
    after: jevOnly(pairs.slice(index + 1, index + 1 + AROUND))
  };
}

function hitokotoIndexes(picks, phrase) {
  return picks
    .map((pick, index) => (pick.hitokoto?.includes(phrase) ? index : -1))
    .filter((index) => index >= 0);
}

function allPass(checks) {
  if (checks.length === 0) return null;
  if (checks.some(({ pass }) => pass === null)) return null;
  return checks.every(({ pass }) => pass);
}

// pairs: これまでに出した2枚組 [{ left, right, jevSide }]（picks より1組多いことがある）
// picks: [{ picked: "left" | "right", kore, hitokoto, jevMs }]
export function summarize({ pairs, picks }) {
  const medianMs = median(picks.map(({ jevMs }) => jevMs).filter(Number.isFinite));
  const entries = picks.map((pick, i) => ({ pick, pair: pairs[i] }));

  const firstRate = jevPickedRate(entries.slice(0, WINDOW));
  const lastRate = jevPickedRate(entries.slice(-WINDOW));

  const koreCount = picks.filter(({ kore }) => kore).length;

  const sukkiri = hitokotoIndexes(picks, "もっとスッキリ").map((index) => {
    const { before, after } = around(pairs, index);
    const beforeCount = before.length ? average(before.map((s) => s.parts.length)) : null;
    const afterCount = after.length === AROUND ? average(after.map((s) => s.parts.length)) : null;
    return {
      no: index + 1,
      beforeCount,
      afterCount,
      pass: beforeCount === null || afterCount === null ? null : afterCount < beforeCount
    };
  });

  const yotei = hitokotoIndexes(picks, "予定を大きく").map((index) => {
    const { after } = around(pairs, index);
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
    pickCount: picks.length,
    speed: {
      medianMs,
      limitMs: SPEED_LIMIT_MS,
      pass: medianMs === null ? null : medianMs <= SPEED_LIMIT_MS
    },
    growth: {
      firstRate,
      lastRate,
      pass:
        picks.length < WINDOW * 2 || firstRate === null || lastRate === null
          ? null
          : lastRate > firstRate
    },
    kore: { count: koreCount, pass: koreCount >= 2 },
    hitokoto: {
      sukkiri: { checks: sukkiri, pass: allPass(sukkiri) },
      yotei: { checks: yotei, pass: allPass(yotei) }
    }
  };
}
