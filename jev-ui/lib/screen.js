// 画面案を組む。Jev の案は各質問で一番確率の高い答え、寄り道の案は確率をならしたサイコロで振る。
// 並び順はコードで決める。
//
// 答え（answers）は質問ごとの答え { clock: "small", ..., columns: "two", ... }。
// 画面案（screen）は { parts: [{ part, size }], kata: { columns, spacing, text, ground } }。

import { KATA_AXES, KATA_IDS } from "./kata.js";
import { PART_IDS, SIZES } from "./parts.js";

export const OPTIONS = {
  ...Object.fromEntries(PART_IDS.map((id) => [id, SIZES])),
  ...Object.fromEntries(KATA_AXES.map(({ id, options }) => [id, Object.keys(options)]))
};
const QUESTION_IDS = Object.keys(OPTIONS);

// 寄り道の案を振るときに、Jev の確率と一様な確率を半々に混ぜる。
const FLATTEN_MIX = 0.5;
const MIN_DIFFERENCES = 2;
const MAX_ROLLS = 200;

// 大きいものを上、同じ大きさは部品の定義順。
export function orderParts(parts) {
  return [...parts].sort(
    (a, b) =>
      SIZES.indexOf(b.size) - SIZES.indexOf(a.size) ||
      PART_IDS.indexOf(a.part) - PART_IDS.indexOf(b.part)
  );
}

export function toScreen(answers) {
  return {
    parts: orderParts(
      PART_IDS.filter((id) => answers[id] !== "none").map((part) => ({
        part,
        size: answers[part]
      }))
    ),
    kata: Object.fromEntries(KATA_IDS.map((id) => [id, answers[id]]))
  };
}

export function toAnswers(screen) {
  return {
    ...Object.fromEntries(PART_IDS.map((id) => [id, sizeOf(screen, id)])),
    ...screen.kata
  };
}

// 画面案での部品の大きさ。出していない部品は none。
export function sizeOf(screen, part) {
  return screen.parts.find((item) => item.part === part)?.size ?? "none";
}

export function uniformProbabilities() {
  return Object.fromEntries(
    QUESTION_IDS.map((id) => [
      id,
      Object.fromEntries(OPTIONS[id].map((option) => [option, 1 / OPTIONS[id].length]))
    ])
  );
}

export function flatten(probabilities, mix = FLATTEN_MIX) {
  return Object.fromEntries(
    QUESTION_IDS.map((id) => [
      id,
      Object.fromEntries(
        OPTIONS[id].map((option) => [
          option,
          (1 - mix) * (probabilities[id][option] ?? 0) + mix / OPTIONS[id].length
        ])
      )
    ])
  );
}

export function roll(probabilities, options, rng = Math.random) {
  const total = options.reduce((sum, option) => sum + (probabilities[option] ?? 0), 0);
  let dice = rng() * total;
  for (const option of options) {
    dice -= probabilities[option] ?? 0;
    if (dice < 0) return option;
  }
  return options.at(-1);
}

function rollAnswers(probabilities, rng) {
  return Object.fromEntries(
    QUESTION_IDS.map((id) => [id, roll(probabilities[id], OPTIONS[id], rng)])
  );
}

function hasPart(answers) {
  return PART_IDS.some((id) => answers[id] !== "none");
}

export function differences(a, b) {
  return QUESTION_IDS.filter((id) => a[id] !== b[id]);
}

export function isYorimichi(base, other) {
  const changed = differences(base, other);
  return (
    hasPart(other) &&
    changed.length >= MIN_DIFFERENCES &&
    changed.some((id) => KATA_IDS.includes(id))
  );
}

// 各質問で一番確率の高い答え。部品が1つも出ないときは、一番出そうな部品を1つ置く。
export function likeliestAnswers(probabilities) {
  const answers = Object.fromEntries(
    QUESTION_IDS.map((id) => [
      id,
      OPTIONS[id].reduce((best, option) =>
        probabilities[id][option] > probabilities[id][best] ? option : best
      )
    ])
  );
  if (hasPart(answers)) return answers;
  const part = PART_IDS.reduce((best, id) =>
    probabilities[id].none < probabilities[best].none ? id : best
  );
  answers[part] = SIZES.filter((size) => size !== "none").reduce((best, size) =>
    probabilities[part][size] > probabilities[part][best] ? size : best
  );
  return answers;
}

// 確率をならしてサイコロを振り、base から2か所以上（うち1か所以上は型）変わった答えを探す。
// 振っても見つからなければ、型を1か所とほかを1か所、ならした確率で変える。
export function yorimichiAnswers(base, probabilities, rng = Math.random) {
  const flat = flatten(probabilities);
  for (let i = 0; i < MAX_ROLLS; i++) {
    const answers = rollAnswers(flat, rng);
    if (isYorimichi(base, answers)) return answers;
  }
  const answers = { ...base };
  const axis = KATA_IDS[Math.floor(rng() * KATA_IDS.length)];
  answers[axis] = rollOther(flat, axis, answers, rng);
  const others = QUESTION_IDS.filter((id) => id !== axis);
  const other = others[Math.floor(rng() * others.length)];
  answers[other] = rollOther(flat, other, answers, rng);
  return answers;
}

function rollOther(probabilities, id, answers, rng) {
  const candidates = OPTIONS[id].filter(
    (option) => option !== answers[id] && hasPart({ ...answers, [id]: option })
  );
  return roll(probabilities[id], candidates, rng);
}

function rollWithPart(probabilities, rng) {
  for (let i = 0; i < MAX_ROLLS; i++) {
    const answers = rollAnswers(probabilities, rng);
    if (hasPart(answers)) return answers;
  }
  return likeliestAnswers(probabilities);
}

// 2枚の画面案。probabilities が無い（最初の1組）ときは、両方とも一様なサイコロで振る。
// jevSide は Jev の案が左右どちらか。最初の1組は Jev の案が無いので null。
export function makePair(probabilities, rng = Math.random) {
  const base = probabilities
    ? likeliestAnswers(probabilities)
    : rollWithPart(uniformProbabilities(), rng);
  const yorimichi = yorimichiAnswers(base, probabilities ?? uniformProbabilities(), rng);
  const baseSide = rng() < 0.5 ? "left" : "right";
  const [left, right] = baseSide === "left" ? [base, yorimichi] : [yorimichi, base];
  return {
    left: toScreen(left),
    right: toScreen(right),
    jevSide: probabilities ? baseSide : null
  };
}
