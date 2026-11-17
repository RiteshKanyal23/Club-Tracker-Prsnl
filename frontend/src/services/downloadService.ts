export async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: "include" });
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
