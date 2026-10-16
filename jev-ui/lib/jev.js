// Jev に次の画面案を聞く。部品ごとの大きさと型の軸ごとの Choice を、1リクエストでまとめて聞く。

import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import { KATA_AXES } from "./kata.js";
import { PARTS, SIZE_DESCRIPTIONS, SIZE_LABELS } from "./parts.js";
import { OPTIONS, sizeOf } from "./screen.js";

export const MODEL = "jev-latest";

const EVIDENCE =
  "`history` は利用者がこれまで見比べた2枚の画面案。`chosen` は選ばれた画面案、`notChosen` は選ばれなかった画面案で、選ばれた画面案は、選ばれなかった方より好まれた。`kore` が true なら、選ばれた画面案はとても気に入られた。`hitokoto` は利用者が `no` 番目の2枚に添えた一言。";

const HOW =
  "選ばれた画面案と選ばれなかった画面案の違いから利用者の好みを読み取る。一言は利用者の要望で、選び方より優先し、後の一言で打ち消されるまで守る。一言どうしは新しいものほど優先する。画面全体についての一言（部品の数や詰まり具合など）は、この質問にも当てはめる。";

function describe(screen) {
  return {
    parts: Object.fromEntries(
      PARTS.map(({ id, name }) => [name, SIZE_LABELS[sizeOf(screen, id)]])
    ),
    kata: Object.fromEntries(
      KATA_AXES.map(({ id, name, options }) => [name, options[screen.kata[id]].label])
    )
  };
}

// history: [{ pair: { left, right }, picked: "left" | "right", kore, hitokoto }] 古い順
export function buildState(history) {
  return {
    parts: Object.fromEntries(PARTS.map(({ name, description }) => [name, description])),
    history: history.map(({ pair, picked, kore }, i) => ({
      no: i + 1,
      chosen: describe(pair[picked]),
      notChosen: describe(pair[picked === "left" ? "right" : "left"]),
      kore
    })),
    hitokoto: history
      .map(({ hitokoto }, i) => ({ no: i + 1, text: hitokoto }))
      .filter(({ text }) => text)
  };
}

export function buildQuestions() {
  const parts = PARTS.map(({ id, name }) => [
    id,
    choice(
      {
        question: `次の画面案で「${name}」の部品をどの大きさで出せば、利用者に選ばれそうか。`,
        evidence: EVIDENCE,
        how: HOW
      },
      SIZE_DESCRIPTIONS
    )
  ]);
  const kata = KATA_AXES.map(({ id, name, question, options }) => [
    id,
    choice(
      {
        question: `次の画面案の型のうち「${name}」（${question}）をどれにすれば、利用者に選ばれそうか。`,
        evidence: EVIDENCE,
        how: HOW
      },
      Object.fromEntries(
        Object.entries(options).map(([option, { description }]) => [option, description])
      )
    )
  ]);
  return Object.fromEntries([...parts, ...kata]);
}

const QUESTIONS = buildQuestions();

let client;

function getClient() {
  client ??= new TypeSafeClient({ defaultModel: MODEL });
  return client;
}

// 戻り値の probabilities は { [質問]: { [答え]: 確率 } }
export async function askNext(history) {
  const startedAt = performance.now();
  const response = await getClient().systemOne({
    state: buildState(history),
    questions: QUESTIONS
  });
  const jevMs = Math.round(performance.now() - startedAt);
  const probabilities = Object.fromEntries(
    Object.keys(OPTIONS).map((id) => [id, { ...response.answers[id].probabilities }])
  );
  return { probabilities, jevMs, model: response.model, usage: response.usage };
}
