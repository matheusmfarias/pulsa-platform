const CNPJ_LENGTH = 14;

export function normalizeDocumentNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function calculateDigit(base: string, weights: number[]): number {
  const sum = base
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: string): boolean {
  const normalized = normalizeDocumentNumber(value);

  if (
    normalized.length !== CNPJ_LENGTH ||
    /^(\d)\1+$/.test(normalized)
  ) {
    return false;
  }

  const firstDigit = calculateDigit(normalized.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  const secondDigit = calculateDigit(`${normalized.slice(0, 12)}${firstDigit}`, [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  return normalized.endsWith(`${firstDigit}${secondDigit}`);
}

export function formatDocumentNumber(value: string): string {
  const normalized = normalizeDocumentNumber(value);

  if (normalized.length !== CNPJ_LENGTH) {
    return value;
  }

  return normalized.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}
