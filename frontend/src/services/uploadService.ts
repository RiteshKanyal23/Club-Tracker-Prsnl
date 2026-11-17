import { apiRequest } from "./apiClient";

export async function uploadFile(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  // Go through apiRequest so transport failures get a meaningful error message
  // and the credentials/API base URL are handled in exactly one place.
  return apiRequest<any>(path, { method: "POST", body: form });
}
