import { apiRequest } from "./apiClient";

export async function uploadFile(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
  const res = await fetch(`${base}${path}`, { method: "POST", body: form, credentials: "include" });
  return res.json();
}
