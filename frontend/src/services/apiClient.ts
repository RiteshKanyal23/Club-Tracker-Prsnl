const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

async function raw(path: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  let res = await raw(path, options);
  if (res.status === 401 && retry && path !== "/auth/refresh" && path !== "/auth/login") {
    const r = await raw("/auth/refresh", { method: "POST" });
    if (r.ok) res = await raw(path, options);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}
