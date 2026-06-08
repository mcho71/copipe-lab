# LWC State Managers (Summer '26 GA) サンプル: ToDo

- 作成日: 2026-06-08
- 対象ブランチ: `research/summer26-preview`
- 対象機能: Summer '26 で GA となった LWC State Managers (`@lwc/state`)

## 目的

Summer '26 で Generally Available になった LWC State Managers の挙動を、最小かつ自己完結したサンプルで確認できるようにする。「親が状態を持たず、兄弟LWC同士がストア経由で状態を共有する」というこの機能の核心が一目で伝わる教材を `copipe-lab` (Summer '26 preview スクラッチ組織) 上に配置する。

非目的:

- 既存LWC (`viewingUserList` 等) のリファクタはしない。サンプルは独立して deploy / 削除できる。
- 永続化 (Apex / SObject) はしない。状態はクライアントメモリのみ。
- Experience Cloud 対応は対象外 (State Managers は Lightning Experience / Salesforce App のみ)。

## 成果物の概要

題材は **ToDoリスト**。`atom` + `computed` + `setAtom` の immutable 更新 (配列追加 / 1件書き換え) を一通り示せる。

UI は 3 つの兄弟LWCに分割:

- `todoInput` — 入力フォーム。`addTodo` を呼ぶ。
- `todoList` — 一覧表示 + 完了チェック。`toggleTodo` を呼ぶ。
- `todoSummary` — 未完了件数を表示 (`computed` の購読者)。

3 つを束ねるコンテナ `todoApp` の JS は空クラス、HTML は3兄弟を並べるだけ。これによって「親が状態を持たない」が視覚的に確認できる。

## アーキテクチャ

```
[todoApp (空コンテナ)]
   ├─ <c-todo-input>     ─ addTodo()
   ├─ <c-todo-list>      ─ todos を購読 / toggleTodo()
   └─ <c-todo-summary>   ─ remainingCount を購読
              ↑↓ 全LWCが fromContext で接続
        [todoStateManager (defineState)]
          atom: todos
          computed: remainingCount
          action: addTodo / toggleTodo
```

- 共有ストアは `.html` を持たない LWC バンドルとして配置し、`isExposed=false` で他LWCからの `import` 専用にする。
- Custom Event / Lightning Message Service / Platform Event / `@api` プロパティは一切使わない。State Manager だけで通信する。

## ファイル構成

```
force-app/main/default/
  lwc/
    todoStateManager/
      todoStateManager.js
      todoStateManager.js-meta.xml          (isExposed=false)
    todoApp/
      todoApp.html
      todoApp.js
      todoApp.js-meta.xml                   (targets: lightning__AppPage)
      __tests__/todoApp.test.js
    todoInput/
      todoInput.html
      todoInput.js
      todoInput.js-meta.xml
      __tests__/todoInput.test.js
    todoList/
      todoList.html
      todoList.js
      todoList.js-meta.xml
      __tests__/todoList.test.js
    todoSummary/
      todoSummary.html
      todoSummary.js
      todoSummary.js-meta.xml
      __tests__/todoSummary.test.js
  flexipages/
    TodoApp_UiPage.flexipage-meta.xml       (App Page, todoApp を1つ配置)
  tabs/
    TodoApp_UiPage.tab-meta.xml             (上記 FlexiPage を参照する Lightning Page Tab)
  permissionsets/
    LwcStateManagerDemo.permissionset-meta.xml  (上記 Tab の Visible 設定)
```

`sfdx-project.json` の `sourceApiVersion` を Summer '26 相当 (66.0 想定) に更新する。実装着手時に preview スクラッチ組織の `sf` 出力で正しい値を確定する。

## ストア設計 (`todoStateManager.js`)

```js
import { defineState } from '@lwc/state';

export const todoStateManager = defineState(({ atom, computed, setAtom }) => {
  const todos = atom([]); // { id: string, text: string, done: boolean }[]
  const remainingCount = computed([todos], (list) => list.filter((t) => !t.done).length);

  const addTodo = (text) => {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return;
    setAtom(todos, [...todos.value, { id: crypto.randomUUID(), text: trimmed, done: false }]);
  };

  const toggleTodo = (id) => {
    setAtom(todos, todos.value.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return { todos, remainingCount, addTodo, toggleTodo };
});
```

ねらい:

- `setAtom` での immutable 更新を 2 パターン (配列の末尾追加 / `map` による 1 件書き換え) 提示する。
- `computed` は依存 atom (`todos`) が変わると自動で再評価されることを `remainingCount` で示す。
- ストアの API はオブジェクトの形で返し、`fromContext` 経由の利用側から `state.value.addTodo(...)` のように呼べる。

## コンポーネント設計 (各LWC)

### `todoInput`
- 役割: テキスト入力と追加ボタン。
- JS: `state = fromContext(this, todoStateManager)`。`handleChange` で内部 `draft` を更新、`handleAdd` で `state.value.addTodo(this.draft)` を呼び `draft` を空にする。
- HTML: `lightning-input` + `lightning-button`。

### `todoList`
- 役割: ToDo 一覧表示と完了チェック。
- JS: `state = fromContext(this, todoStateManager)`。`get todos()` は `this.state.value.todos` を返す。`handleToggle(event)` で `state.value.toggleTodo(event.currentTarget.dataset.id)`。
- HTML: `<template for:each={todos} for:item="t">` で `lightning-input type="checkbox"` を描画。`data-id={t.id}` をハンドラに渡す。

### `todoSummary`
- 役割: 未完了件数を表示。
- JS: `state = fromContext(this, todoStateManager)`。`get remaining() { return this.state.value.remainingCount; }`。
- HTML: 「残り N 件」だけのシンプル表示。

### `todoApp`
- 役割: コンテナ。
- JS: `export default class TodoApp extends LightningElement {}` のみ。
- HTML: `lightning-card` の中に `<c-todo-input/> <c-todo-list/> <c-todo-summary/>` を並べる。
- `.js-meta.xml`: `targets` に `lightning__AppPage` を指定。

## データフロー

1. ページロード時、3 つの兄弟 LWC が `fromContext(this, todoStateManager)` で同一ストアに接続。
2. ユーザーが入力 → `todoInput.handleAdd` → `state.value.addTodo(text)` → `setAtom(todos, ...)`。
3. `todos` 変化 → `remainingCount` の `computed` が再評価。
4. 購読者 (`todoList` の `todos` getter, `todoSummary` の `remaining` getter) が自動で再レンダー。
5. ユーザーがチェック → `todoList.handleToggle` → `state.value.toggleTodo(id)` → 同様に伝播。

State Manager 以外の通信機構 (Custom Event, LMS, Platform Event) は登場させない。

## エラーハンドリング方針

サンプルなので最小限:

- `addTodo` は空白のみ / null / undefined を黙って破棄する。
- それ以外の入力検証 / try-catch / ユーザー通知は行わない。
- 信頼境界はストアの公開 API (`addTodo`, `toggleTodo`) のみとする。

## 配置と権限

- App Page (FlexiPage) `TodoApp_UiPage` を作り、`todoApp` 1 つだけ region に配置。
- Lightning Page Tab `TodoApp_UiPage` を作り、上記 FlexiPage を参照。
- 専用 permset `LwcStateManagerDemo` を新設し、`tabSettings` で上記 Tab を `Visible` にする。
- 既存 `ViewingUserList` permset には触らない (サンプル独立性の維持)。
- 動作確認手順 (実装後 README または scripts に追記): `sf project deploy start` → `sf org assign permset -n LwcStateManagerDemo` → `sf org open --path /lightning/n/TodoApp_UiPage`。

## テスト方針

各LWCに 1 ファイルずつ Jest テストを置く (`__tests__/`)。

- `c/todoStateManager` を `jest.mock` で差し替え、ダミーストアを `fromContext` の戻り値に固定する。
- `todoInput`: 入力後にダミーストアの `addTodo` が期待値で呼ばれることを検証。
- `todoList`: ダミーの `todos` 配列を渡してリストが描画されること、チェック操作で `toggleTodo` が正しい id で呼ばれることを検証。
- `todoSummary`: ダミーの `remainingCount` を渡して表示文言を検証。
- `todoApp`: 子コンポーネントが期待通り配置されることだけを軽く確認 (snapshot は使わない)。

フォールバック規定: 実装着手時にまず `@lwc/state` の Jest 互換 (LWC test utils が `@lwc/state` 経由のレンダーを処理できるか) を確認する。preview 段階で Jest 経由のレンダーがエラーになる場合は、各 `__tests__/` を削除した上で、サンプル README コメントとして「Jest 対応待ち」を明記して着地させる。

## 既知の不確実点 / 確認が必要な点

- **`sourceApiVersion` の正確な値**: Summer '26 を有効にする値 (66.0 想定) を、実装時に preview スクラッチで `sf` の出力から確定する。
- **`@lwc/state` の Jest サポート状況**: 上記テスト方針のフォールバックで吸収する。
- **`crypto.randomUUID()` 可用性**: Lightning Experience の最新ブラウザサポート範囲で動作する想定。万一動かない preview 環境があれば、ストア内で簡易 ID 生成 (`++n` カウンタ) にフォールバック。
- **FlexiPage / Tab の API バージョン**: 既存ファイル (例: `viewingUserList.tab-meta.xml`) と同等の指定に合わせる。

## スコープ外 (やらない)

- 既存 LWC への State Manager 適用 / リファクタ。
- Apex / SObject 連携、永続化、サーバ往復。
- 多言語化、a11y 強化、デザイン磨き。
- Experience Cloud 対応。
- パッケージ化 / unmanaged package の生成。

## 実装の終わりの状態

- preview スクラッチ組織に `sf project deploy start` でデプロイでき、`sf org assign permset -n LwcStateManagerDemo` 後に `/lightning/n/TodoApp_UiPage` で 3 兄弟 LWC が動作する。
- 入力フォームでの追加・一覧でのトグル・サマリの未完了件数が、State Manager のみを通じて連動する。
- Jest テストが緑 (フォールバック条件に該当しない場合)。
- 既存機能 (`viewingUserList` 等) に副作用がない。
