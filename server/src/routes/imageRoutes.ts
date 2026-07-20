import { Router } from "express";
import { imageProxyRateLimiter } from "../config/rateLimit";
import {
  publicImageService,
  type PublicImageKind,
  type PublicImageService,
} from "../services/publicImageService";
import { asyncHandler } from "../utils/asyncHandler";

const PUBLIC_IMAGE_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
const NOT_FOUND_CACHE_CONTROL = "no-store";

export const createImageRoutes = (service: PublicImageService = publicImageService) => {
  const router = Router();

  const serveImage = (kind: PublicImageKind) =>
    asyncHandler(async (req, res) => {
      const { imageId } = req.params;
      if (!imageId) {
        res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
        return res.status(404).send();
      }

      const image = await service.getPublicImage(kind, imageId);
      if (!image) {
        res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
        return res.status(404).send();
      }

      res.setHeader("Cache-Control", PUBLIC_IMAGE_CACHE_CONTROL);
      res.setHeader("Content-Type", image.contentType);
      return res.send(image.buffer);
    });

  router.get("/course/:imageId", imageProxyRateLimiter, serveImage("course"));
  router.get("/news/:imageId", imageProxyRateLimiter, serveImage("news"));

  router.get("/:storageKey(*)", imageProxyRateLimiter, (_req, res) => {
    res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
    return res.status(404).send();
  });

  return router;
};

export default createImageRoutes();
