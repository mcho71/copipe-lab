import { renderScreen } from "./parts.js";
import { AUTO_HITOKOTO, autoPick } from "./autoswipe.js";

const KEY_SIDES = { ArrowLeft: "left", ArrowRight: "right" };
const SIZE_LABELS = { none: "出さない", small: "小", medium: "中", large: "大" };
const AUTO = new URLSearchParams(location.search).has("auto");

const $ = (id) => document.getElementById(id);
const input = $("hitokoto");
const panels = { left: $("left"), right: $("right") };

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
  for (const side of ["left", "right"]) {
    panels[side].innerHTML = renderScreen(view.pair[side], content);
    panels[side].scrollTop = 0;
  }
  $("progress").textContent = `${Math.min(view.no, view.total)} / ${view.total}`;
  if (view.lastJevMs !== null) $("jev-ms").textContent = `Jev ${view.lastJevMs} ms`;
  highlight(null);
  if (view.done) showSummary(view.summary);
}

function highlight(side) {
  for (const [key, panel] of Object.entries(panels)) {
    panel.classList.toggle("ring-4", key === side);
    panel.classList.toggle("ring-neutral-900", key === side);
  }
}

async function pick(picked, kore) {
  if (busy || !state || state.done) return;
  busy = true;
  highlight(picked);
  $("loading").style.opacity = "1";
  try {
    const view = await api(`/api/trials/${state.trialId}/picks`, {
      picked,
      kore,
      hitokoto: input.value
    });
    input.value = "";
    $("message").textContent = "";
    show(view);
  } catch (error) {
    $("message").textContent = error.message;
    highlight(null);
  } finally {
    $("loading").style.opacity = "0";
    busy = false;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.target === input) {
    if (e.key === "Enter" || e.key === "Escape") input.blur();
    return;
  }
  const side = KEY_SIDES[e.key];
  if (side) {
    e.preventDefault();
    pick(side, e.shiftKey);
  }
});

for (const button of document.querySelectorAll("[data-pick]")) {
  button.addEventListener("click", () => pick(button.dataset.pick, "kore" in button.dataset));
}

const percent = (rate) => (rate === null ? "–" : `${Math.round(rate * 100)}%`);
const mark = (pass) => (pass === null ? "判定不可" : pass ? "達成" : "未達");
const count = (value) => (value === null ? "–" : value.toFixed(1));

function showSummary(summary) {
  const { speed, growth, kore, hitokoto } = summary;
  const sukkiri = hitokoto.sukkiri.checks
    .map((c) => `${c.no}回目: Jev の案の部品数 直前 ${count(c.beforeCount)} 個 → 直後 ${count(c.afterCount)} 個`)
    .join("<br>");
  const yotei = hitokoto.yotei.checks
    .map((c) => `${c.no}回目: 直後の Jev の案の次の予定 ${c.sizes.map((s) => SIZE_LABELS[s]).join("・") || "–"}`)
    .join("<br>");
  const rows = [
    ["1. 速さ", speed.pass, `呼び出し時間の中央値 ${speed.medianMs} ms（${speed.limitMs} ms 以内）`],
    ["2. 育つ", growth.pass, `Jev の案が選ばれた割合 最初の10回 ${percent(growth.firstRate)} → 最後の10回 ${percent(growth.lastRate)}`],
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
  if (AUTO) autoRun();
}

async function autoRun() {
  while (!state.done) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    input.value = AUTO_HITOKOTO[state.no] ?? "";
    const { picked, kore } = autoPick(state.pair);
    await pick(picked, kore);
    if ($("message").textContent) return;
  }
}

$("restart").addEventListener("click", start);

content = await (await fetch("/content.json")).json();
start().catch((error) => ($("message").textContent = error.message));
