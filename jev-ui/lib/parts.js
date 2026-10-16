// ホーム画面の部品と大きさ。Jev は部品を作らず、この中から大きさを選ぶだけ。

export const PARTS = [
  { id: "clock", name: "時計", description: "現在の時刻と日付" },
  {
    id: "nextEvent",
    name: "次の予定",
    description: "直近の予定1件のタイトル・時刻・場所"
  },
  {
    id: "todaySchedule",
    name: "今日の予定一覧",
    description: "今日の予定を時刻順に並べたもの"
  },
  {
    id: "topTasks",
    name: "タスク上位3件",
    description: "優先度の高いタスク3件と期限"
  },
  { id: "weather", name: "天気", description: "今日の天気と気温" },
  {
    id: "unread",
    name: "未読数",
    description: "メールやチャットの未読の数と新着"
  },
  { id: "memo", name: "今日のメモ", description: "今日のための短いメモ書き" }
];

export const PART_IDS = PARTS.map((part) => part.id);

// 小さい順。none は「出さない」。
export const SIZES = ["none", "small", "medium", "large"];

export const SIZE_LABELS = {
  none: "出さない",
  small: "小",
  medium: "中",
  large: "大"
};

export const SIZE_DESCRIPTIONS = {
  none: "出さない: この部品をホーム画面に置かない",
  small: "小: 横半分の小さな枠に、要点だけを1〜2行で出す",
  medium: "中: 横いっぱいの枠に、要点と少しの詳細を出す",
  large: "大: 横いっぱいの大きな枠に、詳細まで目立つように出す"
};
