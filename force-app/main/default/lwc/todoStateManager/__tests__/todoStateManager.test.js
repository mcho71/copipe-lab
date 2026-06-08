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
