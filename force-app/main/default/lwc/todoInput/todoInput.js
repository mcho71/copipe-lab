import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoInput extends LightningElement {
    draft = '';
    state = fromContext(todoStateManager);

    handleChange(event) {
        this.draft = event.detail.value;
    }

    handleAdd() {
        this.state.value.addTodo(this.draft);
        this.draft = '';
    }
}
