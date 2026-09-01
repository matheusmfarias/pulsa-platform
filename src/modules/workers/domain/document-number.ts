const CPF_LENGTH = 11;

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function calculateCpfDigit(base: string, factor: number): number {
  const total = base
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (factor - index), 0);
  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const normalized = normalizeCpf(value);
  if (normalized.length !== CPF_LENGTH || /^(\d)\1+$/.test(normalized)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(normalized.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(
    `${normalized.slice(0, 9)}${firstDigit}`,
    11,
  );
  return normalized.endsWith(`${firstDigit}${secondDigit}`);
}

export function formatCpf(value: string): string {
  const normalized = normalizeCpf(value);
  if (normalized.length !== CPF_LENGTH) return value;
  return normalized.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4",
  );
}
