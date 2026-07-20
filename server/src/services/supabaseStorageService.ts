import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { env } from "../config/env";

const SUPABASE_SIGNED_URL_TTL_SECONDS = 5 * 60;
const ALLOWED_PREFIXES = ["courses", "news"] as const;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export type StoragePrefix = (typeof ALLOWED_PREFIXES)[number];

const keyPattern = /^(courses|news)\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

let privilegedClient: SupabaseClient | null = null;

const getPrivilegedClient = () => {
  if (env.STORAGE_DRIVER !== "supabase") {
    throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  }
  if (!privilegedClient) {
    privilegedClient = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return privilegedClient;
};

export const isAllowedStoragePrefix = (value: string): value is StoragePrefix =>
  (ALLOWED_PREFIXES as readonly string[]).includes(value);

export const assertAllowedStoragePrefix = (value: string): StoragePrefix => {
  if (!isAllowedStoragePrefix(value)) {
    throw new Error("STORAGE_PREFIX_NOT_ALLOWED");
  }
  return value;
};

export const assertAllowedStorageKey = (storageKey: string, expectedPrefix?: StoragePrefix) => {
  const normalized = storageKey.trim();
  if (
    !normalized ||
    normalized.includes("\\") ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.includes("://") ||
    !keyPattern.test(normalized)
  ) {
    throw new Error("STORAGE_KEY_NOT_ALLOWED");
  }

  const [prefix, fileName] = normalized.split("/");
  if (!prefix || !fileName) {
    throw new Error("STORAGE_KEY_NOT_ALLOWED");
  }
  const allowedPrefix = assertAllowedStoragePrefix(prefix);
  if (expectedPrefix && allowedPrefix !== expectedPrefix) {
    throw new Error("STORAGE_KEY_PREFIX_MISMATCH");
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("STORAGE_FILE_TYPE_NOT_ALLOWED");
  }

  return normalized;
};

export const buildStorageKey = (prefix: StoragePrefix) => {
  assertAllowedStoragePrefix(prefix);
  return assertAllowedStorageKey(`${prefix}/${crypto.randomUUID()}.webp`, prefix);
};

export const supabaseStorageService = {
  bucket: env.SUPABASE_BUCKET,
  signedUrlTtlSeconds: SUPABASE_SIGNED_URL_TTL_SECONDS,

  async uploadObject(input: {
    storageKey: string;
    buffer: Buffer;
    contentType: string;
    prefix: StoragePrefix;
  }) {
    const storageKey = assertAllowedStorageKey(input.storageKey, input.prefix);
    const result = await getPrivilegedClient()
      .storage
      .from(env.SUPABASE_BUCKET)
      .upload(storageKey, input.buffer, {
        contentType: input.contentType,
        upsert: false,
      });

    if (result.error) {
      throw result.error;
    }

    return storageKey;
  },

  async createSignedReadUrl(storageKey: string) {
    const safeKey = assertAllowedStorageKey(storageKey);
    const result = await getPrivilegedClient()
      .storage
      .from(env.SUPABASE_BUCKET)
      .createSignedUrl(safeKey, SUPABASE_SIGNED_URL_TTL_SECONDS);

    if (result.error) {
      throw result.error;
    }

    return result.data.signedUrl;
  },

  async downloadObject(storageKey: string) {
    const safeKey = assertAllowedStorageKey(storageKey);
    const result = await getPrivilegedClient().storage.from(env.SUPABASE_BUCKET).download(safeKey);

    if (result.error) {
      throw result.error;
    }

    const buffer = Buffer.from(await result.data.arrayBuffer());
    return { buffer, contentType: result.data.type || "application/octet-stream" };
  },

  async deleteObject(storageKey: string) {
    const safeKey = assertAllowedStorageKey(storageKey);
    const result = await getPrivilegedClient().storage.from(env.SUPABASE_BUCKET).remove([safeKey]);

    if (result.error) {
      throw result.error;
    }
  },
};
