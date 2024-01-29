export function notNull<T>(value: T | null): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value is null");
  }

  return value;
}

export function prettyPrintAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
