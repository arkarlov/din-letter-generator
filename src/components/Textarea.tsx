"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { Field } from "./Field";

type Props = {
  label: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, name, error, className, ...props }, ref) => {
    return (
      <Field label={label} name={name} error={error}>
        <textarea
          ref={ref}
          id={name}
          name={name}
          className={clsx(
            "w-full rounded-lg border p-3 text-sm outline-none transition",
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-300"
              : "border-gray-300 focus:ring-2 focus:ring-black/20",
            className,
          )}
          {...props}
        />
      </Field>
    );
  },
);

Textarea.displayName = "Textarea";
