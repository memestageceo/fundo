import { useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TodoCreate } from "../services/types";
import { todoFormSchema } from "@/lib/schemas";
import type { TodoFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const titleId = useId();
  const descriptionId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
    },
  });

  const handleFormSubmit = async (values: TodoFormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        title: values.title,
        description: values.description || undefined,
      });
      reset({ title: "", description: "" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor={titleId}>Title</Label>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              id={titleId}
              placeholder="Title *"
              maxLength={255}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              {...field}
            />
          )}
        />
        {errors.title && (
          <p id={`${titleId}-error`} className="text-sm font-medium text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor={descriptionId}>Description</Label>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Textarea
              id={descriptionId}
              placeholder="Description (optional)"
              rows={2}
              maxLength={1000}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
              {...field}
            />
          )}
        />
        {errors.description && (
          <p id={`${descriptionId}-error`} className="text-sm font-medium text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
