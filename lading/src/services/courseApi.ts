import api from "./api";
import { Course, CourseImage, UpsertCourseDto } from "@/types/course";

const basePath = "/courses";

export const courseApi = {
  async list(): Promise<Course[]> {
    const { data } = await api.get<Course[]>(basePath);
    return data;
  },

  async getById(courseId: string): Promise<Course> {
    const { data } = await api.get<Course>(`${basePath}/${courseId}`);
    return data;
  },

  async create(payload: UpsertCourseDto): Promise<Course> {
    const { data } = await api.post<Course>(basePath, payload);
    return data;
  },

  async update(courseId: string, payload: UpsertCourseDto): Promise<Course> {
    const { data } = await api.put<Course>(`${basePath}/${courseId}`, payload);
    return data;
  },

  async delete(courseId: string): Promise<void> {
    await api.delete(`${basePath}/${courseId}`);
  },

  async uploadImages(courseId: string, files: File[]): Promise<CourseImage[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const { data } = await api.post<CourseImage[]>(`${basePath}/${courseId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteImage(courseId: string, imageId: string): Promise<void> {
    await api.delete(`${basePath}/${courseId}/images/${imageId}`);
  },
};
