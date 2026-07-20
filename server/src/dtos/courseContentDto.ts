import { z } from "zod";

const textValue = z.string().trim().min(1).max(5000);
const safeAssetUrl = z.string().max(2000).refine((value) => {
  if (value.startsWith("/")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
});
const safeExternalUrl = z.string().max(2000).refine((value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
});

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1).max(100),
    type: z.literal("text"),
    heading: z.string().max(300).optional(),
    paragraphs: z.array(textValue).max(30).default([]),
    bullets: z.array(textValue).max(30).optional(),
    align: z.enum(["left", "center"]).default("center"),
  }),
  z.object({
    id: z.string().min(1).max(100),
    type: z.literal("details"),
    heading: z.string().max(300),
    items: z.array(z.object({ title: z.string().max(200), text: textValue })).min(1).max(30),
  }),
]);

const formFieldsSchema = z.object({
  name: z.boolean(),
  email: z.boolean(),
  phone: z.boolean(),
  source: z.boolean(),
});

const containsHtml = (value: unknown): boolean => {
  if (typeof value === "string") return /<\/?[a-z][^>]*>/i.test(value);
  if (Array.isArray(value)) return value.some(containsHtml);
  if (value && typeof value === "object") return Object.values(value).some(containsHtml);
  return false;
};

export const courseContentSchema = z.object({
  version: z.literal(1),
  seo: z.object({
    title: z.string().max(120).optional(),
    description: z.string().max(300).optional(),
    image: safeAssetUrl.optional(),
  }).optional(),
  hero: z.object({ quote: z.string().max(500).optional() }).optional(),
  sections: z.array(sectionSchema).max(50),
  images: z.array(z.object({
    id: z.string().min(1).max(100),
    src: safeAssetUrl,
    alt: z.string().max(300),
    caption: z.string().max(500).optional(),
  })).max(30).optional(),
  cta: z.discriminatedUnion("type", [
    z.object({ type: z.literal("form"), label: z.string().max(100).optional() }),
    z.object({
      type: z.literal("external"),
      label: z.string().min(1).max(100),
      url: safeExternalUrl,
      helperText: z.string().max(300).optional(),
      collapsedSections: z.array(sectionSchema).optional(),
    }),
  ]).default({ type: "form" }),
  form: z.object({ fields: formFieldsSchema }).optional(),
  specific: z.record(z.string(), z.union([z.string().max(1000), z.number(), z.boolean()])).optional(),
}).superRefine((value, context) => {
  if (containsHtml(value)) {
    context.addIssue({ code: "custom", message: "HTML nao e permitido no conteudo editorial" });
  }
});

export type CourseContentDto = z.infer<typeof courseContentSchema>;
