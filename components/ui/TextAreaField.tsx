import { FormField, fieldInputClassName } from "@/components/ui/FormField";

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  hint,
  error,
  required,
}: TextAreaFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldInputClassName(Boolean(error))} resize-y`}
        aria-invalid={Boolean(error)}
      />
    </FormField>
  );
}
