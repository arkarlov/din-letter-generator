"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";
import { Field } from "./Field";

type Props = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const InputField = forwardRef<HTMLInputElement, Props>(
  ({ label, name, error, className, required, ...props }, ref) => {
    return (
      <Field label={label} name={name} error={error} required={required}>
        <input
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

InputField.displayName = "InputField";
