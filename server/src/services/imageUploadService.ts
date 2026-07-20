import crypto from "node:crypto";
import sharp from "sharp";
import type { StoragePrefix } from "./supabaseStorageService";

export const MAX_UPLOAD_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_WIDTH = 4096;
export const MAX_UPLOAD_IMAGE_HEIGHT = 4096;
export const MAX_UPLOAD_IMAGE_PIXELS = 12_000_000;
export const SAFE_UPLOAD_CONTENT_TYPE = "image/webp";
export const SAFE_UPLOAD_EXTENSION = "webp";

const ALLOWED_INPUT_FORMATS = new Set(["png", "jpeg", "webp"]);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export class ImageUploadError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const hasOnlyTrailingWhitespace = (buffer: Buffer, start: number) => {
  for (let index = start; index < buffer.length; index += 1) {
    const byte = buffer[index];
    if (byte !== 0x00 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d && byte !== 0x20) {
      return false;
    }
  }
  return true;
};

const assertPngIsNotPolyglot = (buffer: Buffer) => {
  if (!buffer.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new ImageUploadError("UPLOAD_IMAGE_SIGNATURE_INVALID");
  }

  let offset = pngSignature.length;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    offset += 12 + length;
    if (offset > buffer.length) {
      throw new ImageUploadError("UPLOAD_IMAGE_CORRUPTED");
    }
    if (type === "IEND") {
      if (!hasOnlyTrailingWhitespace(buffer, offset)) {
        throw new ImageUploadError("UPLOAD_IMAGE_POLYGLOT_BLOCKED");
      }
      return;
    }
  }

  throw new ImageUploadError("UPLOAD_IMAGE_CORRUPTED");
};

const assertJpegIsNotPolyglot = (buffer: Buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new ImageUploadError("UPLOAD_IMAGE_SIGNATURE_INVALID");
  }

  const eoi = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
  if (eoi < 2) {
    throw new ImageUploadError("UPLOAD_IMAGE_CORRUPTED");
  }
  if (!hasOnlyTrailingWhitespace(buffer, eoi + 2)) {
    throw new ImageUploadError("UPLOAD_IMAGE_POLYGLOT_BLOCKED");
  }
};

const assertWebpIsNotPolyglot = (buffer: Buffer) => {
  if (
    buffer.length < 12 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    throw new ImageUploadError("UPLOAD_IMAGE_SIGNATURE_INVALID");
  }

  const riffSize = buffer.readUInt32LE(4);
  const expectedLength = riffSize + 8;
  if (expectedLength > buffer.length) {
    throw new ImageUploadError("UPLOAD_IMAGE_CORRUPTED");
  }
  if (!hasOnlyTrailingWhitespace(buffer, expectedLength)) {
    throw new ImageUploadError("UPLOAD_IMAGE_POLYGLOT_BLOCKED");
  }
};

const assertStrictContainer = (buffer: Buffer, format: string) => {
  if (format === "png") {
    assertPngIsNotPolyglot(buffer);
    return;
  }
  if (format === "jpeg") {
    assertJpegIsNotPolyglot(buffer);
    return;
  }
  if (format === "webp") {
    assertWebpIsNotPolyglot(buffer);
    return;
  }
  throw new ImageUploadError("UPLOAD_IMAGE_TYPE_NOT_ALLOWED");
};

export interface SanitizedImage {
  buffer: Buffer;
  contentType: typeof SAFE_UPLOAD_CONTENT_TYPE;
  extension: typeof SAFE_UPLOAD_EXTENSION;
  width: number;
  height: number;
}

export const sanitizeUploadedImage = async (buffer: Buffer): Promise<SanitizedImage> => {
  if (!buffer?.length) {
    throw new ImageUploadError("UPLOAD_IMAGE_EMPTY");
  }
  if (buffer.length > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
    throw new ImageUploadError("UPLOAD_IMAGE_TOO_LARGE");
  }

  let image = sharp(buffer, {
    failOn: "warning",
    limitInputPixels: MAX_UPLOAD_IMAGE_PIXELS,
  });
  const metadata = await image.metadata().catch(() => {
    throw new ImageUploadError("UPLOAD_IMAGE_CORRUPTED");
  });

  if (!metadata.format || !ALLOWED_INPUT_FORMATS.has(metadata.format)) {
    throw new ImageUploadError("UPLOAD_IMAGE_TYPE_NOT_ALLOWED");
  }
  assertStrictContainer(buffer, metadata.format);

  if (!metadata.width || !metadata.height) {
    throw new ImageUploadError("UPLOAD_IMAGE_DIMENSIONS_INVALID");
  }
  if (metadata.width > MAX_UPLOAD_IMAGE_WIDTH || metadata.height > MAX_UPLOAD_IMAGE_HEIGHT) {
    throw new ImageUploadError("UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE");
  }

  image = sharp(buffer, {
    failOn: "warning",
    limitInputPixels: MAX_UPLOAD_IMAGE_PIXELS,
  }).rotate();

  const output = await image
    .resize({
      width: MAX_UPLOAD_IMAGE_WIDTH,
      height: MAX_UPLOAD_IMAGE_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new ImageUploadError("UPLOAD_IMAGE_REPROCESS_FAILED");
    });

  return {
    buffer: output.data,
    contentType: SAFE_UPLOAD_CONTENT_TYPE,
    extension: SAFE_UPLOAD_EXTENSION,
    width: output.info.width,
    height: output.info.height,
  };
};

export const buildRandomImageStorageKey = (prefix: StoragePrefix, extension = SAFE_UPLOAD_EXTENSION) =>
  `${prefix}/${crypto.randomUUID()}.${extension}`;
