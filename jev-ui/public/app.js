import { renderScreen } from "./parts.js";
import { AUTO_HITOKOTO, autoRating } from "./autoswipe.js";

const RATING_LABELS = { like: "好き", meh: "いまいち", kore: "これ！" };
const KEY_RATINGS = { ArrowRight: "like", ArrowLeft: "meh", ArrowUp: "kore" };
const SWIPE_THRESHOLD = 120;
const AUTO = new URLSearchParams(location.search).has("auto");

const $ = (id) => document.getElementById(id);
const frame = $("frame");
const input = $("hitokoto");

let content;
let state;
let busy = false;

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

function show(view) {
  state = view;
  $("screen").innerHTML = renderScreen(view.screen, content);
  $("progress").textContent = `${Math.min(view.no, view.total)} / ${view.total}`;
  if (view.lastJevMs !== null) $("jev-ms").textContent = `Jev ${view.lastJevMs} ms`;
  frame.scrollTop = 0;
  resetFrame();
  if (view.done) showSummary(view.summary);
}

function resetFrame() {
  frame.style.transition = "transform 200ms ease, opacity 200ms ease";
  frame.style.transform = "";
  frame.style.opacity = "1";
  setStamp(null);
}

function setStamp(rating, strength = 1) {
  const stamp = $("stamp");
  stamp.textContent = rating ? RATING_LABELS[rating] : "";
  stamp.style.opacity = rating ? String(strength) : "0";
}

function flyOut(rating) {
  const to = { like: "translate(120%, 0) rotate(12deg)", meh: "translate(-120%, 0) rotate(-12deg)", kore: "translate(0, -120%)" };
  frame.style.transition = "transform 250ms ease-in, opacity 250ms ease-in";
  frame.style.transform = to[rating];
  frame.style.opacity = "0";
}

async function swipe(rating) {
  if (busy || !state || state.done) return;
  busy = true;
  setStamp(rating);
  flyOut(rating);
  $("loading").style.opacity = "1";
  try {
    const view = await api(`/api/trials/${state.trialId}/swipes`, { rating, hitokoto: input.value });
    input.value = "";
    $("message").textContent = "";
    show(view);
  } catch (error) {
    $("message").textContent = error.message;
    resetFrame();
  } finally {
    $("loading").style.opacity = "0";
    busy = false;
  }
}

// ドラッグでスワイプ（マウス想定）
let drag = null;
frame.addEventListener("pointerdown", (e) => {
  if (busy) return;
  drag = { x: e.clientX, y: e.clientY };
  frame.setPointerCapture(e.pointerId);
  frame.style.transition = "none";
});
frame.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  frame.style.transform = `translate(${dx}px, ${Math.min(dy, 0)}px) rotate(${dx / 30}deg)`;
  const rating = dragRating(dx, dy);
  setStamp(rating, Math.min(1, Math.max(Math.abs(dx), -dy) / SWIPE_THRESHOLD));
});
frame.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const rating = dragRating(e.clientX - drag.x, e.clientY - drag.y, SWIPE_THRESHOLD);
  drag = null;
  rating ? swipe(rating) : resetFrame();
});

function dragRating(dx, dy, threshold = 10) {
  if (-dy > Math.abs(dx) && -dy >= threshold) return "kore";
  if (dx >= threshold) return "like";
  if (dx <= -threshold) return "meh";
  return null;
}

document.addEventListener("keydown", (e) => {
  if (e.target === input) {
    if (e.key === "Enter" || e.key === "Escape") input.blur();
    return;
  }
  const rating = KEY_RATINGS[e.key];
  if (rating) {
    e.preventDefault();
    swipe(rating);
  }
});

for (const button of document.querySelectorAll("[data-rating]")) {
  button.addEventListener("click", () => swipe(button.dataset.rating));
}

const percent = (rate) => (rate === null ? "–" : `${Math.round(rate * 100)}%`);
const mark = (pass) => (pass === null ? "判定不可" : pass ? "達成" : "未達");
const SIZE_LABELS = { none: "出さない", small: "小", medium: "中", large: "大" };

function showSummary(summary) {
  const { speed, growth, kore, hitokoto } = summary;
  const sukkiri = hitokoto.sukkiri.checks
    .map((c) => `${c.no}枚目: 直前 ${c.beforeCount.toFixed(1)} 個 → 直後 ${c.afterCount === null ? "–" : c.afterCount.toFixed(1)} 個`)
    .join("<br>");
  const yotei = hitokoto.yotei.checks
    .map((c) => `${c.no}枚目: 直後の次の予定 ${c.sizes.map((s) => SIZE_LABELS[s]).join("・")}`)
    .join("<br>");
  const rows = [
    ["1. 速さ", speed.pass, `呼び出し時間の中央値 ${speed.medianMs} ms（${speed.limitMs} ms 以内）`],
    ["2. 育つ", growth.pass, `好き＋これ！ 最初の10枚 ${percent(growth.firstRate)} → 最後の10枚 ${percent(growth.lastRate)}`],
    ["3. たまに美味しい", kore.pass, `これ！ ${kore.count} 回（2 回以上）`],
    ["4a. 一言「もっとスッキリ」", hitokoto.sukkiri.pass, sukkiri || "入力なし"],
    ["4b. 一言「予定を大きく」", hitokoto.yotei.pass, yotei || "入力なし"]
  ];
  $("summary-body").innerHTML = rows
    .map(
      ([title, pass, detail]) =>
        `<div><dt class="flex justify-between font-medium"><span>${title}</span><span class="${pass ? "text-neutral-900" : "text-neutral-400"}">${mark(pass)}</span></dt><dd class="mt-1 text-sm text-neutral-500">${detail}</dd></div>`
    )
    .join("");
  $("summary").classList.replace("hidden", "flex");
}

async function start() {
  $("summary").classList.replace("flex", "hidden");
  $("jev-ms").textContent = "Jev –";
  show(await api("/api/trials"));
  if (AUTO) autoSwipe();
}

async function autoSwipe() {
  while (!state.done) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    input.value = AUTO_HITOKOTO[state.no] ?? "";
    await swipe(autoRating(state.screen));
    if ($("message").textContent) return;
  }
}

$("restart").addEventListener("click", start);

content = await (await fetch("/content.json")).json();
start().catch((error) => ($("message").textContent = error.message));
