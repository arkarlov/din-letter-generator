"use client";

import { useState } from "react";
import { Textarea } from "./Textarea";

type Props = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

export function AddressField({
  label,
  name,
  placeholder,
  required = false,
}: Props) {
  const [error, setError] = useState<string | undefined>();

  const validate = (value: string) => {
    const lines = value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (required && lines.length < 2) {
      return "Address must contain at least 2 lines.";
    }

    return undefined;
  };

  return (
    <Textarea
      className="resize-none"
      label={label}
      name={name}
      rows={5}
      placeholder={placeholder}
      required={required}
      error={error}
      onBlur={(e) => {
        setError(validate(e.target.value));
      }}
    />
  );
}
