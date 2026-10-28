/** Keep diagnostic details out of UI while preserving useful business validation. */
export function friendlyErrorMessage(message: unknown, fallback = "No pudimos completar la acción. Intenta nuevamente."): string {
  if (typeof message !== "string" || !message.trim()) return fallback;
  if (/\b(?:RPC|SQLSTATE|PGRST\w*|PostgREST|Supabase|TypeError|SyntaxError)\b|constraint|relation\s+["']|column\s+["']|unexpected token|failed to fetch|fetch failed|networkerror|mutaci[oó]n/i.test(message)) return fallback;
  return message;
}
