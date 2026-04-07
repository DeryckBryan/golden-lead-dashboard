import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, placeholder, className }) => {
  const [focused, setFocused] = useState(false);

  const displayValue = focused || !value
    ? value
    : new Intl.NumberFormat("pt-BR").format(Number(value));

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={e => {
        const raw = e.target.value.replace(/\D/g, "");
        onChange(raw);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className={className}
    />
  );
};
