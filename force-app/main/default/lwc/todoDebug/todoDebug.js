import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoDebug extends LightningElement {
    state = fromContext(todoStateManager);

    get json() {
        const v = this.state.value ?? {};
        const snapshot = {
            todos: v.todos ?? [],
            remainingCount: v.remainingCount ?? 0
        };
        return JSON.stringify(snapshot, null, 2);
    }
}
