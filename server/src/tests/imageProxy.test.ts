import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";
import request from "supertest";
import type { PublicImageRepository } from "../services/publicImageService";

const configureEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_BASE_URL = "http://localhost:4000";
  process.env.DATABASE_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.DIRECT_URL = "postgresql://" + "user:password@localhost:5432/forup";
  process.env.STORAGE_DRIVER = "local";
  process.env.UPLOADS_DIR = "uploads-test";
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = "service-account@test.local";
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = [
    "-----BEGIN " + "PRIVATE KEY-----",
    "test-private-key-body",
    "-----END " + "PRIVATE KEY-----",
  ].join("\n");
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id";
  process.env.ADMIN_TOKEN_SECRET = "test-token-secret-12345678901234567890";
};

const buildApp = async (storageKeys: Record<string, string | null>) => {
  configureEnv();
  const { createImageRoutes } = await import("../routes/imageRoutes");
  const { PublicImageService } = await import("../services/publicImageService");

  const downloaded: string[] = [];
  const repository: PublicImageRepository = {
    async findPublicCourseImageStorageKey(imageId: string) {
      return storageKeys[`course:${imageId}`] ?? null;
    },
    async findPublicNewsImageStorageKey(newsId: string) {
      return storageKeys[`news:${newsId}`] ?? null;
    },
  };
  const service = new PublicImageService(repository, async (storageKey) => {
    downloaded.push(storageKey);
    return { buffer: Buffer.from("image-bytes"), contentType: "image/webp" };
  });

  const app = express();
  app.set("trust proxy", 1);
  app.use("/api/images", createImageRoutes(service));
  return { app, downloaded };
};

test("image proxy serves a course image only through an authorized image record id", async () => {
  const imageId = "clvalidimageid123";
  const { app, downloaded } = await buildApp({
    [`course:${imageId}`]: "courses/123e4567-e89b-12d3-a456-426614174000.webp",
  });

  const response = await request(app).get(`/api/images/course/${imageId}`);

  assert.equal(response.status, 200);
  assert.equal(response.headers["content-type"], "image/webp");
  assert.equal(response.headers["cache-control"], "public, max-age=3600, stale-while-revalidate=86400");
  assert.deepEqual(downloaded, ["courses/123e4567-e89b-12d3-a456-426614174000.webp"]);
  assert.equal(response.body.toString(), "image-bytes");
});

test("image proxy returns generic 404 for legacy arbitrary storageKey routes", async () => {
  const { app, downloaded } = await buildApp({});

  const directKey = await request(app).get("/api/images/courses%2F123e4567-e89b-12d3-a456-426614174000.webp");
  const nestedKey = await request(app).get("/api/images/courses/123e4567-e89b-12d3-a456-426614174000.webp");

  assert.equal(directKey.status, 404);
  assert.equal(nestedKey.status, 404);
  assert.equal(directKey.headers["cache-control"], "no-store");
  assert.deepEqual(downloaded, []);
});

test("image proxy rejects traversal and encoded traversal without downloading", async () => {
  const { app, downloaded } = await buildApp({});

  const traversal = await request(app).get("/api/images/course/..%2Fsecret");
  const encodedTraversal = await request(app).get("/api/images/%2e%2e%2Fsecret.webp");

  assert.equal(traversal.status, 404);
  assert.equal(encodedTraversal.status, 404);
  assert.deepEqual(downloaded, []);
});

test("public image service denies private records and invalid stored keys", async () => {
  configureEnv();
  const { PublicImageService } = await import("../services/publicImageService");

  const downloaded: string[] = [];
  const repository: PublicImageRepository = {
    async findPublicCourseImageStorageKey() {
      return "courses/../../secret.webp";
    },
    async findPublicNewsImageStorageKey() {
      return null;
    },
  };
  const service = new PublicImageService(repository, async (storageKey) => {
    downloaded.push(storageKey);
    return { buffer: Buffer.from("private"), contentType: "image/webp" };
  });

  assert.equal(await service.getPublicImage("course", "clvalidimageid123"), null);
  assert.equal(await service.getPublicImage("news", "cldraftnewsid12345"), null);
  assert.deepEqual(downloaded, []);
});

test("legacy internal image URLs are converted to scoped storage keys only for trusted origins", async () => {
  configureEnv();
  const { storageKeyFromLegacyImageUrl, hasStorageBackedImageReference } = await import(
    "../services/publicImageService"
  );

  const key = "courses/123e4567-e89b-12d3-a456-426614174000.webp";

  assert.equal(storageKeyFromLegacyImageUrl(`/uploads/${key}`, "courses"), key);
  assert.equal(storageKeyFromLegacyImageUrl(`http://localhost:4000/api/images/${encodeURIComponent(key)}`, "courses"), key);
  assert.equal(storageKeyFromLegacyImageUrl(`https://evil.example/uploads/${key}`, "courses"), null);
  assert.equal(storageKeyFromLegacyImageUrl("/uploads/news/123e4567-e89b-12d3-a456-426614174000.webp", "courses"), null);
  assert.equal(hasStorageBackedImageReference(null, `/uploads/${key}`, "courses"), true);
});
