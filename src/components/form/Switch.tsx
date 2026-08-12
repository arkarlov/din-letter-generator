"use client";

import clsx from "clsx";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

export function Switch({ checked, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          "w-12 h-6 flex items-center rounded-full transition px-1 shrink-0",
          checked ? "bg-black" : "bg-gray-300",
        )}
      >
        <div
          className={clsx(
            "w-4 h-4 bg-white rounded-full transition",
            checked ? "translate-x-6" : "translate-x-0",
          )}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
