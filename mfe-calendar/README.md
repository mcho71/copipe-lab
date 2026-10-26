# mfe-calendar

ゆるっとSalesforce #80（2026-10-28）のデモ。自作の React 週表示カレンダーを、標準コンポーネント `lightning-ui-embedding`（Salesforce Microfrontend）で Lightning に埋め込む。

| 場所 | 中身 |
|---|---|
| `guest/` | ゲスト。Vite + React + TypeScript。`@salesforce/platform-sdk` で props を受け取り、ドラッグで `eventmove`、週の切り替えで `weekchange` をホストへ送る。Salesforce の API は呼ばない |
| `force-app/main/default/lwc/calendarHost` | ホスト。`lightning-ui-embedding` を置いた LWC（タブ「MFE Calendar」）。行動（Event）を Apex で取得して props で渡し、`eventmove` を受けて Apex で保存する |
| `force-app/main/default/classes/CalendarController.cls` | 自分の行動の取得（`getMyEvents`）と時刻の変更（`moveEvent`） |
| `force-app/main/default/cspTrustedSites` | `http://localhost:5175` を frame-src に許可する Trusted URL |
| `scripts/seed-events.apex` | デモ用の行動を5件入れる（2026-10-12 の週、JST） |

## 動かし方

```sh
# 組織へ
sf project deploy start -o <alias> -d force-app
sf org assign permset -n mfeCalendar -o <alias>
sf apex run -o <alias> -f scripts/seed-events.apex

# ゲスト（発表中は動かしたまま）
cd guest && npm install && npm run dev   # http://localhost:5175
```

組織で「MFE Calendar」タブを開く。

## ハマったところ（2026-10-15）

- **props に配列（オブジェクトの配列）を入れると、ホストがゲストの `ui/subscribe/ui-state` に応答しない。** ゲストの `getViewSDK()` が永遠に resolve しない。エラーもどこにも出ない。予定の一覧を JSON 文字列（`eventsJson`）にして渡したら動いた。レシピ集の props は文字列などの値だけ
- **LWC を再デプロイしても画面が変わらない。** ブラウザが LWC をキャッシュしていた。ユーザーの Debug Mode（`UserPreferencesUserDebugModePref`）を有効にして解消
- **HTML5 のドラッグ＆ドロップは、ブラウザ自動操作では発火しない。** Pointer Events（`setPointerCapture`）で書き直した。タッチでも動く
- 調べる過程で、ゲスト側の通信を `MessagePort.prototype.postMessage` / `addEventListener` を包んで記録した。ホストからの `sf-embedding.bootstrap` → `ui/notifications/host-initialized` → ゲストの `ui/subscribe/ui-state#2` に応答がない、という順で原因に辿り着いた

## 日本語の組織で動くか（2026-10-15、mfe-demo）

- ユーザーの言語を ja にしても、組織の既定言語を ja に変えても動いた（表示・ドラッグでの保存・トースト）
- 英語で作った組織を後から日本語にした場合の結果。最初から既定言語が日本語の組織は未確認

## #80 用の組織（2026-10-15 作成、scratch 組織）

| エイリアス | 既定言語 / ロケール / タイムゾーン | 結果 |
|---|---|---|
| `mfe-cal-en` | en_US / en_US / America/Los_Angeles | 動いた。時刻は「10:00 AM」表記 |
| `mfe-cal-ja` | ja / ja_JP / Asia/Tokyo | **最初から既定言語が日本語の組織でも動いた**（表示・ドラッグでの保存・トースト）。時刻は「10:00」表記 |

- ログイン: `scripts/login-url.sh <alias>` で frontdoor の URL を作る（`sf org open` が期限切れのトークンを返すことがあるため）
- 気づいた点: カレンダーの位置はブラウザのタイムゾーンで計算している。ホストのタイムゾーン（`mfe-cal-en` は America/Los_Angeles）とずれる。発表までに直すか、説明で触れる
