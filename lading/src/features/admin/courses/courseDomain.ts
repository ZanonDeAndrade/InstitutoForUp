import { PILLARS, type PillarId } from "@/constants/pillars";
import type { Course, CourseFieldsConfig } from "@/types/course";

export const defaultCourseFields: CourseFieldsConfig = {
  name: true,
  email: true,
  phone: true,
  source: true,
};

export const normalizeCourse = (course: Course): Course => ({
  ...course,
  images: course.images ?? [],
  fields: course.fields ?? defaultCourseFields,
  pillar: (course.pillar as PillarId | undefined) ?? PILLARS[0].id,
});

export const slugifyCourseName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `course-${Date.now()}`;

export const isValidCourseImage = (file: File) =>
  file.size <= 2 * 1024 * 1024 && ["image/png", "image/jpeg", "image/webp"].includes(file.type);
