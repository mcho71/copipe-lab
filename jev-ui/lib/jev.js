// Jev に部品ごとの大きさを聞く。全部品ぶんの Choice を1リクエストで聞く。

import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import { PARTS, SIZE_DESCRIPTIONS, SIZE_LABELS } from "./parts.js";
import { sizeOf } from "./screen.js";

export const MODEL = "jev-latest";

export const RATING_LABELS = { like: "好き", meh: "いまいち", kore: "これ！" };

// history: [{ screen, rating, hitokoto }] 古い順
export function buildState(history) {
  return {
    parts: Object.fromEntries(PARTS.map(({ name, description }) => [name, description])),
    ratings: {
      "これ！": "とても気に入った。この組み方をもっと見たい",
      好き: "気に入った",
      いまいち: "気に入らなかった"
    },
    history: history.map(({ screen, rating }, i) => ({
      no: i + 1,
      screen: Object.fromEntries(
        PARTS.map(({ id, name }) => [name, SIZE_LABELS[sizeOf(screen, id)]])
      ),
      rating: RATING_LABELS[rating]
    })),
    hitokoto: history
      .map(({ hitokoto }, i) => ({ no: i + 1, text: hitokoto }))
      .filter(({ text }) => text)
  };
}

export function buildQuestions() {
  return Object.fromEntries(
    PARTS.map(({ id, name }) => [
      id,
      choice(
        {
          question: `次にホーム画面の案を見せるとき、「${name}」の部品をどの大きさで出せば、利用者に気に入ってもらえそうか。`,
          evidence:
            "`history` は利用者がこれまで見た画面案（`screen` は部品ごとの大きさ）と評価（`rating`）。`hitokoto` は利用者が `no` 番目の画面案に添えた一言。",
          how: "評価から利用者の好みを読み取る。一言は利用者の要望で、評価より優先し、後の一言で打ち消されるまで守る。一言どうしは新しいものほど優先する。画面全体についての一言（部品の数や詰まり具合など）は、この部品にも当てはめる。"
        },
        SIZE_DESCRIPTIONS
      )
    ])
  );
}

const QUESTIONS = buildQuestions();

let client;

function getClient() {
  client ??= new TypeSafeClient({ defaultModel: MODEL });
  return client;
}

// 戻り値の probabilities は { [part]: { none, small, medium, large } }
export async function askSizes(history) {
  const startedAt = performance.now();
  const response = await getClient().systemOne({
    state: buildState(history),
    questions: QUESTIONS
  });
  const jevMs = Math.round(performance.now() - startedAt);
  const probabilities = Object.fromEntries(
    PARTS.map(({ id }) => [id, { ...response.answers[id].probabilities }])
  );
  return { probabilities, jevMs, model: response.model, usage: response.usage };
}
