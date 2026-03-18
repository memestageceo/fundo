import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TodoCreate } from "../services/types";
import { todoFormSchema } from "@/lib/schemas";
import type { TodoFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TodoFormProps {
  onSubmit: (data: TodoCreate) => Promise<void>;
  onCancel?: () => void;
  initialTitle?: string;
  initialDescription?: string;
  submitLabel?: string;
}

export function TodoForm({
  onSubmit,
  onCancel,
  initialTitle = "",
  initialDescription = "",
  submitLabel = "Add To-do",
}: TodoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
    },
  });

  const handleSubmit = async (values: TodoFormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        title: values.title,
        description: values.description || undefined,
      });
      form.reset({ title: "", description: "" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        {serverError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {serverError}
          </p>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title *" maxLength={255} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description (optional)"
                  rows={2}
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? "Saving…" : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
