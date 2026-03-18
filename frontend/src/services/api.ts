import type { Todo, TodoCreate, TodoUpdate } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const todosApi = {
  list(): Promise<Todo[]> {
    return request<Todo[]>("/todos/");
  },

  get(id: number): Promise<Todo> {
    return request<Todo>(`/todos/${id}`);
  },

  create(data: TodoCreate): Promise<Todo> {
    return request<Todo>("/todos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: TodoUpdate): Promise<Todo> {
    return request<Todo>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return request<void>(`/todos/${id}`, { method: "DELETE" });
  },
};
