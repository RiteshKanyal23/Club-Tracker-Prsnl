/**
 * Normalizes the `set-cookie` header from a SuperTest response into a
 * `string[]` that can be passed to `.set("Cookie", ...)`.
 *
 * SuperTest types `headers["set-cookie"]` as `string` even though Node/Express
 * actually returns an array, so the conversion has to be defensive.
 */
export function getCookieHeader(res: { headers: Record<string, unknown> }): string[] {
  const raw = res.headers["set-cookie"];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((value): value is string => typeof value === "string");
  return [String(raw)];
}
