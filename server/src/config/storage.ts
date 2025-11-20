import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Express, Request } from "express";

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const NEWS_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];

const storageDriver = process.env.STORAGE_DRIVER ?? "local";
const uploadsRoot = process.env.UPLOADS_DIR ?? "uploads";
const defaultFolder = "courses";

const ensureLocalFolder = (folder: string) => {
  if (storageDriver === "local") {
    fs.mkdirSync(path.join(process.cwd(), uploadsRoot, folder), { recursive: true });
  }
};

ensureLocalFolder(defaultFolder);

const s3 =
  storageDriver === "s3"
    ? new S3Client({
        region: process.env.AWS_REGION ?? "auto",
        endpoint: process.env.AWS_S3_ENDPOINT,
        forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
        credentials:
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : undefined,
      })
    : null;

const supabase: SupabaseClient | null =
  storageDriver === "supabase" && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;
const supabaseBucket = process.env.SUPABASE_BUCKET ?? "courses";

const cleanFileName = (name: string) => name.replace(/[^\w.-]+/g, "-").toLowerCase();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Tipo inválido"));
  }
  cb(null, true);
};

const createStorageFor = (folder: string): multer.StorageEngine => {
  if (storageDriver === "s3" && s3) {
    return multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET ?? "",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, key?: string) => void) => {
        const key = `${folder}/${Date.now()}-${cleanFileName(file.originalname)}`;
        cb(null, key);
      },
    });
  }
  if (storageDriver === "supabase") {
    return multer.memoryStorage();
  }

  ensureLocalFolder(folder);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), uploadsRoot, folder)),
    filename: (_req, file, cb) => {
      const name = `${Date.now()}-${cleanFileName(file.originalname)}`;
      cb(null, name);
    },
  });
};

export const createUploadMiddleware = (folder = defaultFolder) =>
  multer({
    storage: createStorageFor(folder),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 8 },
  });

export const uploadMiddleware = createUploadMiddleware(defaultFolder);

const normalizeSupabaseUrl = (url?: string | null) => {
  if (!url) return "";
  return url.replace(`/${supabaseBucket}/${supabaseBucket}/`, `/${supabaseBucket}/`);
};

export const resolvePublicUrl = (storageKeyOrName: string) => {
  if (storageDriver === "supabase" && supabase) {
    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(storageKeyOrName);
    if (data?.publicUrl) {
      const url = normalizeSupabaseUrl(data.publicUrl);
      // eslint-disable-next-line no-console
      console.log("[stor] publicUrl supabase", { storageKeyOrName, url });
      return url;
    }
    // eslint-disable-next-line no-console
    console.warn("[stor] supabase publicUrl vazio", storageKeyOrName);
    return "";
  }
  if (storageDriver === "s3" && process.env.AWS_S3_BASE_URL) {
    const url = `${process.env.AWS_S3_BASE_URL.replace(/\/$/, "")}/${storageKeyOrName}`;
    // eslint-disable-next-line no-console
    console.log("[stor] s3 url", url);
    return url;
  }
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
  const url = `${base.replace(/\/$/, "")}/uploads/${storageKeyOrName}`;
  // eslint-disable-next-line no-console
  console.log("[stor] local url", url);
  return url;
};

export const getSignedUrl = async (storageKeyOrName: string): Promise<string> => {
  if (storageDriver === "supabase" && supabase) {
    const signed = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(storageKeyOrName, 60 * 60 * 24 * 7); // 7 dias
    if (signed.data?.signedUrl) {
      const url = normalizeSupabaseUrl(signed.data.signedUrl);
      console.log("[stor] signedUrl supabase", { storageKeyOrName, url });
      return url;
    }
  }
  return resolvePublicUrl(storageKeyOrName);
};

export const downloadFromStorage = async (storageKey: string) => {
  if (storageDriver === "supabase" && supabase) {
    const result = await supabase.storage.from(supabaseBucket).download(storageKey);
    if (result.error) {
      throw result.error;
    }
    const buffer = Buffer.from(await result.data.arrayBuffer());
    return { buffer, contentType: result.data.type || "application/octet-stream" };
  }
  throw new Error("DOWNLOAD_UNSUPPORTED_FOR_DRIVER");
};

export const deleteStoredObject = async (storageKeyOrName: string) => {
  if (storageDriver === "supabase" && supabase) {
    await supabase.storage.from(supabaseBucket).remove([storageKeyOrName]);
    return;
  }
  if (storageDriver === "s3" && s3) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) return;
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKeyOrName,
      }),
    );
    return;
  }

  const filePath = path.join(process.cwd(), uploadsRoot, storageKeyOrName);
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
  folder = defaultFolder,
): Promise<StoredFile[]> => {
  if (!files.length) return [];

  if (storageDriver === "supabase" && supabase) {
    const stored: StoredFile[] = [];
    for (const file of files) {
      const storageKey = `${folder}/${Date.now()}-${cleanFileName(file.originalname)}`;
      const buffer = file.buffer;
      if (!buffer) {
        throw new Error("Arquivo inválido para upload (sem buffer).");
      }
      const uploadResult = await supabase.storage.from(supabaseBucket).upload(storageKey, buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (uploadResult.error) {
        throw uploadResult.error;
      }
      const url = await getSignedUrl(storageKey);
      // eslint-disable-next-line no-console
      console.log("[stor] saved supabase file", { storageKey, url, uploaded: !uploadResult.error });
      stored.push({ storageKey, url });
    }
    return stored;
  }

  if (files.length && storageDriver === "local") {
    ensureLocalFolder(folder);
  }

  return files.map((file) => {
    const storageKey = (file as any).key ?? `${folder}/${file.filename}`;
    // eslint-disable-next-line no-console
    console.log("[stor] saved local/s3 file", { storageKey });
    return {
      storageKey,
      url: resolvePublicUrl(storageKey),
    };
  });
};

export const uploadNewsImage = async (file?: Express.Multer.File): Promise<StoredFile> => {
  if (!file) {
    throw new Error("NEWS_IMAGE_REQUIRED");
  }
  if (!NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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
