import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";
import {
  assertAllowedStorageKey,
  assertAllowedStoragePrefix,
  StoragePrefix,
  supabaseStorageService,
} from "../services/supabaseStorageService";
import {
  buildRandomImageStorageKey,
  ImageUploadError,
  MAX_UPLOAD_IMAGE_SIZE_BYTES,
  SAFE_UPLOAD_CONTENT_TYPE,
  sanitizeUploadedImage,
} from "../services/imageUploadService";

export const MAX_FILE_SIZE_BYTES = MAX_UPLOAD_IMAGE_SIZE_BYTES;
export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const NEWS_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const storageDriver = env.STORAGE_DRIVER;
const uploadsRoot = env.UPLOADS_DIR;
const defaultFolder: StoragePrefix = "courses";

const ensureLocalFolder = (folder: StoragePrefix) => {
  if (storageDriver === "local") {
    fs.mkdirSync(path.join(process.cwd(), uploadsRoot, folder), { recursive: true });
  }
};

ensureLocalFolder(defaultFolder);

const s3 =
  storageDriver === "s3"
    ? new S3Client({
        region: env.AWS_REGION,
        endpoint: env.AWS_S3_ENDPOINT,
        forcePathStyle: !!env.AWS_S3_ENDPOINT,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        },
      })
    : null;

const legacyPublicImageUrlForKey = (storageKey: string) => {
  assertAllowedStorageKey(storageKey);
  return "";
};

const contentTypeForStorageKey = (storageKey: string) => {
  const extension = storageKey.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      throw new Error("STORAGE_FILE_TYPE_NOT_ALLOWED");
  }
};

const resolveLocalFilePath = (storageKey: string) => {
  const safeKey = assertAllowedStorageKey(storageKey);
  const uploadsRootPath = path.resolve(process.cwd(), uploadsRoot);
  const filePath = path.resolve(uploadsRootPath, safeKey);

  if (!filePath.startsWith(`${uploadsRootPath}${path.sep}`)) {
    throw new Error("STORAGE_KEY_NOT_ALLOWED");
  }

  return filePath;
};

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Tipo invalido"));
  }
  cb(null, true);
};

const createStorageFor = (folder: string): multer.StorageEngine => {
  assertAllowedStoragePrefix(folder);
  return multer.memoryStorage();
};

export const createUploadMiddleware = (folder: string = defaultFolder) =>
  multer({
    storage: createStorageFor(folder),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 8 },
  });

export const uploadMiddleware = createUploadMiddleware(defaultFolder);

export const resolvePublicUrl = (storageKeyOrName: string) => {
  const safeKey = assertAllowedStorageKey(storageKeyOrName);

  if (storageDriver === "supabase") {
    return legacyPublicImageUrlForKey(safeKey);
  }

  if (storageDriver === "s3" && env.AWS_S3_BASE_URL) {
    return `${env.AWS_S3_BASE_URL.replace(/\/$/, "")}/${safeKey}`;
  }

  const base = env.PUBLIC_BASE_URL;
  return `${base.replace(/\/$/, "")}/uploads/${safeKey}`;
};

export const downloadFromStorage = async (storageKey: string) => {
  const safeKey = assertAllowedStorageKey(storageKey);
  const contentType = contentTypeForStorageKey(safeKey);

  if (storageDriver === "supabase") {
    const downloaded = await supabaseStorageService.downloadObject(safeKey);
    return { buffer: downloaded.buffer, contentType };
  }

  if (storageDriver === "s3" && s3) {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: safeKey,
      }),
    );
    const chunks: Buffer[] = [];
    const body = result.Body as AsyncIterable<Uint8Array> | undefined;
    if (!body) {
      throw new Error("STORAGE_OBJECT_EMPTY");
    }
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk));
    }
    return { buffer: Buffer.concat(chunks), contentType };
  }

  const filePath = resolveLocalFilePath(safeKey);
  return { buffer: await fs.promises.readFile(filePath), contentType };
};

export const deleteStoredObject = async (storageKeyOrName: string) => {
  const safeKey = assertAllowedStorageKey(storageKeyOrName);

  if (storageDriver === "supabase") {
    await supabaseStorageService.deleteObject(safeKey);
    return;
  }

  if (storageDriver === "s3" && s3) {
    const bucket = env.AWS_S3_BUCKET;
    if (!bucket) return;
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: safeKey,
      }),
    );
    return;
  }

  const filePath = resolveLocalFilePath(safeKey);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

export interface StoredFile {
  storageKey: string;
  url: string;
}

export const persistUploadedFiles = async (
  files: Express.Multer.File[],
  folder: string = defaultFolder,
): Promise<StoredFile[]> => {
  if (!files.length) return [];

  const prefix = assertAllowedStoragePrefix(folder);

  if (files.length && storageDriver === "local") {
    ensureLocalFolder(prefix);
  }

  const stored: StoredFile[] = [];
  for (const file of files) {
    if (!file.buffer) {
      throw new ImageUploadError("UPLOAD_IMAGE_BUFFER_MISSING");
    }
    const sanitized = await sanitizeUploadedImage(file.buffer);
    const storageKey = assertAllowedStorageKey(buildRandomImageStorageKey(prefix, sanitized.extension), prefix);

    if (storageDriver === "supabase") {
      await supabaseStorageService.uploadObject({
        storageKey,
        buffer: sanitized.buffer,
        contentType: sanitized.contentType,
        prefix,
      });
      stored.push({ storageKey, url: legacyPublicImageUrlForKey(storageKey) });
      continue;
    }

    if (storageDriver === "s3" && s3) {
      await s3.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET!,
          Key: storageKey,
          Body: sanitized.buffer,
          ContentType: SAFE_UPLOAD_CONTENT_TYPE,
        }),
      );
      stored.push({ storageKey, url: resolvePublicUrl(storageKey) });
      continue;
    }

    const filePath = resolveLocalFilePath(storageKey);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, sanitized.buffer, { flag: "wx" });
    stored.push({ storageKey, url: resolvePublicUrl(storageKey) });
  }

  return stored;
};

export const uploadNewsImage = async (file?: Express.Multer.File): Promise<StoredFile> => {
  if (!file) {
    throw new Error("NEWS_IMAGE_REQUIRED");
  }
  if (!NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    throw new Error("NEWS_IMAGE_INVALID_TYPE");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("NEWS_IMAGE_TOO_LARGE");
  }

  const [stored] = await persistUploadedFiles([file], "news");
  if (!stored) {
    throw new Error("NEWS_IMAGE_UPLOAD_FAILED");
  }
  return stored;
};
