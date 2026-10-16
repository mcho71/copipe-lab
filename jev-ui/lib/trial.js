// 1回の試し（30 回）。2枚の画面案を出し、選ばれたほうを受けて Jev に聞き、次の2枚を組む。

import { randomBytes } from "node:crypto";
import { askNext as defaultAskNext } from "./jev.js";
import { appendLog as defaultAppendLog } from "./log.js";
import { makePair } from "./screen.js";
import { summarize } from "./summary.js";

export const PICKS_PER_TRIAL = 30;
const SIDES = ["left", "right"];
const MAX_HITOKOTO_LENGTH = 200;

function newTrialId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${stamp}-${randomBytes(2).toString("hex")}`;
}

export function createTrialStore({
  askNext = defaultAskNext,
  appendLog = defaultAppendLog,
  rng = Math.random
} = {}) {
  const trials = new Map();

  async function start() {
    // 最初の1組は履歴が無いので、Jev に聞かずに両方とも一様なサイコロで振る。
    const trial = { id: newTrialId(), pairs: [makePair(null, rng)], picks: [], busy: false };
    trials.set(trial.id, trial);
    await appendLog(trial.id, { type: "start", pair: trial.pairs[0] });
    return view(trial);
  }

  async function pick(trialId, { picked, kore = false, hitokoto = "" }) {
    const trial = trials.get(trialId);
    if (!trial) throw new TrialError(404, "試しが見つかりません");
    if (!SIDES.includes(picked)) throw new TrialError(400, "選んだ画面案が不正です");
    if (trial.picks.length >= PICKS_PER_TRIAL) throw new TrialError(409, "この試しは終わっています");
    if (trial.busy) throw new TrialError(409, "前の評価を処理中です");

    const no = trial.picks.length + 1;
    const pair = trial.pairs[no - 1];
    const current = {
      picked,
      kore: kore === true,
      hitokoto: String(hitokoto).trim().slice(0, MAX_HITOKOTO_LENGTH)
    };
    const history = [...trial.picks, current].map((p, i) => ({ ...p, pair: trial.pairs[i] }));

    trial.busy = true;
    let answer;
    try {
      answer = await askNext(history);
    } catch (error) {
      await appendLog(trial.id, { type: "error", no, ...current, message: error.message });
      throw new TrialError(502, `Jev の呼び出しに失敗しました: ${error.message}`);
    } finally {
      trial.busy = false;
    }

    const next = makePair(answer.probabilities, rng);
    trial.picks.push({ ...current, jevMs: answer.jevMs });
    trial.pairs.push(next);
    await appendLog(trial.id, {
      type: "pick",
      no,
      pair,
      ...current,
      pickedJev: pair.jevSide ? picked === pair.jevSide : null,
      jevMs: answer.jevMs,
      model: answer.model,
      usage: answer.usage,
      probabilities: answer.probabilities,
      nextPair: next
    });

    const result = view(trial);
    if (result.done) await appendLog(trial.id, { type: "summary", summary: result.summary });
    return result;
  }

  return { start, pick };
}

// どちらが Jev の案かは画面に渡さない。
function view(trial) {
  const done = trial.picks.length >= PICKS_PER_TRIAL;
  const { left, right } = trial.pairs.at(-1);
  return {
    trialId: trial.id,
    no: trial.picks.length + 1,
    total: PICKS_PER_TRIAL,
    pair: { left, right },
    lastJevMs: trial.picks.at(-1)?.jevMs ?? null,
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
