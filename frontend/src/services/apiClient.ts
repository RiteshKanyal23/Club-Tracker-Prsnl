import { apiUrl, API_BASE_URL } from "../config/api";

/** Error carrying the HTTP status (when one was received) and a user-friendly message. */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const NETWORK_ERROR = /failed to fetch|networkerror|network request failed|load failed|networkerror when attempting to fetch/i;

/**
 * Turn low-level fetch/TypeError text into something a user can act on.
 * "Failed to fetch" almost always means the configured API host is unreachable
 * (wrong URL, backend offline, CORS or mixed-content blocked) - not a bad
 * password. The UI used to show the raw browser text, which hid the cause.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) return err.message;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  if (NETWORK_ERROR.test(raw)) {
    return "Unable to reach the server. Check your internet connection and try again. If this persists, the site administrator needs to check the API deployment.";
  }
  if (/unexpected token|invalid json|unexpected end of json/i.test(raw)) {
    return "The server returned an unexpected response. Please try again later.";
  }
  return raw;
}

async function readBody(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("The server returned an unexpected response. Please try again later.", res.status);
  }
}

async function raw(path: string, options: RequestInit = {}): Promise<Response> {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  try {
    return await fetch(apiUrl(path), {
      credentials: "include",
      // Let the browser set the multipart boundary for FormData requests.
      headers: isForm ? { ...(options.headers || {}) } : { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (err) {
    // `fetch` only throws for transport-level problems (offline, DNS, CORS,
    // mixed content, connection refused). Give callers an actionable message.
    throw new ApiError(getErrorMessage(err), null);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  let res = await raw(path, options);
  if (res.status === 401 && retry && path !== "/auth/refresh" && path !== "/auth/login") {
    const r = await raw("/auth/refresh", { method: "POST" });
    if (r.ok) res = await raw(path, options);
  }
  const json = await readBody(res);
  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message.join(", ") : String(message), res.status);
  }
  return json as T;
}

/** Exposed for diagnostics (e.g. showing which API host the build is using). */
export const configuredApiBaseUrl = API_BASE_URL;
