// 1回の試し（30 スワイプ）。画面案を出し、評価を受けて Jev に聞き、次の画面案を組む。

import { randomBytes } from "node:crypto";
import { askSizes as defaultAskSizes } from "./jev.js";
import { appendLog as defaultAppendLog } from "./log.js";
import { rollScreen, uniformProbabilities } from "./screen.js";
import { summarize } from "./summary.js";

export const SWIPES_PER_TRIAL = 30;
export const RATINGS = ["like", "meh", "kore"];
const MAX_HITOKOTO_LENGTH = 200;

function newTrialId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${stamp}-${randomBytes(2).toString("hex")}`;
}

export function createTrialStore({
  askSizes = defaultAskSizes,
  appendLog = defaultAppendLog,
  rng = Math.random
} = {}) {
  const trials = new Map();

  async function start() {
    // 最初の画面案は評価がまだ無いので、Jev に聞かずに一様な確率で組む。
    const trial = {
      id: newTrialId(),
      screens: [rollScreen(uniformProbabilities(), rng)],
      swipes: [],
      busy: false
    };
    trials.set(trial.id, trial);
    await appendLog(trial.id, { type: "start", screen: trial.screens[0] });
    return view(trial);
  }

  async function swipe(trialId, { rating, hitokoto = "" }) {
    const trial = trials.get(trialId);
    if (!trial) throw new TrialError(404, "試しが見つかりません");
    if (!RATINGS.includes(rating)) throw new TrialError(400, "評価が不正です");
    if (trial.swipes.length >= SWIPES_PER_TRIAL) throw new TrialError(409, "この試しは終わっています");
    if (trial.busy) throw new TrialError(409, "前のスワイプを処理中です");

    const no = trial.swipes.length + 1;
    const screen = trial.screens[no - 1];
    const text = String(hitokoto).trim().slice(0, MAX_HITOKOTO_LENGTH);
    const history = [
      ...trial.swipes.map((s, i) => ({ ...s, screen: trial.screens[i] })),
      { screen, rating, hitokoto: text }
    ];

    trial.busy = true;
    let answer;
    try {
      answer = await askSizes(history);
    } catch (error) {
      await appendLog(trial.id, { type: "error", no, rating, hitokoto: text, message: error.message });
      throw new TrialError(502, `Jev の呼び出しに失敗しました: ${error.message}`);
    } finally {
      trial.busy = false;
    }

    const next = rollScreen(answer.probabilities, rng);
    trial.swipes.push({ rating, hitokoto: text, jevMs: answer.jevMs });
    trial.screens.push(next);
    await appendLog(trial.id, {
      type: "swipe",
      no,
      screen,
      rating,
      hitokoto: text,
      jevMs: answer.jevMs,
      model: answer.model,
      usage: answer.usage,
      probabilities: answer.probabilities,
      nextScreen: next
    });

    const result = view(trial);
    if (result.done) await appendLog(trial.id, { type: "summary", summary: result.summary });
    return result;
  }

  return { start, swipe };
}

function view(trial) {
  const done = trial.swipes.length >= SWIPES_PER_TRIAL;
  return {
    trialId: trial.id,
    no: trial.swipes.length + 1,
    total: SWIPES_PER_TRIAL,
    screen: trial.screens.at(-1),
    lastJevMs: trial.swipes.at(-1)?.jevMs ?? null,
    done,
    summary: done ? summarize(trial) : null
  };
}

export class TrialError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
