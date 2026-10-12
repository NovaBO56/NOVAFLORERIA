/** Database money uses numeric(12,2); aggregate integer cents, not binary fractions. */
export function cents(value: number | string) {
  return Math.round(Number(value) * 100);
}

export function sumMoney(values: (number | string)[]) {
  return values.reduce<number>((sum, value) => sum + cents(value), 0) / 100;
}
