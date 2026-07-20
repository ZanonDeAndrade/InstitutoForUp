import { useState, type FormEvent } from "react";
import CourseImagesManager from "@/components/CourseImagesManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PILLARS, type PillarId } from "@/constants/pillars";
import type { Course } from "@/types/course";
import { DeleteCourseDialog } from "../modals/AdminConfirmDialogs";
import type { AdminCoursesModel } from "./useAdminCourses";
import { useCourseForm } from "./useCourseForm";

interface CourseManagementProps {
  model: AdminCoursesModel;
  canManageImages: boolean;
}

export const CourseManagement = ({ model, canManageImages }: CourseManagementProps) => {
  const form = useCourseForm(model, canManageImages);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    const deleted = await model.deleteCourse(courseToDelete);
    if (!deleted) return;
    if (form.editingCourseId === courseToDelete.id) form.resetAfterDeletedCourse();
    setCourseToDelete(null);
  };

  return (
    <Card className="bg-card shadow-card mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-display text-foreground">Cadastro de cursos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <Label htmlFor="course-name">Nome do curso</Label>
              <Input
                id="course-name"
                value={form.name}
                onChange={(event) => form.setName(event.target.value)}
                placeholder="Ex.: Liderança Humanizada"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="course-pillar">Pilar de formação</Label>
              <select
                id="course-pillar"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.pillar}
                onChange={(event) => form.setPillar(event.target.value as PillarId)}
              >
                {PILLARS.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="course-description">Descrição</Label>
              <Textarea
                id="course-description"
                value={form.description}
                onChange={(event) => form.setDescription(event.target.value)}
                placeholder="Breve descrição para identificar o curso no painel."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          {canManageImages && (
            <div className="space-y-2">
              <Label htmlFor="course-images">Fotos do curso (PNG/JPG/WebP, até 2MB)</Label>
              <Input
                id="course-images"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => form.uploads.selectFiles(Array.from(event.target.files ?? []))}
                className="bg-secondary border-border text-foreground"
              />
              {form.uploads.previews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.uploads.previews.map((preview) => (
                    <div
                      key={preview.url}
                      className="relative h-20 w-28 overflow-hidden rounded-lg border border-border/60"
                    >
                      <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {form.editingCourseId && (
              <Button type="button" variant="outline" onClick={form.reset}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="hero" disabled={model.saving}>
              {model.saving ? "Salvando..." : form.editingCourseId ? "Salvar alterações" : "Salvar curso"}
            </Button>
          </div>
        </form>

        {model.courses.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Cursos cadastrados</h3>
            {model.loading && <p className="text-sm text-muted-foreground">Carregando cursos...</p>}
            {model.courses.map((course) => {
              const pillarLabel = PILLARS.find((pillar) => pillar.id === course.pillar)?.label ?? "Não definido";
              return (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 rounded-lg border border-border/60 bg-secondary/20 px-4 py-4"
                >
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{course.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Pilar: <span className="text-foreground">{pillarLabel}</span>
                    </p>
                    {course.description && <p className="text-sm text-muted-foreground mt-1">{course.description}</p>}
                    <CourseImagesManager
                      courseId={course.id}
                      images={course.images ?? []}
                      onImagesChange={(images) => model.updateImages(course.id, images)}
                      canManage={canManageImages}
                    />
                  </div>
                  <div className="flex gap-2 self-end md:self-auto">
                    <Button type="button" variant="outline" size="sm" onClick={() => form.edit(course)}>
                      Editar
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => setCourseToDelete(course)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DeleteCourseDialog course={courseToDelete} onCancel={() => setCourseToDelete(null)} onConfirm={confirmDelete} />
      </CardContent>
    </Card>
  );
};
