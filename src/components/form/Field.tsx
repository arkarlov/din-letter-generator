type Props = {
  label: string;
  id?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
};

export function Field({ label, id, error, children, required }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <span
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="text-xs text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}
