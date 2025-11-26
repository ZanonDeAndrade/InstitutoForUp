"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadNewsImage = exports.persistUploadedFiles = exports.deleteStoredObject = exports.downloadFromStorage = exports.getSignedUrl = exports.resolvePublicUrl = exports.uploadMiddleware = exports.createUploadMiddleware = exports.NEWS_ALLOWED_MIME_TYPES = exports.ALLOWED_MIME_TYPES = exports.MAX_FILE_SIZE_BYTES = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const supabase_js_1 = require("@supabase/supabase-js");
exports.MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
exports.ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
exports.NEWS_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const storageDriver = process.env.STORAGE_DRIVER ?? "local";
const uploadsRoot = process.env.UPLOADS_DIR ?? "uploads";
const defaultFolder = "courses";
const ensureLocalFolder = (folder) => {
    if (storageDriver === "local") {
        node_fs_1.default.mkdirSync(node_path_1.default.join(process.cwd(), uploadsRoot, folder), { recursive: true });
    }
};
ensureLocalFolder(defaultFolder);
const s3 = storageDriver === "s3"
    ? new client_s3_1.S3Client({
        region: process.env.AWS_REGION ?? "auto",
        endpoint: process.env.AWS_S3_ENDPOINT,
        forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
            : undefined,
    })
    : null;
const supabase = storageDriver === "supabase" && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;
const supabaseBucket = process.env.SUPABASE_BUCKET ?? "courses";
const cleanFileName = (name) => name.replace(/[^\w.-]+/g, "-").toLowerCase();
const fileFilter = (_req, file, cb) => {
    if (!exports.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new multer_1.default.MulterError("LIMIT_UNEXPECTED_FILE", "Tipo inválido"));
    }
    cb(null, true);
};
const createStorageFor = (folder) => {
    if (storageDriver === "s3" && s3) {
        return (0, multer_s3_1.default)({
            s3,
            bucket: process.env.AWS_S3_BUCKET ?? "",
            contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
            key: (_req, file, cb) => {
                const key = `${folder}/${Date.now()}-${cleanFileName(file.originalname)}`;
                cb(null, key);
            },
        });
    }
    if (storageDriver === "supabase") {
        return multer_1.default.memoryStorage();
    }
    ensureLocalFolder(folder);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, node_path_1.default.join(process.cwd(), uploadsRoot, folder)),
        filename: (_req, file, cb) => {
            const name = `${Date.now()}-${cleanFileName(file.originalname)}`;
            cb(null, name);
        },
    });
};
const createUploadMiddleware = (folder = defaultFolder) => (0, multer_1.default)({
    storage: createStorageFor(folder),
    fileFilter,
    limits: { fileSize: exports.MAX_FILE_SIZE_BYTES, files: 8 },
});
exports.createUploadMiddleware = createUploadMiddleware;
exports.uploadMiddleware = (0, exports.createUploadMiddleware)(defaultFolder);
const normalizeSupabaseUrl = (url) => {
    if (!url)
        return "";
    return url.replace(`/${supabaseBucket}/${supabaseBucket}/`, `/${supabaseBucket}/`);
};
const resolvePublicUrl = (storageKeyOrName) => {
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
exports.resolvePublicUrl = resolvePublicUrl;
const getSignedUrl = async (storageKeyOrName) => {
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
    return (0, exports.resolvePublicUrl)(storageKeyOrName);
};
exports.getSignedUrl = getSignedUrl;
const downloadFromStorage = async (storageKey) => {
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
exports.downloadFromStorage = downloadFromStorage;
const deleteStoredObject = async (storageKeyOrName) => {
    if (storageDriver === "supabase" && supabase) {
        await supabase.storage.from(supabaseBucket).remove([storageKeyOrName]);
        return;
    }
    if (storageDriver === "s3" && s3) {
        const bucket = process.env.AWS_S3_BUCKET;
        if (!bucket)
            return;
        await s3.send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucket,
            Key: storageKeyOrName,
        }));
        return;
    }
    const filePath = node_path_1.default.join(process.cwd(), uploadsRoot, storageKeyOrName);
    if (node_fs_1.default.existsSync(filePath)) {
        await node_fs_1.default.promises.unlink(filePath);
    }
};
exports.deleteStoredObject = deleteStoredObject;
const persistUploadedFiles = async (files, folder = defaultFolder) => {
    if (!files.length)
        return [];
    if (storageDriver === "supabase" && supabase) {
        const stored = [];
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
            const url = await (0, exports.getSignedUrl)(storageKey);
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
        const storageKey = file.key ?? `${folder}/${file.filename}`;
        // eslint-disable-next-line no-console
        console.log("[stor] saved local/s3 file", { storageKey });
        return {
            storageKey,
            url: (0, exports.resolvePublicUrl)(storageKey),
        };
    });
};
exports.persistUploadedFiles = persistUploadedFiles;
const uploadNewsImage = async (file) => {
    if (!file) {
        throw new Error("NEWS_IMAGE_REQUIRED");
    }
    if (!exports.NEWS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error("NEWS_IMAGE_INVALID_TYPE");
    }
    if (file.size > exports.MAX_FILE_SIZE_BYTES) {
        throw new Error("NEWS_IMAGE_TOO_LARGE");
    }
    const [stored] = await (0, exports.persistUploadedFiles)([file], "news");
    if (!stored) {
        throw new Error("NEWS_IMAGE_UPLOAD_FAILED");
    }
    return stored;
};
exports.uploadNewsImage = uploadNewsImage;
