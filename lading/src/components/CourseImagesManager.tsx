import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CourseImage } from "@/types/course";
import { courseApi } from "@/services/courseApi";

interface CourseImagesManagerProps {
  courseId: string;
  images?: CourseImage[];
  onImagesChange: (images: CourseImage[]) => void;
}

const MAX_FILE_MB = 2;

const CourseImagesManager = ({ courseId, images = [], onImagesChange }: CourseImagesManagerProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const previews = useMemo(
    () => selectedFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [selectedFiles],
  );

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const invalid = files.find(
      (file) =>
        file.size > MAX_FILE_MB * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    );
    if (invalid) {
      toast.error("Apenas PNG/JPG/WebP até 2MB.");
      return;
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    try {
      const uploaded = await courseApi.uploadImages(courseId, selectedFiles);
      onImagesChange([...images, ...uploaded]);
      toast.success("Imagens enviadas com sucesso.");
      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao enviar imagens.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      await courseApi.deleteImage(courseId, imageId);
      onImagesChange(images.filter((image) => image.id !== imageId));
      toast.success("Imagem removida.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover imagem.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3">
        <Label className="text-sm text-muted-foreground">Fotos do curso</Label>
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleSelectFiles}
          className="bg-secondary border-border"
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {previews.map((preview) => (
              <div
                key={preview.url}
                className="relative h-20 w-28 overflow-hidden rounded-lg border border-border/60"
              >
                <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!selectedFiles.length || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? "Enviando..." : "Enviar imagens"}
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
              disabled={isUploading}
            >
              Limpar seleção
            </Button>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative h-24 w-32 overflow-hidden rounded-lg border border-border/60"
            >
              <img src={image.url} alt={image.alt || "Imagem do curso"} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100"
                disabled={isDeleting === image.id}
              >
                <span className="text-sm font-semibold text-destructive">
                  {isDeleting === image.id ? "Removendo..." : "Excluir"}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseImagesManager;
