import { useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useStoredState } from "../hooks/useStoredState";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const BURST_PARTICLES = 8;

// Run list changes inside a view transition so items slide in and out and the
// rest of the list closes the gap smoothly. flushSync makes React apply the
// update inside the callback, before the browser captures the new state.
function withTransition(update: () => void) {
  if (!document.startViewTransition) return update();
  const transition = document.startViewTransition(() => flushSync(update));
  // A quick second change skips this transition; the update still applies.
  transition.ready.catch(() => {});
}

export function TodoList() {
  const [todos, setTodos] = useStoredState<Todo[]>("todos", []);
  const [draft, setDraft] = useState("");

  const remaining = todos.filter((t) => !t.done).length;
  const hasDone = todos.length > remaining;

  const add = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    withTransition(() => {
      setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
      setDraft("");
    });
  };

  const change = (id: string, patch: Partial<Todo>) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) => withTransition(() => setTodos((prev) => prev.filter((t) => t.id !== id)));

  const clearCompleted = () => withTransition(() => setTodos((prev) => prev.filter((t) => !t.done)));

  return (
    <section className="today__section todos" aria-labelledby="todos-title">
      <header className="panel__header">
        <h3 id="todos-title">To-do</h3>
        {todos.length > 0 && (
          <span className="panel__count">{remaining ? `${remaining} open` : "All clear"}</span>
        )}
      </header>

      <form onSubmit={add}>
        <input
          className="todos__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          aria-label="New task"
          enterKeyHint="done"
        />
      </form>

      {todos.length > 0 && (
        <ul className="todos__list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => change(todo.id, { done: !todo.done })}
              onRename={(text) => (text ? change(todo.id, { text }) : remove(todo.id))}
              onRemove={() => remove(todo.id)}
            />
          ))}
        </ul>
      )}

      {hasDone && (
        <button className="text-button todos__clear" onClick={clearCompleted}>
          Clear completed
        </button>
      )}
    </section>
  );
}

function TodoItem({
  todo,
  onToggle,
  onRename,
  onRemove,
}: {
  todo: Todo;
  onToggle: () => void;
  onRename: (text: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  // Changes each time the item is completed, restarting the burst animation.
  const [burst, setBurst] = useState(0);

  const toggle = () => {
    if (!todo.done) setBurst(Date.now());
    onToggle();
  };

  const finish = () => {
    if (editing !== null) onRename(editing.trim());
    setEditing(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") finish();
    if (e.key === "Escape") setEditing(null);
  };

  return (
    <li className={`todo${todo.done ? " is-done" : ""}`} style={{ viewTransitionName: `todo-${todo.id}` } as CSSProperties}>
      <label className="todo__check">
        <input type="checkbox" checked={todo.done} onChange={toggle} aria-label={`Mark "${todo.text}" done`} />
        {burst > 0 && (
          <span
            key={burst}
            className="todo__burst"
            aria-hidden
            onAnimationEnd={(e) => e.target === e.currentTarget && setBurst(0)}
          >
            {Array.from({ length: BURST_PARTICLES }, (_, i) => (
              <i key={i} style={{ "--i": i } as CSSProperties} />
            ))}
          </span>
        )}
      </label>
      {editing === null ? (
        <span className="todo__text" onDoubleClick={() => setEditing(todo.text)} title="Double-click to edit">
          <span className="todo__label">{todo.text}</span>
        </span>
      ) : (
        <input
          className="todo__edit"
          value={editing}
          onChange={(e) => setEditing(e.target.value)}
          onBlur={finish}
          onKeyDown={onKeyDown}
          aria-label="Edit task"
          autoFocus
        />
      )}
      <button className="icon-button todo__remove" onClick={onRemove} aria-label={`Delete "${todo.text}"`}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </li>
  );
}
