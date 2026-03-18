import * as React from "react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "block-start" | "block-end";
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "block-end", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center px-3 py-1.5 bg-muted/50",
        align === "block-start"
          ? "rounded-t-md border-b border-input"
          : "rounded-b-md border-t border-input",
        className
      )}
      {...props}
    />
  )
);
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
InputGroupText.displayName = "InputGroupText";

export type InputGroupTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(
      "rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
));
InputGroupTextarea.displayName = "InputGroupTextarea";

export { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea };
