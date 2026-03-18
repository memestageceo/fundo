import { z } from "zod";

export const todoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
});

export type TodoFormValues = z.infer<typeof todoFormSchema>;
