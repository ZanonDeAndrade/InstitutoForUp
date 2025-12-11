import { PillarId } from "@/constants/pillars";

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
}

export interface UpsertCourseDto {
  id?: string;
  name: string;
  description?: string;
  pillar: PillarId;
  fields?: CourseFieldsConfig;
}
