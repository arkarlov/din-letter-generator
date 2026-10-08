"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { Field } from "./Field";

type Props = {
  label: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaField = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, name, error, className, required, ...props }, ref) => {
    return (
      <Field label={label} name={name} error={error} required={required}>
        <textarea
          ref={ref}
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error && name ? `${name}-error` : undefined}
          className={clsx(
            "w-full rounded-lg border p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300",
            error ? "border-red-500" : "border-gray-300",
            className,
          )}
          required={required}
          {...props}
        />
      </Field>
    );
  },
);

TextareaField.displayName = "TextareaField";
