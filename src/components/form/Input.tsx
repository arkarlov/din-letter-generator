"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";
import { Field } from "./Field";

type Props = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, name, error, className, required, ...props }, ref) => {
    return (
      <Field label={label} name={name} error={error} required={required}>
        <input
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
          required={required}
          {...props}
        />
      </Field>
    );
  },
);

Input.displayName = "Input";
