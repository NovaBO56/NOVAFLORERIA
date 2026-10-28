const LOGIN_FALLBACK = "/admin";
const VALIDATION_ORIGIN = "https://login-destination.invalid";
const UNSAFE_CHARACTERS = /[\\\u0000-\u001f\u007f-\u009f]/;

/** A redirect grants no access: route/API permissions still apply after login. */
export function loginDestination(value: string | null): string {
  if (!value) return LOGIN_FALLBACK;

  let candidate = value;
  // Inspect encoded layers without changing a legitimate path, query or hash.
  // Excessive nesting fails closed rather than leaving an unchecked layer.
  for (let layer = 0; layer < 8; layer += 1) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") || UNSAFE_CHARACTERS.test(candidate)) {
      return LOGIN_FALLBACK;
    }

    try {
      const parsed = new URL(candidate, VALIDATION_ORIGIN);
      if (parsed.origin !== VALIDATION_ORIGIN || parsed.pathname.startsWith("//")) {
        return LOGIN_FALLBACK;
      }

      if (!/%[0-9a-f]{2}/i.test(candidate)) return value;
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return value;
      candidate = decoded;
    } catch {
      return LOGIN_FALLBACK;
    }
  }

  return LOGIN_FALLBACK;
}
