# LWC State Managers ToDo サンプル 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Summer '26 で GA となった LWC State Managers (`@lwc/state`) を、3 兄弟LWC + 空コンテナ + 共有ストア構成の ToDo サンプルで実演し、preview スクラッチ組織上で動作確認できる状態にする。

**Architecture:** `defineState` で `todos` atom と `remainingCount` computed、`addTodo` / `toggleTodo` action を持つストアを LWC バンドル `c/todoStateManager` として配置。3 兄弟LWC (`todoInput` / `todoList` / `todoSummary`) が `fromContext` でストアに接続し、コンテナ `todoApp` は HTML で並べるだけ。App Page → Tab → 専用 permset で導線を作る。

**Tech Stack:** LWC (`@lwc/state` Summer '26 GA), `sfdx-lwc-jest`, Salesforce CLI (`sf`), Salesforce Metadata API (FlexiPage / CustomTab / PermissionSet).

**Spec:** `docs/superpowers/specs/2026-06-08-lwc-state-managers-todo-sample-design.md`

**前提:** 作業前に preview スクラッチ組織が利用可能であること (`sf org open` が成功する状態)。 `npm install` 済み。

**コミット規約:** 既存リポの慣習に合わせて prefix は `feat:` / `chore:` / `test:` を使う。各 Task の末尾で commit。

---

## Task 0: 環境スパイクと API バージョン更新

**目的:** Summer '26 の API バージョン値を確定し、`sfdx-project.json` を更新する。`@lwc/state` の Jest 互換可否をこの段階で観測し、後続タスクのテスト方針を確定する。

**Files:**
- Modify: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/sfdx-project.json`

- [ ] **Step 1: preview スクラッチ組織の API バージョンを取得**

Run:
```bash
sf org display --target-org copipelab-SCRATCH --json | jq -r '.result.apiVersion'
```
Expected: `66.0` 前後の数字が表示される (Summer '26 想定値)。値を `<APIVER>` として控える。
取得できない場合は `sf org list` で組織状態を確認し、必要なら `npm run org:create` で作り直してから再実行。

- [ ] **Step 2: `sfdx-project.json` の `sourceApiVersion` を更新**

`sourceApiVersion` を取得した `<APIVER>` に書き換え。例 (66.0 の場合):
```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true
    }
  ],
  "name": "copipe-lab",
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "66.0"
}
```

- [ ] **Step 3: `@lwc/state` の Jest 互換確認 (スパイク)**

`__tests__/spike-lwc-state.test.js` (一時ファイル) をリポ直下に作成:
```js
describe('lwc-state availability', () => {
  it('imports defineState without error', () => {
    expect(() => require('@lwc/state')).not.toThrow();
  });
});
```

Run:
```bash
npm run test:unit -- spike-lwc-state
```
Expected の分岐:
- **PASS** → `@lwc/state` が Jest から見えるので、後続のコンポーネントテストで `fromContext` を `jest.mock('@lwc/state')` できる前提で進める。
- **FAIL (Cannot find module '@lwc/state')** → `sfdx-lwc-jest` のバージョンが Summer '26 に追い付いていない。後続タスクのテストでは `jest.mock('@lwc/state', ..., { virtual: true })` を使う。Plan の後続 Step で対応済み。
- 結果をスパイクファイル冒頭にコメントで記録し、`spike-lwc-state.test.js` は削除。

- [ ] **Step 4: 動作確認**

Run:
```bash
git status
```
Expected: `sfdx-project.json` のみ変更されている (スパイクファイルは削除済み)。

- [ ] **Step 5: Commit**

```bash
git add sfdx-project.json
git commit -m "chore: bump sourceApiVersion to Summer '26 (<APIVER>)"
```

---

## Task 1: 共有ストア `c/todoStateManager` 作成 (TDD)

**目的:** `@lwc/state` の `defineState` を使った ToDo ストアを、HTML を持たない LWC バンドルとして配置する。ロジックを `factory` 関数として切り出してテスト可能にする。

**Files:**
- Create: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/force-app/main/default/lwc/todoStateManager/todoStateManager.js`
- Create: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/force-app/main/default/lwc/todoStateManager/todoStateManager.js-meta.xml`
- Create: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/force-app/main/default/lwc/todoStateManager/__tests__/todoStateManager.test.js`
- Create: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/force-app/test/jest-mocks/lwc-state.js`
- Modify: `/Users/mcho/ghq/github.com/mcho71/copipe-lab/jest.config.js`

- [ ] **Step 0: `@lwc/state` の Jest 用スタブを用意**

`@lwc/state` は `sfdx-lwc-jest@1.1.0` にまだバンドルされていない (Task 0 のスパイクで確認済み)。Jest 解決を通すために以下を追加する。

`force-app/test/jest-mocks/lwc-state.js` (新規):
```js
// Jest-only stub for @lwc/state. The Summer '26 SDK is not yet bundled
// with sfdx-lwc-jest, so tests resolve this stub via moduleNameMapper.
// Each test typically further overrides this via jest.mock(...).
export const defineState = () => null;
export const fromContext = () => ({ value: {} });
```

`jest.config.js` (修正): 既存の `moduleNameMapper` をスプレッドで保持しつつ追加:
```js
const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
    ...jestConfig,
    modulePathIgnorePatterns: ['<rootDir>/.localdevserver'],
    moduleNameMapper: {
        ...(jestConfig.moduleNameMapper || {}),
        '^@lwc/state$': '<rootDir>/force-app/test/jest-mocks/lwc-state.js'
    }
};
```

これ以降の Task 2-5 では `jest.mock('@lwc/state', () => (...))` だけで足り、`{ virtual: true }` は不要 (moduleNameMapper で実体解決されるため)。

- [ ] **Step 1: 失敗するテストを書く**

`force-app/main/default/lwc/todoStateManager/__tests__/todoStateManager.test.js`:
```js
import { factory } from 'c/todoStateManager';

// defineState の DI 引数を直接テストするため factory を export している
// atom / computed / setAtom はテスト用の最小スタブで挙動を再現
function makeHarness() {
    const atom = (initial) => ({ value: initial });
    const setAtom = (a, next) => { a.value = next; };
    const computed = (deps, fn) => ({ get value() { return fn(...deps.map((d) => d.value)); } });
    return factory({ atom, computed, setAtom });
}

describe('todoStateManager factory', () => {
    it('starts with empty todos and 0 remaining', () => {
        const s = makeHarness();
        expect(s.todos.value).toEqual([]);
        expect(s.remainingCount.value).toBe(0);
    });

    it('addTodo appends a trimmed item', () => {
        const s = makeHarness();
        s.addTodo('  buy milk  ');
        expect(s.todos.value).toHaveLength(1);
        expect(s.todos.value[0].text).toBe('buy milk');
        expect(s.todos.value[0].done).toBe(false);
        expect(typeof s.todos.value[0].id).toBe('string');
        expect(s.remainingCount.value).toBe(1);
    });

    it('addTodo ignores blank input', () => {
        const s = makeHarness();
        s.addTodo('   ');
        s.addTodo('');
        s.addTodo(null);
        s.addTodo(undefined);
        expect(s.todos.value).toEqual([]);
    });

    it('toggleTodo flips done for matching id only', () => {
        const s = makeHarness();
        s.addTodo('a');
        s.addTodo('b');
        const target = s.todos.value[0];
        s.toggleTodo(target.id);
        expect(s.todos.value[0].done).toBe(true);
        expect(s.todos.value[1].done).toBe(false);
        expect(s.remainingCount.value).toBe(1);
    });

    it('toggleTodo is a no-op for unknown id', () => {
        const s = makeHarness();
        s.addTodo('a');
        const before = s.todos.value;
        s.toggleTodo('nonexistent');
        expect(s.todos.value).toEqual(before);
    });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run:
```bash
npm run test:unit -- todoStateManager
```
Expected: FAIL (`Cannot find module 'c/todoStateManager'`)

- [ ] **Step 3: 実装ファイルを作成**

`force-app/main/default/lwc/todoStateManager/todoStateManager.js`:
```js
import { defineState } from '@lwc/state';

export const factory = ({ atom, computed, setAtom }) => {
    const todos = atom([]);
    const remainingCount = computed([todos], (list) => list.filter((t) => !t.done).length);

    const addTodo = (text) => {
        const trimmed = (text ?? '').toString().trim();
        if (!trimmed) return;
        const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setAtom(todos, [...todos.value, { id, text: trimmed, done: false }]);
    };

    const toggleTodo = (id) => {
        setAtom(
            todos,
            todos.value.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        );
    };

    return { todos, remainingCount, addTodo, toggleTodo };
};

export const todoStateManager = defineState(factory);
```

- [ ] **Step 4: バンドルメタを作成 (isExposed=false の共有モジュール)**

`force-app/main/default/lwc/todoStateManager/todoStateManager.js-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>
```
注: `apiVersion` は Task 0 で確定した `<APIVER>` 値に揃える。以下、本計画内のすべての `.js-meta.xml` / `.flexipage-meta.xml` / `.tab-meta.xml` / `.permissionset-meta.xml` でも同様。

- [ ] **Step 5: テスト緑を確認**

Run:
```bash
npm run test:unit -- todoStateManager
```
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add force-app/main/default/lwc/todoStateManager/ \
        force-app/test/jest-mocks/lwc-state.js \
        jest.config.js
git commit -m "feat: add todoStateManager LWC shared store for State Managers demo

@lwc/state is not yet bundled with sfdx-lwc-jest@1.1.0 in Summer '26 preview,
so add a Jest moduleNameMapper alias pointing at a no-op stub. Component tests
will further override via jest.mock as needed."
```

---

## Task 2: `c/todoInput` 作成 (TDD)

**目的:** ストアの `addTodo` を呼ぶ入力フォームLWC。

**Files:**
- Create: `force-app/main/default/lwc/todoInput/todoInput.js`
- Create: `force-app/main/default/lwc/todoInput/todoInput.html`
- Create: `force-app/main/default/lwc/todoInput/todoInput.js-meta.xml`
- Create: `force-app/main/default/lwc/todoInput/__tests__/todoInput.test.js`

- [ ] **Step 1: 失敗するテストを書く**

`force-app/main/default/lwc/todoInput/__tests__/todoInput.test.js`:
```js
import { createElement } from 'lwc';
import TodoInput from 'c/todoInput';

const mockAddTodo = jest.fn();
jest.mock('@lwc/state', () => ({
    fromContext: () => ({ value: { addTodo: mockAddTodo } })
}));
jest.mock('c/todoStateManager', () => ({ todoStateManager: 'MOCK' }));

describe('c-todo-input', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        mockAddTodo.mockReset();
    });

    it('calls addTodo with the input value and clears the field on add', async () => {
        const el = createElement('c-todo-input', { is: TodoInput });
        document.body.appendChild(el);

        const input = el.shadowRoot.querySelector('lightning-input');
        input.dispatchEvent(new CustomEvent('change', { detail: { value: 'write spec' } }));
        await Promise.resolve();

        const button = el.shadowRoot.querySelector('lightning-button');
        button.dispatchEvent(new CustomEvent('click'));

        await Promise.resolve();
        expect(mockAddTodo).toHaveBeenCalledWith('write spec');
        expect(input.value).toBe('');
    });

    it('forwards an empty string to the store when nothing typed (store enforces blank validation)', () => {
        const el = createElement('c-todo-input', { is: TodoInput });
        document.body.appendChild(el);
        const button = el.shadowRoot.querySelector('lightning-button');
        button.dispatchEvent(new CustomEvent('click'));
        expect(mockAddTodo).toHaveBeenCalledWith('');
        // Note: blank validation is enforced inside the store; the component just forwards
    });
});
```
※ 2 つ目の it は「コンポーネント側は素直に転送し、空白破棄はストアの責務」を明示するための docs テスト。意図的に `toHaveBeenCalledWith('')` をアサート。

- [ ] **Step 2: テスト失敗を確認**

Run:
```bash
npm run test:unit -- todoInput
```
Expected: FAIL (`Cannot find module 'c/todoInput'`)

- [ ] **Step 3: コンポーネント JS**

`force-app/main/default/lwc/todoInput/todoInput.js`:
```js
import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoInput extends LightningElement {
    draft = '';
    state = fromContext(this, todoStateManager);

    handleChange(event) {
        this.draft = event.detail.value;
    }

    handleAdd() {
        this.state.value.addTodo(this.draft);
        this.draft = '';
    }
}
```

- [ ] **Step 4: コンポーネント HTML**

`force-app/main/default/lwc/todoInput/todoInput.html`:
```html
<template>
    <div class="slds-grid slds-gutters slds-grid_vertical-align-end slds-p-around_x-small">
        <div class="slds-col slds-grow">
            <lightning-input
                label="New ToDo"
                value={draft}
                onchange={handleChange}
            ></lightning-input>
        </div>
        <div class="slds-col slds-grow-none">
            <lightning-button label="Add" variant="brand" onclick={handleAdd}></lightning-button>
        </div>
    </div>
</template>
```

- [ ] **Step 5: メタ**

`force-app/main/default/lwc/todoInput/todoInput.js-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>
```

- [ ] **Step 6: テスト緑確認**

Run:
```bash
npm run test:unit -- todoInput
```
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add force-app/main/default/lwc/todoInput/
git commit -m "feat: add todoInput LWC that calls addTodo on the shared store"
```

---

## Task 3: `c/todoList` 作成 (TDD)

**目的:** ストアの `todos` を描画し、チェックで `toggleTodo` を呼ぶ。

**Files:**
- Create: `force-app/main/default/lwc/todoList/todoList.js`
- Create: `force-app/main/default/lwc/todoList/todoList.html`
- Create: `force-app/main/default/lwc/todoList/todoList.js-meta.xml`
- Create: `force-app/main/default/lwc/todoList/__tests__/todoList.test.js`

- [ ] **Step 1: 失敗するテストを書く**

`force-app/main/default/lwc/todoList/__tests__/todoList.test.js`:
```js
import { createElement } from 'lwc';
import TodoList from 'c/todoList';

const mockToggleTodo = jest.fn();
const mockStoreValue = {
    todos: [
        { id: 'a', text: 'first', done: false },
        { id: 'b', text: 'second', done: true }
    ],
    toggleTodo: mockToggleTodo
};
jest.mock('@lwc/state', () => ({
    fromContext: () => ({ value: mockStoreValue })
}));
jest.mock('c/todoStateManager', () => ({ todoStateManager: 'MOCK' }));

describe('c-todo-list', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        mockToggleTodo.mockReset();
    });

    it('renders one row per todo with checkbox state', async () => {
        const el = createElement('c-todo-list', { is: TodoList });
        document.body.appendChild(el);
        await Promise.resolve();

        const rows = el.shadowRoot.querySelectorAll('li');
        expect(rows).toHaveLength(2);
        const checkboxes = el.shadowRoot.querySelectorAll('lightning-input');
        expect(checkboxes[0].checked).toBe(false);
        expect(checkboxes[1].checked).toBe(true);
    });

    it('calls toggleTodo with the row id when checkbox toggles', async () => {
        const el = createElement('c-todo-list', { is: TodoList });
        document.body.appendChild(el);
        await Promise.resolve();

        const firstCheckbox = el.shadowRoot.querySelector('lightning-input');
        firstCheckbox.dispatchEvent(new CustomEvent('change'));
        expect(mockToggleTodo).toHaveBeenCalledWith('a');
    });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run:
```bash
npm run test:unit -- todoList
```
Expected: FAIL (`Cannot find module 'c/todoList'`)

- [ ] **Step 3: コンポーネント JS**

`force-app/main/default/lwc/todoList/todoList.js`:
```js
import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoList extends LightningElement {
    state = fromContext(this, todoStateManager);

    get todos() {
        return this.state.value.todos;
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.id;
        this.state.value.toggleTodo(id);
    }
}
```

- [ ] **Step 4: コンポーネント HTML**

`force-app/main/default/lwc/todoList/todoList.html`:
```html
<template>
    <ul class="slds-p-around_x-small">
        <template for:each={todos} for:item="t">
            <li key={t.id} class="slds-grid slds-gutters slds-p-vertical_xx-small">
                <lightning-input
                    type="checkbox"
                    label={t.text}
                    checked={t.done}
                    data-id={t.id}
                    onchange={handleToggle}
                ></lightning-input>
            </li>
        </template>
    </ul>
</template>
```

- [ ] **Step 5: メタ**

`force-app/main/default/lwc/todoList/todoList.js-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>
```

- [ ] **Step 6: テスト緑確認**

Run:
```bash
npm run test:unit -- todoList
```
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add force-app/main/default/lwc/todoList/
git commit -m "feat: add todoList LWC that subscribes to todos and calls toggleTodo"
```

---

## Task 4: `c/todoSummary` 作成 (TDD)

**目的:** ストアの `remainingCount` を表示する read-only コンポーネント。

**Files:**
- Create: `force-app/main/default/lwc/todoSummary/todoSummary.js`
- Create: `force-app/main/default/lwc/todoSummary/todoSummary.html`
- Create: `force-app/main/default/lwc/todoSummary/todoSummary.js-meta.xml`
- Create: `force-app/main/default/lwc/todoSummary/__tests__/todoSummary.test.js`

- [ ] **Step 1: 失敗するテストを書く**

`force-app/main/default/lwc/todoSummary/__tests__/todoSummary.test.js`:
```js
import { createElement } from 'lwc';
import TodoSummary from 'c/todoSummary';

let mockCount = 0;
jest.mock('@lwc/state', () => ({
    fromContext: () => ({
        get value() {
            return { remainingCount: mockCount };
        }
    })
}));
jest.mock('c/todoStateManager', () => ({ todoStateManager: 'MOCK' }));

describe('c-todo-summary', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the remainingCount value', async () => {
        mockCount = 3;
        const el = createElement('c-todo-summary', { is: TodoSummary });
        document.body.appendChild(el);
        await Promise.resolve();
        expect(el.shadowRoot.textContent).toContain('3');
    });

    it('renders 0 when there are no incomplete todos', async () => {
        mockCount = 0;
        const el = createElement('c-todo-summary', { is: TodoSummary });
        document.body.appendChild(el);
        await Promise.resolve();
        expect(el.shadowRoot.textContent).toContain('0');
    });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run:
```bash
npm run test:unit -- todoSummary
```
Expected: FAIL (`Cannot find module 'c/todoSummary'`)

- [ ] **Step 3: コンポーネント JS**

`force-app/main/default/lwc/todoSummary/todoSummary.js`:
```js
import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoSummary extends LightningElement {
    state = fromContext(this, todoStateManager);

    get remaining() {
        return this.state.value.remainingCount;
    }
}
```

- [ ] **Step 4: コンポーネント HTML**

`force-app/main/default/lwc/todoSummary/todoSummary.html`:
```html
<template>
    <p class="slds-p-around_x-small slds-text-body_small">
        残り <b>{remaining}</b> 件
    </p>
</template>
```

- [ ] **Step 5: メタ**

`force-app/main/default/lwc/todoSummary/todoSummary.js-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>
```

- [ ] **Step 6: テスト緑確認**

Run:
```bash
npm run test:unit -- todoSummary
```
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add force-app/main/default/lwc/todoSummary/
git commit -m "feat: add todoSummary LWC subscribing to remainingCount computed"
```

---

## Task 5: `c/todoApp` 空コンテナ作成 (TDD)

**目的:** 状態を持たない空クラスのコンテナ。HTML で 3 兄弟を並べるだけ。App Page に配置できる。

**Files:**
- Create: `force-app/main/default/lwc/todoApp/todoApp.js`
- Create: `force-app/main/default/lwc/todoApp/todoApp.html`
- Create: `force-app/main/default/lwc/todoApp/todoApp.js-meta.xml`
- Create: `force-app/main/default/lwc/todoApp/__tests__/todoApp.test.js`

- [ ] **Step 1: 失敗するテストを書く**

`force-app/main/default/lwc/todoApp/__tests__/todoApp.test.js`:
```js
import { createElement } from 'lwc';
import TodoApp from 'c/todoApp';

describe('c-todo-app', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the three sibling children in order', () => {
        const el = createElement('c-todo-app', { is: TodoApp });
        document.body.appendChild(el);

        const children = el.shadowRoot.querySelectorAll(
            'c-todo-input, c-todo-list, c-todo-summary'
        );
        expect(Array.from(children).map((c) => c.tagName.toLowerCase())).toEqual([
            'c-todo-input',
            'c-todo-list',
            'c-todo-summary'
        ]);
    });

    it('owns no state-related fields', () => {
        const el = createElement('c-todo-app', { is: TodoApp });
        document.body.appendChild(el);
        // ensure the container class itself does not expose any todo state
        expect(el.todos).toBeUndefined();
        expect(el.addTodo).toBeUndefined();
    });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run:
```bash
npm run test:unit -- todoApp
```
Expected: FAIL (`Cannot find module 'c/todoApp'`)

- [ ] **Step 3: コンポーネント JS**

`force-app/main/default/lwc/todoApp/todoApp.js`:
```js
import { LightningElement } from 'lwc';

export default class TodoApp extends LightningElement {}
```

- [ ] **Step 4: コンポーネント HTML**

`force-app/main/default/lwc/todoApp/todoApp.html`:
```html
<template>
    <lightning-card title="LWC State Manager Demo: ToDo" icon-name="utility:check">
        <div class="slds-p-around_small">
            <c-todo-input></c-todo-input>
            <c-todo-list></c-todo-list>
            <c-todo-summary></c-todo-summary>
        </div>
    </lightning-card>
</template>
```

- [ ] **Step 5: メタ (App Page target)**

`force-app/main/default/lwc/todoApp/todoApp.js-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle>
```

- [ ] **Step 6: テスト緑確認**

Run:
```bash
npm run test:unit -- todoApp
```
Expected: PASS (2 tests)

- [ ] **Step 7: 全体テストが緑を保っていることを確認**

Run:
```bash
npm run test:unit
```
Expected: 全テスト PASS (このリポの既存テストも含む)。失敗があれば修正してから commit。

- [ ] **Step 8: Commit**

```bash
git add force-app/main/default/lwc/todoApp/
git commit -m "feat: add todoApp empty container that lays out the three siblings"
```

---

## Task 6: FlexiPage (App Page) 作成

**目的:** `todoApp` 1 つだけを region に配置した App Page を作る。

**Files:**
- Create: `force-app/main/default/flexipages/TodoApp_UiPage.flexipage-meta.xml`

- [ ] **Step 1: FlexiPage XML を作成**

注: Summer '26 enforces that `<mode>Replace</mode>` only applies when a parent region is being overridden. For an `AppPage` built on `flexipage:defaultAppHomeTemplate` with a fresh region, omit `<mode>`.

`force-app/main/default/flexipages/TodoApp_UiPage.flexipage-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FlexiPage xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentName>c:todoApp</componentName>
                <identifier>c_todoApp_main</identifier>
            </componentInstance>
        </itemInstances>
        <name>main</name>
        <type>Region</type>
    </flexiPageRegions>
    <masterLabel>LWC State Manager Demo</masterLabel>
    <template>
        <name>flexipage:defaultAppHomeTemplate</name>
    </template>
    <type>AppPage</type>
</FlexiPage>
```

- [ ] **Step 2: 確認**

Run:
```bash
ls force-app/main/default/flexipages/
```
Expected: `TodoApp_UiPage.flexipage-meta.xml` が存在。

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/flexipages/TodoApp_UiPage.flexipage-meta.xml
git commit -m "feat: add TodoApp_UiPage App Page hosting the todoApp container"
```

---

## Task 7: Tab メタ作成

**目的:** App Page を開くための Lightning Page Tab を作る。

**Files:**
- Create: `force-app/main/default/tabs/TodoApp_UiPage.tab-meta.xml`

- [ ] **Step 1: Tab XML を作成**

`force-app/main/default/tabs/TodoApp_UiPage.tab-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPage>TodoApp_UiPage</flexiPage>
    <label>State Manager Demo</label>
    <motif>Custom42: Caduceus</motif>
</CustomTab>
```
※ `motif` は既存 `viewingUserList.tab-meta.xml` を参考に、任意の Custom motif を使用してよい。

- [ ] **Step 2: 確認**

Run:
```bash
ls force-app/main/default/tabs/
```
Expected: `TodoApp_UiPage.tab-meta.xml` が存在。

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/tabs/TodoApp_UiPage.tab-meta.xml
git commit -m "feat: add State Manager Demo Lightning Page tab"
```

---

## Task 8: 権限セット作成

**目的:** タブを Visible にする `LwcStateManagerDemo` 権限セットを新設する (既存 permset には触らない)。

**Files:**
- Create: `force-app/main/default/permissionsets/LwcStateManagerDemo.permissionset-meta.xml`

- [ ] **Step 1: PermissionSet XML を作成**

`force-app/main/default/permissionsets/LwcStateManagerDemo.permissionset-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <hasActivationRequired>false</hasActivationRequired>
    <label>LWC State Manager Demo</label>
    <tabSettings>
        <tab>TodoApp_UiPage</tab>
        <visibility>Visible</visibility>
    </tabSettings>
</PermissionSet>
```

- [ ] **Step 2: 確認**

Run:
```bash
ls force-app/main/default/permissionsets/
```
Expected: `LwcStateManagerDemo.permissionset-meta.xml` と既存 `ViewingUserList.permissionset-meta.xml` の 2 件が存在。

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/permissionsets/LwcStateManagerDemo.permissionset-meta.xml
git commit -m "feat: add LwcStateManagerDemo permset to expose the demo tab"
```

---

## Task 9: デプロイと preview スクラッチ組織での動作確認

**目的:** ローカルで完結する検証 (Jest + ファイル構成) ではなく、preview 組織上でメタが受理されエンドツーエンドで動くことを確認する。

注: Target-org alias updated from `copipelab-SCRATCH` to `copipe-lab-summer26`, since the original scratch expired and was replaced.

**Files:** (なし — 動作確認とドキュメンテーションのみ)

- [ ] **Step 1: Lint と全テストを通す**

Run:
```bash
npm run lint
npm run test:unit
```
Expected: lint エラーなし、全テスト PASS。エラーが出たら修正して再実行。

- [ ] **Step 2: メタの整合性を `validate` でドライラン**

注: Salesforce CLI 2.125.x does not accept `NoTestRun` for `sf project deploy validate`; `RunLocalTests` is effectively no-op when no Apex tests exist.

Run:
```bash
sf project deploy validate --source-dir force-app --target-org copipe-lab-summer26 --test-level RunLocalTests
```
Expected: `Status: Succeeded`。失敗時はエラーメッセージに従って Task 1〜8 のメタを修正し、対応する Task に戻る。

- [ ] **Step 3: 本デプロイ**

Run:
```bash
sf project deploy start --source-dir force-app --target-org copipe-lab-summer26
```
Expected: `Status: Succeeded`。

Fallback: If deploy fails on a pre-existing unrelated LWC (`platformEventSample` has a broken Apex import in `main` as of this branch), use per-component `--source-dir` paths to scope: `--source-dir force-app/main/default/lwc/todoStateManager --source-dir force-app/main/default/lwc/todoInput --source-dir force-app/main/default/lwc/todoList --source-dir force-app/main/default/lwc/todoSummary --source-dir force-app/main/default/lwc/todoApp --source-dir force-app/main/default/flexipages --source-dir force-app/main/default/tabs --source-dir force-app/main/default/permissionsets`.

- [ ] **Step 4: 権限セットを自ユーザーに割り当て**

Run:
```bash
sf org assign permset --name LwcStateManagerDemo --target-org copipe-lab-summer26
```
Expected: `Permset assigned to user ...`

- [ ] **Step 5: ブラウザでタブを開く**

Run:
```bash
sf org open --target-org copipe-lab-summer26 --path /lightning/n/TodoApp_UiPage
```
Expected: 新しいタブで Lightning Experience が開き、「State Manager Demo」タブ上に Input / List / Summary の 3 セクションが見える。

- [ ] **Step 6: 動作確認 (手動)**

ブラウザで以下を確認:
- 入力フィールドに `buy milk` と入力 → Add を押す → リストに 1 件追加 → Summary が「残り 1 件」
- もう 1 件 `walk dog` を追加 → Summary 「残り 2 件」
- 1 件目のチェックボックスを ON → Summary 「残り 1 件」、List のテキスト体裁はそのまま、チェック状態のみ反映
- 全件チェック ON → Summary 「残り 0 件」
- 空欄で Add を押す → 追加されないこと
- ページをリロード → ToDo は消える (永続化なし、仕様通り)

- [ ] **Step 7: 結果メモを README またはコミットメッセージに残す**

確認結果を 1 行で要約し、最後の commit メッセージか PR 説明用に保存しておく。例:
```
動作確認: 2026-06-08 preview org で input/list/summary が State Manager 経由で連動することを確認
```

- [ ] **Step 8: Final commit (動作確認の記録だけが必要なら)**

動作確認が成功し、コード変更が発生しなかった場合は新規 commit 不要。動作確認中に修正が入った場合のみ、修正分を該当 Task 名に沿った commit メッセージで追加する。

---

## Self-Review チェック (実装者向け)

- [ ] **Spec 全要件のカバレッジ**: spec の「ファイル構成」「ストア設計」「コンポーネント設計」「データフロー」「エラーハンドリング方針」「配置と権限」「テスト方針」のそれぞれが Task 0〜9 のいずれかに対応していること。
- [ ] **API version の整合性**: Task 0 で確定した `<APIVER>` が Task 1〜5 のすべての `.js-meta.xml`、Task 6 の `.flexipage-meta.xml`、Task 7 の `.tab-meta.xml`、Task 8 の `.permissionset-meta.xml` で同じ値になっていること。
- [ ] **`fromContext` モック方針の一貫性**: Task 2〜4 のテストで `jest.mock('@lwc/state', ..., { virtual: true })` のパターンが揃っていること (Task 1 の factory テストはこれを使わない別経路)。
- [ ] **不確実点のハンドリング**: spec の「不確実点」(API version, Jest 互換, crypto.randomUUID) がそれぞれ Task 0 か実装内で吸収されていること。

---

## スコープ外 (この計画では対応しない)

- 既存 LWC (`viewingUserList` 等) のリファクタ。
- Apex / SObject 連携。
- 永続化、多言語化、a11y 強化、デザイン磨き。
- パッケージ化。
