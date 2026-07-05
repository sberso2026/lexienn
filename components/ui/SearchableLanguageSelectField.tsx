"use client";

import { FormField } from "@/components/ui/FormField";
import { SearchableLanguageSelect } from "@/components/ui/SearchableLanguageSelect";

interface SearchableLanguageSelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  leadingOptions?: Array<{ value: string; label: string }>;
}

export function SearchableLanguageSelectField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  disabled,
  placeholder,
  leadingOptions,
}: SearchableLanguageSelectFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <SearchableLanguageSelect
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        hasError={Boolean(error)}
        placeholder={placeholder}
        leadingOptions={leadingOptions}
      />
    </FormField>
  );
}
