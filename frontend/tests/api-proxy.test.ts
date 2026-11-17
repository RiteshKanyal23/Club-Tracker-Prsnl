// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import handler, { resolveUpstreamPath } from "../api/[...path].js";

const ORIGINAL_BACKEND_URL = process.env.BACKEND_URL;

function upstreamResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  const entries = Object.entries(headers);
  return {
    status,
    headers: {
      entries: () => entries,
    },
    arrayBuffer: async () =>
      new TextEncoder().encode(typeof body === "string" ? body : JSON.stringify(body)).buffer,
  };
}

function createReq(overrides: Record<string, any> = {}) {
  const { body = "", ...rest } = overrides;
  return {
    method: "GET",
    url: "/api/v1/health",
    headers: { host: "club.example.com" },
    ...rest,
    async *[Symbol.asyncIterator]() {
      if (body) yield Buffer.from(body);
    },
  };
}

function createRes() {
  return {
    statusCode: 200,
    headers: {} as Record<string, any>,
    payload: undefined as Buffer | undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: any) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    end(body: any) {
      this.payload = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "");
      return this;
    },
  };
}

describe("Vercel API proxy path normalization", () => {
  it.each([
    ["/api/v1/auth/login", "/api/v1/auth/login"],
    ["/api/proxy/v1/auth/login", "/api/v1/auth/login"],
    ["/api/proxy/api/v1/auth/login", "/api/v1/auth/login"],
    ["/api/api/v1/auth/login", "/api/v1/auth/login"],
    ["/v1/auth/login", "/api/v1/auth/login"],
    ["/api/v1/auth/login?next=%2Fdashboard", "/api/v1/auth/login?next=%2Fdashboard"],
    ["/socket.io/?EIO=4", "/socket.io/?EIO=4"],
    ["/api/proxy/socket.io/?EIO=4", "/socket.io/?EIO=4"],
  ])("maps %s to %s", (incoming, expected) => {
    expect(resolveUpstreamPath(incoming)).toBe(expected);
  });

  it("keeps the root and frontend proxy copies in sync", () => {
    const frontendProxy = readFileSync(fileURLToPath(new URL("../api/[...path].js", import.meta.url)), "utf8");
    const rootProxy = readFileSync(fileURLToPath(new URL("../../api/[...path].js", import.meta.url)), "utf8");
    expect(frontendProxy).toBe(rootProxy);
  });
});

describe("Vercel API proxy forwarding", () => {
  beforeEach(() => {
    process.env.BACKEND_URL = "https://backend.example.com/";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (ORIGINAL_BACKEND_URL === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = ORIGINAL_BACKEND_URL;
  });

  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"])("forwards the %s method unchanged", async (method) => {
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await handler(createReq({ method, url: "/api/proxy/v1/auth/login" }), createRes());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBe(method);
  });

  it("forwards query, headers and POST body and preserves JSON and cookies", async () => {
    const payload = { email: "admin@teamalgebra.local", password: "Password123!", portal: "admin" };
    const responseBody = { success: true, data: { user: { role: "ADMIN" } } };
    const cookie = "access_token=abc; Path=/; HttpOnly";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        upstreamResponse(200, responseBody, { "Content-Type": "application/json", "Set-Cookie": cookie }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const req = createReq({
      method: "POST",
      url: "/api/v1/auth/login?source=deployment-check",
      headers: {
        host: "club.example.com",
        "content-type": "application/json",
        authorization: "Bearer test-token",
        "content-length": "999",
        connection: "keep-alive",
      },
      body: JSON.stringify(payload),
    });
    const res = createRes();

    await handler(req, res);

    const [target, options] = fetchMock.mock.calls[0];
    expect(target).toBe("https://backend.example.com/api/v1/auth/login?source=deployment-check");
    expect(options.body.toString()).toBe(JSON.stringify(payload));
    expect(options.headers["content-type"]).toBe("application/json");
    expect(options.headers.authorization).toBe("Bearer test-token");
    expect(options.headers["x-forwarded-host"]).toBe("club.example.com");
    expect(options.headers["content-length"]).toBeUndefined();
    expect(options.headers.connection).toBeUndefined();

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload!.toString())).toEqual(responseBody);
    expect(res.headers["content-type"]).toBe("application/json");
    expect(res.headers["set-cookie"]).toEqual([cookie]);
  });

  it("does not mask a real upstream 405 response", async () => {
    const responseBody = { success: false, message: "Method Not Allowed" };
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse(405, responseBody, { "Content-Type": "application/json" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = createRes();
    await handler(createReq({ method: "POST", url: "/api/proxy/v1/auth/login" }), res);

    expect(fetchMock.mock.calls[0][0]).toBe("https://backend.example.com/api/v1/auth/login");
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.payload!.toString())).toEqual(responseBody);
  });

  it("does not send a body for GET or HEAD requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await handler(createReq({ method: "GET", body: "ignored" }), createRes());

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });
});
