import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { adminCourseApi } from "@/services/adminCourseApi";
import type { PillarId } from "@/constants/pillars";
import type { Course, CourseFieldsConfig, CourseImage } from "@/types/course";
import { normalizeCourse, slugifyCourseName } from "./courseDomain";

export interface SaveCourseInput {
  editingCourseId: string | null;
  name: string;
  description: string;
  pillar: PillarId;
  fields: CourseFieldsConfig;
  files: File[];
}

export const useAdminCourses = (canManageCourses: boolean) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const remote = await adminCourseApi.list();
      setCourses(remote.map(normalizeCourse));
    } catch (error) {
      console.warn("Falha ao carregar cursos do backend.", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const saveCourse = useCallback(
    async ({ editingCourseId, name, description, pillar, fields, files }: SaveCourseInput) => {
      if (!canManageCourses) {
        toast.error("Acesso negado.");
        return false;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Informe o nome do curso.");
        return false;
      }

      setSaving(true);
      try {
        if (editingCourseId) {
          const updated = normalizeCourse(
            await adminCourseApi.update(editingCourseId, {
              id: editingCourseId,
              name: trimmedName,
              description: description.trim(),
              fields,
              pillar,
            }),
          );
          setCourses((current) => current.map((course) => (course.id === editingCourseId ? updated : course)));
          toast.success("Curso atualizado.");
        } else {
          const created = await adminCourseApi.create({
            id: slugifyCourseName(trimmedName),
            name: trimmedName,
            description: description.trim(),
            fields,
            pillar,
          });
          const images = files.length > 0 ? await adminCourseApi.uploadImages(created.id, files) : [];
          setCourses((current) => [
            ...current,
            normalizeCourse({ ...created, images: images.length ? images : created.images }),
          ]);
          toast.success("Curso cadastrado.");
        }
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Erro ao salvar o curso.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [canManageCourses],
  );

  const deleteCourse = useCallback(
    async (course: Course) => {
      if (!canManageCourses) {
        toast.error("Acesso negado.");
        return false;
      }
      try {
        await adminCourseApi.delete(course.id);
        setCourses((current) => current.filter((item) => item.id !== course.id));
        toast.success("Curso excluído.");
        return true;
      } catch (error) {
        console.error(error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setCourses((current) => current.filter((item) => item.id !== course.id));
          toast.success("Curso removido do painel (já não estava no servidor).");
          return true;
        }
        toast.error("Erro ao excluir curso.");
        return false;
      }
    },
    [canManageCourses],
  );

  const updateImages = useCallback((courseId: string, images: CourseImage[]) => {
    setCourses((current) => current.map((course) => (course.id === courseId ? { ...course, images } : course)));
  }, []);

  return { courses, loading, saving, loadCourses, saveCourse, deleteCourse, updateImages };
};

export type AdminCoursesModel = ReturnType<typeof useAdminCourses>;
