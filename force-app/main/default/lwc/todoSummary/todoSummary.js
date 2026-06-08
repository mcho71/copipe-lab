import { LightningElement } from 'lwc';
import { fromContext } from '@lwc/state';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoSummary extends LightningElement {
    state = fromContext(todoStateManager);

    get remaining() {
        return this.state.value.remainingCount;
    }
}
