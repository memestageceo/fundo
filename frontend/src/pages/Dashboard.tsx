import { useEffect, useState } from "react";
import type { Todo } from "../services/types";
import { todosApi } from "../services/api";
import { TodoForm } from "../components/TodoForm";
import { TodoItem } from "../components/TodoItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Filter for all active or completed. woohoo!
 * */
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

  const filterCounts: Record<Filter, number> = {
    all: todos.length,
    active: activeCount,
    completed: completedCount,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Fundo</h1>
          <p className="mt-1 text-muted-foreground text-sm">A minimal to-do dashboard</p>
        </header>

        {/* Create Form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">New To-do</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoForm onSubmit={handleCreate} submitLabel="Add To-do" />
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="flex flex-col h-auto py-2.5 gap-0"
            >
              <Badge
                variant={filter === f ? "secondary" : "outline"}
                className="text-lg font-bold px-2 py-0 mb-0.5 pointer-events-none"
              >
                {filterCounts[f]}
              </Badge>
              <span className="text-xs capitalize">{f}</span>
            </Button>
          ))}
        </div>

        {/* To-do List */}
        {loading && (
          <p className="text-center text-muted-foreground py-8 text-sm">Loading…</p>
        )}
        {error && (
          <Card className="border-destructive mb-4">
            <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
              {error}
              <Button variant="link" onClick={fetchTodos} className="p-0 h-auto text-destructive underline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && !error && filteredTodos.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">
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
