// 起動中のサーバーに 30 回の評価を自動で送り、集計を表示する。
// 使い方: npm start のあと npm run autoswipe（PORT を変えたら BASE_URL も）

import { AUTO_HITOKOTO, autoPick } from "../public/autoswipe.js";

const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3005}`;

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

const describe = ({ parts, kata }) =>
  `${Object.values(kata).join("/")} ${parts.map(({ part, size }) => `${part}:${size[0]}`).join(" ")}`;

let view = await post("/api/trials");
console.log(`試し ${view.trialId}`);
while (!view.done) {
  const no = view.no;
  const { picked, kore } = autoPick(view.pair);
  const hitokoto = AUTO_HITOKOTO[no] ?? "";
  const shown = view.pair;
  view = await post(`/api/trials/${view.trialId}/picks`, { picked, kore, hitokoto });
  console.log(
    `${String(no).padStart(2)} ${picked.padEnd(5)} ${kore ? "これ！" : "      "} ${hitokoto.padEnd(8, "　")} ${String(view.lastJevMs).padStart(4)}ms  ${describe(shown[picked])}`
  );
}
console.log(JSON.stringify(view.summary, null, 2));
