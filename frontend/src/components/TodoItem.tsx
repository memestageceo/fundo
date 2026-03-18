import { useState } from "react";
import type { Todo } from "../services/types";
import { TodoForm } from "./TodoForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => Promise<void>;
  onUpdate: (id: number, title: string, description?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this to-do?")) return;
    setDeleting(true);
    try {
      await onDelete(todo.id);
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(todo.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li>
      <Card>
        <CardContent className="p-4">
          {editing ? (
            <TodoForm
              initialTitle={todo.title}
              initialDescription={todo.description ?? ""}
              submitLabel="Save changes"
              onSubmit={async ({ title, description }) => {
                await onUpdate(todo.id, title, description);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="flex items-start gap-3">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => onToggle(todo.id, !todo.completed)}
                className="mt-1 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium break-words ${
                    todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {todo.title}
                </p>
                {todo.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground break-words">{todo.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(true)}
                  title="Edit"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Delete"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
