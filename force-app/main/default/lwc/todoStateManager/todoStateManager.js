import { defineState } from '@lwc/state';

export const factory = ({ atom, computed, setAtom }) => {
    const todos = atom([]);
    const remainingCount = computed([todos], (list) => list.filter((t) => !t.done).length);

    const addTodo = (text) => {
        const trimmed = (text ?? '').toString().trim();
        if (!trimmed) return;
        const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setAtom(todos, [...todos.value, { id, text: trimmed, done: false }]);
    };

    const toggleTodo = (id) => {
        setAtom(
            todos,
            todos.value.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        );
    };

    return { todos, remainingCount, addTodo, toggleTodo };
};

export const todoStateManager = defineState(factory);
