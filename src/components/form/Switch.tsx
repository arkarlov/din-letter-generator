"use client";

import clsx from "clsx";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  name: string;
};

export function Switch({ checked, label, name, onChange }: Props) {
  return (
    <label className="flex items-center gap-3 text-left cursor-pointer rounded-lg">
      <input
        type="checkbox"
        role="switch"
        name={name}
        value="on"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer sr-only"
      />
      <span
        className={clsx(
          "w-12 h-6 flex items-center rounded-full transition-[background-color] px-1 shrink-0 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gray-300",
          checked ? "bg-black" : "bg-gray-300",
        )}
      >
        <span
          className={clsx(
            "w-4 h-4 bg-white rounded-full transition-transform",
            checked ? "translate-x-6" : "translate-x-0",
          )}
        />
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}
