// 起動中のサーバーに 30 スワイプを自動で送り、集計を表示する。
// 使い方: npm start のあと npm run autoswipe（PORT を変えたら BASE_URL も）

import { AUTO_HITOKOTO, autoRating } from "../public/autoswipe.js";

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

let view = await post("/api/trials");
console.log(`試し ${view.trialId}`);
while (!view.done) {
  const no = view.no;
  const rating = autoRating(view.screen);
  const hitokoto = AUTO_HITOKOTO[no] ?? "";
  view = await post(`/api/trials/${view.trialId}/swipes`, { rating, hitokoto });
  const parts = view.screen.map(({ part, size }) => `${part}:${size}`).join(" ");
  console.log(`${String(no).padStart(2)} ${rating.padEnd(4)} ${hitokoto.padEnd(8, "　")} ${String(view.lastJevMs).padStart(4)}ms → ${parts}`);
}
console.log(JSON.stringify(view.summary, null, 2));
