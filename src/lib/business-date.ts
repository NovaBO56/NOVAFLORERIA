/** Fecha comercial de Bolivia, independiente de la zona del servidor. */
export function businessDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function businessDayStart(now = new Date()): Date {
  return new Date(`${businessDate(now)}T00:00:00-04:00`);
}
