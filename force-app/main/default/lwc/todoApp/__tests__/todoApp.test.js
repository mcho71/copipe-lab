import { createElement } from 'lwc';
import TodoApp from 'c/todoApp';

describe('c-todo-app', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the four sibling children in order', () => {
        const el = createElement('c-todo-app', { is: TodoApp });
        document.body.appendChild(el);

        const children = el.shadowRoot.querySelectorAll(
            'c-todo-input, c-todo-list, c-todo-summary, c-todo-debug'
        );
        expect(Array.from(children).map((c) => c.tagName.toLowerCase())).toEqual([
            'c-todo-input',
            'c-todo-list',
            'c-todo-summary',
            'c-todo-debug'
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
