import { useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TodoCreate } from "../services/types";
import { todoFormSchema } from "@/lib/schemas";
import type { TodoFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

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
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TodoFormValues>({
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
      form.reset({ title: "", description: "" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-3">
          {serverError}
        </p>
      )}

      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
              <Input
                {...field}
                id={`${formId}-title`}
                placeholder="Title *"
                maxLength={255}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-description`}>
                Description
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id={`${formId}-description`}
                  placeholder="Description (optional)"
                  rows={2}
                  maxLength={1000}
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {(field.value ?? "").length}/1000 characters
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex gap-2 mt-4">
        <Button
          type="submit"
          form={formId}
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
  );
}
