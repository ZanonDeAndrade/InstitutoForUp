import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isValidCourseImage } from "../courses/courseDomain";

export const useCourseUploadSelection = (canManageImages: boolean) => {
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  const selectFiles = (selected: File[]) => {
    if (!canManageImages || selected.length === 0) return;
    if (selected.some((file) => !isValidCourseImage(file))) {
      toast.error("Use PNG/JPG/WebP até 2MB.");
      return;
    }
    setFiles(selected);
  };

  return { files, previews, selectFiles, clearFiles: () => setFiles([]) };
};
