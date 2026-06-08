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
