import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoList extends LightningElement {
    state = fromContext(todoStateManager);

    get todos() {
        const list = this.state.value?.todos ?? [];
        return list.map((t) => ({
            ...t,
            rowClass: t.done ? 'done' : ''
        }));
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.id;
        this.state.value.toggleTodo(id);
    }
}
