import { createElement } from 'lwc';
import TodoDebug from 'c/todoDebug';

let mockValue = {};
jest.mock('@lwc/state', () => ({
    fromContext: () => ({
        get value() {
            return mockValue;
        }
    })
}));
jest.mock('c/todoStateManager', () => ({ todoStateManager: 'MOCK' }));

describe('c-todo-debug', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders pretty-printed snapshot of current state', async () => {
        mockValue = {
            todos: [{ id: 'a', text: 'first', done: false }],
            remainingCount: 1
        };
        const el = createElement('c-todo-debug', { is: TodoDebug });
        document.body.appendChild(el);
        await Promise.resolve();
        const text = el.shadowRoot.querySelector('pre').textContent;
        expect(text).toContain('"text": "first"');
        expect(text).toContain('"remainingCount": 1');
    });

    it('renders zero values when store is empty', async () => {
        mockValue = { todos: [], remainingCount: 0 };
        const el = createElement('c-todo-debug', { is: TodoDebug });
        document.body.appendChild(el);
        await Promise.resolve();
        const text = el.shadowRoot.querySelector('pre').textContent;
        expect(text).toContain('"todos": []');
        expect(text).toContain('"remainingCount": 0');
    });
});
