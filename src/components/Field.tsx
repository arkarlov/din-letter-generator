type FieldProps = {
  label: string;
  name?: string;
  error?: string;
  children: React.ReactNode;
};

export function Field({ label, name, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
