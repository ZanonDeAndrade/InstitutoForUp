import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Readable } from "node:stream";

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

const storageDriver = process.env.STORAGE_DRIVER ?? "local";
const uploadsRoot = process.env.UPLOADS_DIR ?? "uploads";
const uploadsPath = path.join(process.cwd(), uploadsRoot, "courses");

if (storageDriver === "local") {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

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

let baseStorage: multer.StorageEngine;

if (storageDriver === "s3" && s3) {
  baseStorage = multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET ?? "",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const key = `courses/${Date.now()}-${cleanFileName(file.originalname)}`;
      cb(null, key);
    },
  });
} else if (storageDriver === "supabase") {
  baseStorage = multer.memoryStorage();
} else {
  baseStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsPath),
    filename: (_req, file, cb) => {
      const name = `${Date.now()}-${cleanFileName(file.originalname)}`;
      cb(null, name);
    },
  });
}

export const uploadMiddleware = multer({
  storage: baseStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 8 },
});

export const resolvePublicUrl = (storageKeyOrName: string) => {
  if (storageDriver === "supabase" && supabase) {
    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(storageKeyOrName);
    if (data?.publicUrl) {
      const url = data.publicUrl.replace("/courses/courses/", "/courses/");
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
      const url = signed.data.signedUrl.replace("/courses/courses/", "/courses/");
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

  const filePath = path.join(uploadsPath, storageKeyOrName);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

export interface StoredFile {
  storageKey: string;
  url: string;
}

export const persistUploadedFiles = async (files: Express.Multer.File[]): Promise<StoredFile[]> => {
  if (!files.length) return [];

  if (storageDriver === "supabase" && supabase) {
    const stored: StoredFile[] = [];
    for (const file of files) {
      const storageKey = `courses/${Date.now()}-${cleanFileName(file.originalname)}`;
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
      let url = await getSignedUrl(storageKey);
      // eslint-disable-next-line no-console
      console.log("[stor] saved supabase file", { storageKey, url, uploaded: !uploadResult.error });
      stored.push({ storageKey, url });
    }
    return stored;
  }

  return files.map((file) => {
    const storageKey = (file as any).key ?? file.filename;
    // eslint-disable-next-line no-console
    console.log("[stor] saved local/s3 file", { storageKey });
    return {
      storageKey,
      url: resolvePublicUrl(storageKey),
    };
  });
};
