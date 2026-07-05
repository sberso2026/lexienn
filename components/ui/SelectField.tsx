import { FormField, fieldInputClassName } from "@/components/ui/FormField";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
  required,
  disabled,
  placeholder,
}: SelectFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        name={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={fieldInputClassName(Boolean(error))}
        aria-invalid={Boolean(error)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
