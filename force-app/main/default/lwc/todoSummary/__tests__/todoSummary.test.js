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
