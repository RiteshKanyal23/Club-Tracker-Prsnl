import { describe, it, expect, vi } from "vitest";
import { resolveApiBaseUrl, resolveSocketUrl, PROXY_API_BASE_URL, LOCAL_API_BASE_URL } from "./api";
import { getErrorMessage, ApiError, apiRequest } from "../services/apiClient";

describe("API base URL resolution", () => {
  it("uses the local backend only in development", () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe(LOCAL_API_BASE_URL);
  });

  it("never uses localhost in production builds", () => {
    expect(resolveApiBaseUrl("http://localhost:4000/api/v1", false)).toBe(PROXY_API_BASE_URL);
    expect(resolveApiBaseUrl("http://127.0.0.1:4000/api/v1", false)).toBe(PROXY_API_BASE_URL);
    expect(resolveApiBaseUrl(undefined, false)).toBe(PROXY_API_BASE_URL);
  });

  it("rejects insecure http URLs in production", () => {
    expect(resolveApiBaseUrl("http://api.example.com/api/v1", false)).toBe(PROXY_API_BASE_URL);
  });

  it("honours an explicit https backend URL in production", () => {
    expect(resolveApiBaseUrl("https://api.example.com/api/v1/", false)).toBe("https://api.example.com/api/v1");
  });

  it("keeps local socket URLs out of production", () => {
    expect(resolveSocketUrl(undefined, false)).toBe("/socket.io");
    expect(resolveSocketUrl("http://localhost:4000", false)).toBe("/socket.io");
    expect(resolveSocketUrl("https://api.example.com", false)).toBe("https://api.example.com");
  });
});

describe("friendly error messages", () => {
  it("replaces the browser's Failed to fetch text", () => {
    const msg = getErrorMessage(new TypeError("Failed to fetch"));
    expect(msg).not.toMatch(/failed to fetch/i);
    expect(msg).toMatch(/unable to reach the server/i);
  });

  it("preserves server-provided messages", () => {
    expect(getErrorMessage(new ApiError("Invalid credentials", 401))).toBe("Invalid credentials");
  });

  it("apiRequest wraps a real network failure into a friendly ApiError", async () => {
    const realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    try {
      await expect(apiRequest("/auth/login", { method: "POST" })).rejects.toMatchObject({
        name: "ApiError",
        status: null,
        message: expect.stringMatching(/unable to reach the server/i),
      });
      const thrown = (await apiRequest("/auth/login", { method: "POST" }).catch((e) => e)) as Error;
      expect(thrown.message).not.toMatch(/failed to fetch/i);
    } finally {
      vi.stubGlobal("fetch", realFetch);
      vi.unstubAllGlobals();
    }
  });
});
