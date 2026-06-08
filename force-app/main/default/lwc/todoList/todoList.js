import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoList extends LightningElement {
    state = fromContext(todoStateManager);

    get todos() {
        return this.state.value.todos;
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.id;
        this.state.value.toggleTodo(id);
    }
}
