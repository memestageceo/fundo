import { useEffect, useState } from "react";
import type { Todo } from "../services/types";
import { todosApi } from "../services/api";
import { TodoForm } from "../components/TodoForm";
import { TodoItem } from "../components/TodoItem";

type Filter = "all" | "active" | "completed";

export function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchTodos = async () => {
    setError(null);
    try {
      const data = await todosApi.list();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load to-dos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async ({ title, description }: { title: string; description?: string }) => {
    const todo = await todosApi.create({ title, description });
    setTodos((prev) => [todo, ...prev]);
  };

  const handleToggle = async (id: number, completed: boolean) => {
    const updated = await todosApi.update(id, { completed });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleUpdate = async (id: number, title: string, description?: string) => {
    const updated = await todosApi.update(id, { title, description });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDelete = async (id: number) => {
    await todosApi.delete(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">Fundo</h1>
          <p className="mt-1 text-gray-500 text-sm">A minimal to-do dashboard</p>
        </header>

        {/* Create Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">New To-do</h2>
          <TodoForm onSubmit={handleCreate} submitLabel="Add To-do" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-indigo-200"
              }`}
            >
              <span className="block text-lg font-bold">
                {f === "all" ? todos.length : f === "active" ? activeCount : completedCount}
              </span>
              <span className="capitalize">{f}</span>
            </button>
          ))}
        </div>

        {/* To-do List */}
        {loading && (
          <p className="text-center text-gray-400 py-8 text-sm">Loading…</p>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
            {error}
            <button onClick={fetchTodos} className="ml-2 underline text-red-600 hover:text-red-800">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && filteredTodos.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">
            {filter === "all"
              ? "No to-dos yet. Add one above!"
              : `No ${filter} to-dos.`}
          </p>
        )}
        {!loading && (
          <ul className="space-y-3">
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
