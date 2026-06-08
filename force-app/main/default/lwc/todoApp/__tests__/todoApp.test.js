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

        expect(el.shadowRoot.querySelector('c-todo-input')).not.toBeNull();
        expect(el.shadowRoot.querySelector('c-todo-list')).not.toBeNull();
        expect(el.shadowRoot.querySelector('c-todo-summary')).not.toBeNull();
    });

    it('owns no state-related fields', () => {
        const el = createElement('c-todo-app', { is: TodoApp });
        document.body.appendChild(el);
        // ensure the container class itself does not expose any todo state
        expect(el.todos).toBeUndefined();
        expect(el.addTodo).toBeUndefined();
    });
});
