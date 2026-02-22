type FieldProps = {
  label: string;
  name?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
};

export function Field({ label, name, error, children, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {children}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
