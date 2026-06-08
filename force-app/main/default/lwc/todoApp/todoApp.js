import { LightningElement } from 'lwc';
import { todoStateManager } from 'c/todoStateManager';

export default class TodoApp extends LightningElement {
    todoState = todoStateManager();
}
