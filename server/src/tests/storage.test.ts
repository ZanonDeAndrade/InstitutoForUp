import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

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

const createPngBuffer = (width = 8, height = 8) =>
  sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 20, g: 120, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

const multerFile = (input: { buffer: Buffer; originalname: string; mimetype: string }): Express.Multer.File =>
  ({
    buffer: input.buffer,
    originalname: input.originalname,
    mimetype: input.mimetype,
    size: input.buffer.length,
  }) as Express.Multer.File;

test("resolvePublicUrl composes local url", async () => {
  configureEnv();

  const { resolvePublicUrl } = await import("../config/storage");
  const url = resolvePublicUrl("courses/example.png");
  assert.equal(url, "http://localhost:4000/uploads/courses/example.png");
});

test("storage keys are restricted to allowed image prefixes", async () => {
  configureEnv();

  const { assertAllowedStorageKey, buildStorageKey } = await import("../services/supabaseStorageService");

  assert.equal(assertAllowedStorageKey("courses/example.png"), "courses/example.png");
  assert.equal(assertAllowedStorageKey("news/example.jpg", "news"), "news/example.jpg");
  assert.match(buildStorageKey("courses"), /^courses\/[0-9a-f-]{36}\.webp$/);
  assert.throws(() => assertAllowedStorageKey("../secret.png"), /STORAGE_KEY_NOT_ALLOWED/);
  assert.throws(() => assertAllowedStorageKey("admin/secret.png"), /STORAGE_KEY_NOT_ALLOWED/);
  assert.throws(() => assertAllowedStorageKey("courses/../../secret.png"), /STORAGE_KEY_NOT_ALLOWED/);
  assert.throws(() => assertAllowedStorageKey("courses/payload.svg"), /STORAGE_FILE_TYPE_NOT_ALLOWED/);
  assert.throws(() => assertAllowedStorageKey("courses/example.png", "news"), /STORAGE_KEY_PREFIX_MISMATCH/);
});

test("storage operations reject arbitrary keys before reading or deleting", async () => {
  configureEnv();

  const { deleteStoredObject, downloadFromStorage, resolvePublicUrl } = await import("../config/storage");

  assert.throws(() => resolvePublicUrl("https://example.com/file.png"), /STORAGE_KEY_NOT_ALLOWED/);
  await assert.rejects(() => downloadFromStorage("admin/file.png"), /STORAGE_KEY_NOT_ALLOWED/);
  await assert.rejects(() => deleteStoredObject("courses/../../../secret.png"), /STORAGE_KEY_NOT_ALLOWED/);
});

test("valid upload is signature-validated, reprocessed and stored with random name", async () => {
  configureEnv();

  const { persistUploadedFiles } = await import("../config/storage");
  const buffer = await createPngBuffer();
  const [stored] = await persistUploadedFiles(
    [multerFile({ buffer, originalname: "../avatar.php.png", mimetype: "image/png" })],
    "courses",
  );
  assert.ok(stored);

  assert.match(stored.storageKey, /^courses\/[0-9a-f-]{36}\.webp$/);
  assert.equal(stored.storageKey.includes("avatar"), false);
  assert.equal(stored.url, `http://localhost:4000/uploads/${stored.storageKey}`);
  const savedPath = path.join(process.cwd(), "uploads-test", stored.storageKey);
  assert.equal(fs.existsSync(savedPath), true);
  const metadata = await sharp(await fs.promises.readFile(savedPath)).metadata();
  assert.equal(metadata.format, "webp");
});

test("upload rejects forged MIME with non-image content", async () => {
  configureEnv();

  const { persistUploadedFiles } = await import("../config/storage");
  const html = Buffer.from("<html><script>alert(1)</script></html>");

  await assert.rejects(
    () =>
      persistUploadedFiles(
        [multerFile({ buffer: html, originalname: "payload.png", mimetype: "image/png" })],
        "courses",
      ),
    /UPLOAD_IMAGE_CORRUPTED/,
  );
});

test("upload rejects oversized file before decoding", async () => {
  configureEnv();

  const { persistUploadedFiles, MAX_FILE_SIZE_BYTES } = await import("../config/storage");
  const large = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1, 0);

  await assert.rejects(
    () =>
      persistUploadedFiles(
        [multerFile({ buffer: large, originalname: "large.png", mimetype: "image/png" })],
        "courses",
      ),
    /UPLOAD_IMAGE_TOO_LARGE/,
  );
});

test("upload rejects image dimensions above the configured limit", async () => {
  configureEnv();

  const { persistUploadedFiles } = await import("../config/storage");
  const tooWide = await createPngBuffer(4097, 1);

  await assert.rejects(
    () =>
      persistUploadedFiles(
        [multerFile({ buffer: tooWide, originalname: "wide.png", mimetype: "image/png" })],
        "courses",
      ),
    /UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE/,
  );
});

test("upload rejects corrupted image bytes", async () => {
  configureEnv();

  const { persistUploadedFiles } = await import("../config/storage");
  const corruptedPng = Buffer.from("89504e470d0a1a0a00000000", "hex");

  await assert.rejects(
    () =>
      persistUploadedFiles(
        [multerFile({ buffer: corruptedPng, originalname: "broken.png", mimetype: "image/png" })],
        "courses",
      ),
    /UPLOAD_IMAGE_CORRUPTED/,
  );
});

test("upload accepts misleading extension only after content validation and safe rewrite", async () => {
  configureEnv();

  const { persistUploadedFiles } = await import("../config/storage");
  const buffer = await createPngBuffer();
  const [stored] = await persistUploadedFiles(
    [multerFile({ buffer, originalname: "shell.php", mimetype: "image/png" })],
    "news",
  );
  assert.ok(stored);

  assert.match(stored.storageKey, /^news\/[0-9a-f-]{36}\.webp$/);
  assert.equal(stored.storageKey.includes("shell"), false);
});

test("deleteStoredObject removes only scoped local files", async () => {
  configureEnv();

  const uploadsRoot = path.join(process.cwd(), "uploads-test", "courses");
  const filePath = path.join(uploadsRoot, "delete-me.png");
  fs.mkdirSync(uploadsRoot, { recursive: true });
  fs.writeFileSync(filePath, "test");

  const { deleteStoredObject } = await import("../config/storage");
  await deleteStoredObject("courses/delete-me.png");

  assert.equal(fs.existsSync(filePath), false);
});
