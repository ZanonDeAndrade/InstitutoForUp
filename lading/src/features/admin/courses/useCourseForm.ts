import { useState } from "react";
import { PILLARS, type PillarId } from "@/constants/pillars";
import type { Course } from "@/types/course";
import type { AdminCoursesModel } from "./useAdminCourses";
import { defaultCourseFields } from "./courseDomain";
import { useCourseUploadSelection } from "../uploads/useCourseUploadSelection";

export const useCourseForm = (coursesModel: AdminCoursesModel, canManageImages: boolean) => {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pillar, setPillar] = useState<PillarId>(PILLARS[0].id);
  const uploads = useCourseUploadSelection(canManageImages);

  const reset = () => {
    setEditingCourseId(null);
    setName("");
    setDescription("");
    setPillar(PILLARS[0].id);
    uploads.clearFiles();
  };

  const resetAfterDeletedCourse = () => {
    setEditingCourseId(null);
    setName("");
    setDescription("");
    setPillar(PILLARS[0].id);
  };

  const edit = (course: Course) => {
    setEditingCourseId(course.id);
    setName(course.name);
    setDescription(course.description ?? "");
    setPillar(course.pillar ?? PILLARS[0].id);
  };

  const submit = async () => {
    const saved = await coursesModel.saveCourse({
      editingCourseId,
      name,
      description,
      pillar,
      fields: defaultCourseFields,
      files: uploads.files,
    });
    if (saved) reset();
  };

  return {
    editingCourseId,
    name,
    setName,
    description,
    setDescription,
    pillar,
    setPillar,
    edit,
    reset,
    resetAfterDeletedCourse,
    submit,
    uploads,
  };
};
