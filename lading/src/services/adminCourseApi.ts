import adminApi from "./adminApi";
import { Course, CourseImage, UpsertCourseDto } from "@/types/course";

const basePath = "/courses";

export const adminCourseApi = {
  async list(): Promise<Course[]> {
    const { data } = await adminApi.get<Course[]>(basePath);
    return data;
  },

  async create(payload: UpsertCourseDto): Promise<Course> {
    const { data } = await adminApi.post<Course>(basePath, payload);
    return data;
  },

  async update(courseId: string, payload: UpsertCourseDto): Promise<Course> {
    const { data } = await adminApi.put<Course>(`${basePath}/${courseId}`, payload);
    return data;
  },

  async delete(courseId: string): Promise<void> {
    await adminApi.delete(`${basePath}/${courseId}`);
  },

  async uploadImages(courseId: string, files: File[]): Promise<CourseImage[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const { data } = await adminApi.post<CourseImage[]>(
      `${basePath}/${courseId}/images`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  async deleteImage(courseId: string, imageId: string): Promise<void> {
    await adminApi.delete(`${basePath}/${courseId}/images/${imageId}`);
  },
};
