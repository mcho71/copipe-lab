// 評価・一言・呼び出し時間を logs/<試しの id>.jsonl に追記する。

import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOG_DIR = join(import.meta.dirname, "..", "logs");

export async function appendLog(trialId, record) {
  await mkdir(LOG_DIR, { recursive: true });
  const line = JSON.stringify({ at: new Date().toISOString(), trialId, ...record });
  await appendFile(join(LOG_DIR, `${trialId}.jsonl`), `${line}\n`);
}
