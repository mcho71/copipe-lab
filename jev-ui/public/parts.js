// 部品の見た目と型。部品ごとに小・中・大の3つ。中身は content.json（ダミー）から流し込む。
// 文字の大きさは型で変えるので、部品の中は em で大きさを決める（index.html の tailwind.config）。

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const label = (text) =>
  `<div class="text-[0.7em] tracking-widest text-neutral-400">${escape(text)}</div>`;

function clock(size) {
  const now = new Date();
  const time = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const date = `${now.getMonth() + 1}月${now.getDate()}日（${WEEKDAYS[now.getDay()]}）`;
  if (size === "small") return `<div class="text-2xl font-semibold tabular-nums">${time}</div>`;
  if (size === "medium")
    return `<div class="flex items-baseline justify-between"><div class="text-4xl font-semibold tabular-nums">${time}</div><div class="text-neutral-500">${date}</div></div>`;
  return `<div class="py-4 text-center"><div class="text-7xl font-light tabular-nums">${time}</div><div class="mt-2 text-lg text-neutral-500">${date}</div></div>`;
}

function nextEvent(size, { nextEvent: e }) {
  if (size === "small")
    return `${label("次の予定")}<div class="mt-1 font-medium">${e.start} ${escape(e.title)}</div>`;
  if (size === "medium")
    return `${label("次の予定")}<div class="mt-1 text-xl font-semibold">${escape(e.title)}</div><div class="text-neutral-500">${e.start}–${e.end}・${escape(e.place)}</div>`;
  return `${label("次の予定")}<div class="mt-2 text-4xl font-semibold">${escape(e.title)}</div><div class="mt-2 text-2xl tabular-nums">${e.start}–${e.end}</div><div class="mt-1 text-neutral-500">${escape(e.place)}</div><div class="mt-3 border-t border-neutral-200 pt-3 text-neutral-600">${escape(e.note)}</div>`;
}

function todaySchedule(size, { todaySchedule: items }) {
  if (size === "small")
    return `${label("今日の予定")}<div class="mt-1 font-medium">${items.length}件</div>`;
  const shown = size === "medium" ? items.slice(0, 3) : items;
  const rows = shown
    .map(
      (item) =>
        `<li class="flex gap-3 py-1"><span class="${size === "large" ? "w-36" : "w-14"} shrink-0 tabular-nums text-neutral-500">${item.start}${size === "large" ? `–${item.end}` : ""}</span><span>${escape(item.title)}</span></li>`
    )
    .join("");
  const rest = items.length - shown.length;
  return `${label("今日の予定")}<ul class="mt-1 ${size === "large" ? "divide-y divide-neutral-100 text-lg" : ""}">${rows}</ul>${rest > 0 ? `<div class="text-sm text-neutral-400">ほか${rest}件</div>` : ""}`;
}

function topTasks(size, { topTasks: tasks }) {
  if (size === "small")
    return `${label("タスク")}<div class="mt-1 font-medium">□ ${escape(tasks[0].title)}</div>`;
  const rows = tasks
    .map((task) =>
      size === "medium"
        ? `<li class="py-0.5">□ ${escape(task.title)}</li>`
        : `<li class="flex items-baseline justify-between py-2"><span class="text-lg">□ ${escape(task.title)}</span><span class="text-sm text-neutral-500">${escape(task.project)}・${escape(task.due)}まで</span></li>`
    )
    .join("");
  return `${label("タスク上位3件")}<ul class="mt-1 ${size === "large" ? "divide-y divide-neutral-100" : ""}">${rows}</ul>`;
}

function weather(size, { weather: w }) {
  if (size === "small")
    return `${label("天気")}<div class="mt-1 font-medium">${escape(w.condition)} ${w.temp}°</div>`;
  const head = `<div class="flex items-baseline gap-3"><span class="${size === "large" ? "text-6xl font-light" : "text-3xl font-semibold"} tabular-nums">${w.temp}°</span><span class="text-lg">${escape(w.condition)}</span><span class="text-neutral-500">最高 ${w.high}° / 最低 ${w.low}°</span></div>`;
  if (size === "medium") return `${label(`天気・${w.place}`)}${head}`;
  const hourly = w.hourly
    .map(
      (h) =>
        `<div class="text-center"><div class="text-sm text-neutral-500">${escape(h.time)}</div><div>${escape(h.condition)}</div><div class="tabular-nums">${h.temp}°</div></div>`
    )
    .join("");
  return `${label(`天気・${w.place}`)}${head}<div class="mt-4 grid grid-cols-4 border-t border-neutral-200 pt-3">${hourly}</div>`;
}

function unread(size, { unread: u }) {
  if (size === "small")
    return `${label("未読")}<div class="mt-1 text-2xl font-semibold tabular-nums">${u.total}</div>`;
  const sources = u.sources
    .map((s) => `<span>${escape(s.name)} <b class="tabular-nums">${s.count}</b></span>`)
    .join(`<span class="text-neutral-300">／</span>`);
  if (size === "medium")
    return `${label("未読")}<div class="mt-1 flex items-baseline gap-4"><span class="text-3xl font-semibold tabular-nums">${u.total}</span><span class="flex gap-2 text-neutral-600">${sources}</span></div>`;
  const latest = u.latest
    .map(
      (m) =>
        `<li class="py-1.5"><span class="text-neutral-500">${escape(m.from)}</span>　${escape(m.subject)}</li>`
    )
    .join("");
  return `${label("未読")}<div class="mt-1 flex items-baseline gap-4"><span class="text-5xl font-semibold tabular-nums">${u.total}</span><span class="flex gap-2 text-neutral-600">${sources}</span></div><ul class="mt-3 divide-y divide-neutral-100 border-t border-neutral-200">${latest}</ul>`;
}

function memo(size, { memo: m }) {
  const lines = size === "small" ? m.lines.slice(0, 1) : size === "medium" ? m.lines.slice(0, 2) : m.lines;
  const rows = lines.map((line) => `<li>・${escape(line)}</li>`).join("");
  return `${label("今日のメモ")}<ul class="mt-1 ${size === "large" ? "space-y-1 text-lg" : ""}">${rows}</ul>`;
}

const RENDERERS = { clock, nextEvent, todaySchedule, topTasks, weather, unread, memo };

// 並べ方ごとの列数と、部品の大きさごとの幅
const COLUMNS = {
  one: { grid: "grid-cols-1", span: { small: "col-span-1", medium: "col-span-1", large: "col-span-1" } },
  two: { grid: "grid-cols-2", span: { small: "col-span-1", medium: "col-span-2", large: "col-span-2" } },
  tiles: { grid: "grid-cols-3", span: { small: "col-span-1", medium: "col-span-2", large: "col-span-3" } }
};

const SPACING = {
  tight: { outer: "p-2", gap: "gap-1.5", part: "p-2 rounded-md" },
  normal: { outer: "p-4", gap: "gap-3", part: "p-4 rounded-xl" },
  loose: { outer: "p-8", gap: "gap-6", part: "p-6 rounded-2xl" }
};

const TEXT = { small: "13px", normal: "16px", large: "20px" };

export function renderScreen({ parts, kata }, content) {
  const columns = COLUMNS[kata.columns];
  const spacing = SPACING[kata.spacing];
  const items = parts
    .map(
      ({ part, size }) =>
        `<section data-part="${part}" data-size="${size}" class="part ${columns.span[size]} ${spacing.part} border">${RENDERERS[part](size, content)}</section>`
    )
    .join("");
  return `<div class="ground-${kata.ground} min-h-full ${spacing.outer}" style="font-size: ${TEXT[kata.text]}"><div class="grid grid-flow-row-dense ${columns.grid} ${spacing.gap}">${items}</div></div>`;
}
