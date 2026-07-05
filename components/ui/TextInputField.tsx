import { FormField, fieldInputClassName } from "@/components/ui/FormField";

interface TextInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TextInputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required,
  disabled,
}: TextInputFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={fieldInputClassName(Boolean(error))}
        autoComplete="off"
      />
    </FormField>
  );
}
