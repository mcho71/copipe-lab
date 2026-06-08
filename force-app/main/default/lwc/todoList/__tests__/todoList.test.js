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
