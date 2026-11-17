import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../src/app";
import { getCookieHeader } from "./helpers/cookies";
import { prisma } from "../src/config/database";
import { uploadDir } from "../src/config/storage";

async function loginAdmin() {
  const a = request(app);
  const login = await a.post("/api/v1/auth/login").send({ email: "admin@teamalgebra.local", password: "Password123!" });
  expect(login.status).toBe(200);
  return { agent: a, cookies: getCookieHeader(login) };
}

describe("Workflow documents upload/version/download", () => {
  const created: { docId?: string; filePaths: string[] } = { filePaths: [] };

  async function trackFiles(docId: string) {
    const doc = await prisma.document.findUnique({ where: { id: docId }, include: { versions: true } });
    for (const v of doc?.versions || []) {
      const p = path.isAbsolute(v.path) ? v.path : path.join(uploadDir, path.basename(v.path));
      if (!created.filePaths.includes(p)) created.filePaths.push(p);
    }
  }

  afterAll(async () => {
    try {
      if (created.docId) {
        await trackFiles(created.docId);
        await prisma.documentVersion.deleteMany({ where: { documentId: created.docId } });
        await prisma.document.deleteMany({ where: { id: created.docId } });
      }
    } catch {}
    for (const p of created.filePaths) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
    await prisma.$disconnect();
  });

  it("uploads document, adds version, downloads and deletes", async () => {
    const { agent, cookies } = await loginAdmin();
    const suffix = Date.now();

    const create = await agent
      .post("/api/v1/documents")
      .set("Cookie", cookies)
      .field("title", `Doc ${suffix}`)
      .attach("file", Buffer.from("hello version 1"), `doc-${suffix}.txt`);
    expect(create.status).toBe(201);
    expect(create.body.success).toBe(true);
    created.docId = create.body.data.id;
    await trackFiles(created.docId!);

    const version = await agent
      .post(`/api/v1/documents/${created.docId}/versions`)
      .set("Cookie", cookies)
      .attach("file", Buffer.from("hello version 2"), `doc-${suffix}-v2.txt`);
    expect(version.status).toBe(201);
    expect(version.body.success).toBe(true);
    await trackFiles(created.docId!);

    const download = await agent
      .get(`/api/v1/documents/${created.docId}/download`)
      .set("Cookie", cookies)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.from(c)));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(download.status).toBe(200);
    expect(download.body?.length || 0).toBeGreaterThan(0);

    const del = await agent.delete(`/api/v1/documents/${created.docId}`).set("Cookie", cookies);
    expect([200, 204]).toContain(del.status);
  });
});
