// 自動の評価。動作確認用に「部品が少なく、次の予定が大きく、1列・広い余白・黒地が好き」な利用者を真似る。
// 画面（?auto）と scripts/autoswipe.js の両方から使う。

export const AUTO_HITOKOTO = { 5: "もっとスッキリ", 15: "予定を大きく" };

const RANK = { none: 0, small: 1, medium: 2, large: 3 };

function nextEventRank(screen) {
  return RANK[screen.parts.find(({ part }) => part === "nextEvent")?.size ?? "none"];
}

function kataMatches({ kata }) {
  return [kata.columns === "one", kata.spacing === "loose", kata.ground === "black"].filter(Boolean)
    .length;
}

function score(screen) {
  return -screen.parts.length + 2 * nextEventRank(screen) + kataMatches(screen);
}

export function autoPick({ left, right }, rng = Math.random) {
  const diff = score(left) - score(right);
  const picked = diff > 0 ? "left" : diff < 0 ? "right" : rng() < 0.5 ? "left" : "right";
  const screen = picked === "left" ? left : right;
  const kore =
    screen.parts.length <= 3 && nextEventRank(screen) >= RANK.medium && kataMatches(screen) >= 2;
  return { picked, kore };
}
