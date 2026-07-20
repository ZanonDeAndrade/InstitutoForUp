import { PillarId } from "@/constants/pillars";
import type { CourseContent } from "./courseContent";

export interface CourseFieldsConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  source: boolean;
}

export interface CourseImage {
  id: string;
  url: string;
  alt?: string;
}

export interface Course {
  id: string; // slug/id used in routes
  name: string;
  description?: string | null;
  years?: number[];
  pillar?: PillarId;
  fields?: CourseFieldsConfig;
  images?: CourseImage[];
  content?: CourseContent | null;
}

export interface UpsertCourseDto {
  id?: string;
  name: string;
  description?: string;
  pillar: PillarId;
  fields?: CourseFieldsConfig;
  content?: CourseContent;
}

export type CourseFormValues = UpsertCourseDto;
