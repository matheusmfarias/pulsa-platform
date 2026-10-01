import { normalizeCpf } from "../domain/document-number";

export function formatCpfInput(value: string): string {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function formatBrazilianPhoneInput(value: string): string {
  if (!/^[\d\s()+-]*$/.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length > 11) return value;
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
