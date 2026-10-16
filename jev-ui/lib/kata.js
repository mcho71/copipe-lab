// 型: 画面全体の見た目の決まり。4つの軸から1つずつ選ぶ。

export const KATA_AXES = [
  {
    id: "columns",
    name: "並べ方",
    question: "部品を何列で並べるか",
    options: {
      one: { label: "1列", description: "1列: 部品を縦に1列で並べる" },
      two: {
        label: "2列",
        description: "2列: 小さい部品は2つ横に並べ、中・大の部品は横いっぱいに出す"
      },
      tiles: {
        label: "タイル3列",
        description: "タイル3列: 部品を3列のタイル状に敷き詰める"
      }
    }
  },
  {
    id: "spacing",
    name: "余白",
    question: "部品の間と内側の余白をどれくらい取るか",
    options: {
      tight: { label: "詰める", description: "詰める: 余白を小さくして、一度に多くを見せる" },
      normal: { label: "ふつう", description: "ふつう: ほどよい余白" },
      loose: { label: "広い", description: "広い: 余白を大きく取って、ゆったり見せる" }
    }
  },
  {
    id: "text",
    name: "文字",
    question: "文字をどの大きさにするか",
    options: {
      small: { label: "小", description: "小: 文字を小さめにして、情報を多く収める" },
      normal: { label: "ふつう", description: "ふつう: ふつうの文字の大きさ" },
      large: { label: "大", description: "大: 文字を大きくして、離れていても読みやすくする" }
    }
  },
  {
    id: "ground",
    name: "地",
    question: "画面の地の色をどちらにするか",
    options: {
      white: { label: "白地", description: "白地: 白い背景に黒い文字" },
      black: { label: "黒地", description: "黒地: 黒い背景に白い文字" }
    }
  }
];

export const KATA_IDS = KATA_AXES.map((axis) => axis.id);
