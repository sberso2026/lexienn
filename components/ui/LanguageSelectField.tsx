import { FormField, fieldInputClassName } from "@/components/ui/FormField";
import { getLanguageSelectGroups } from "@/lib/languages/languageOptions";

interface LanguageSelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/** Simple grouped language select. Prefer SearchableLanguageSelectField in forms. */
export function LanguageSelectField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  disabled,
}: LanguageSelectFieldProps) {
  const groups = getLanguageSelectGroups();

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
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </FormField>
  );
}
