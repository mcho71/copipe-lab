// 自動のスワイプ。動作確認用に「スッキリしていて次の予定が大きいのが好き」な利用者を真似る。
// 画面（?auto）と scripts/autoswipe.js の両方から使う。

export const AUTO_HITOKOTO = { 5: "もっとスッキリ", 15: "予定を大きく" };

const RANK = { none: 0, small: 1, medium: 2, large: 3 };

export function autoRating(screen) {
  const nextEvent = screen.find(({ part }) => part === "nextEvent")?.size ?? "none";
  if (screen.length <= 3 && RANK[nextEvent] >= RANK.medium) return "kore";
  if (screen.length <= 4 || RANK[nextEvent] === RANK.large) return "like";
  return "meh";
}
