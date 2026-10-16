// 画面案を組む。Jev の確率でサイコロを振り、並び順はコードで決める。

import { PART_IDS, SIZES } from "./parts.js";

const MAX_REROLLS = 10;

// 画面案は [{ part, size }]。出さない部品は含めない。大きいものを上、同じ大きさは部品の定義順。
export function orderScreen(screen) {
  return [...screen].sort(
    (a, b) =>
      SIZES.indexOf(b.size) - SIZES.indexOf(a.size) ||
      PART_IDS.indexOf(a.part) - PART_IDS.indexOf(b.part)
  );
}

export function uniformProbabilities() {
  const even = Object.fromEntries(SIZES.map((size) => [size, 1 / SIZES.length]));
  return Object.fromEntries(PART_IDS.map((part) => [part, { ...even }]));
}

export function rollSize(probabilities, rng = Math.random) {
  const total = SIZES.reduce((sum, size) => sum + (probabilities[size] ?? 0), 0);
  let dice = rng() * total;
  for (const size of SIZES) {
    dice -= probabilities[size] ?? 0;
    if (dice < 0) return size;
  }
  return SIZES.findLast((size) => (probabilities[size] ?? 0) > 0) ?? "none";
}

// probabilitiesByPart: { [part]: { none, small, medium, large } }
// 部品が1つも出ない画面案は評価できないので振り直し、それでも空なら一番出そうな部品を1つ置く。
export function rollScreen(probabilitiesByPart, rng = Math.random) {
  for (let i = 0; i < MAX_REROLLS; i++) {
    const screen = PART_IDS.map((part) => ({
      part,
      size: rollSize(probabilitiesByPart[part], rng)
    })).filter(({ size }) => size !== "none");
    if (screen.length > 0) return orderScreen(screen);
  }
  return [mostLikelyPart(probabilitiesByPart)];
}

function mostLikelyPart(probabilitiesByPart) {
  const part = PART_IDS.reduce((best, id) =>
    1 - probabilitiesByPart[id].none > 1 - probabilitiesByPart[best].none
      ? id
      : best
  );
  const size = SIZES.filter((s) => s !== "none").reduce((best, s) =>
    probabilitiesByPart[part][s] > probabilitiesByPart[part][best] ? s : best
  );
  return { part, size };
}

// 画面案での部品の大きさ。出していない部品は none。
export function sizeOf(screen, part) {
  return screen.find((item) => item.part === part)?.size ?? "none";
}
