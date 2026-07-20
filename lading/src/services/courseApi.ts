import publicApi from "./publicApi";
import { Course } from "@/types/course";

const basePath = "/courses";

export const courseApi = {
  async list(): Promise<Course[]> {
    const { data } = await publicApi.get<Course[]>(basePath);
    return data;
  },

  async getById(courseId: string): Promise<Course> {
    const { data } = await publicApi.get<Course>(`${basePath}/${courseId}`);
    return data;
  },
};
