import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CourseImagesManager from "@/components/CourseImagesManager";
import { courseApi } from "@/services/courseApi";
import { Course, CourseFieldsConfig, CourseImage } from "@/types/course";
import { toast } from "sonner";
import { leadSourceLabel } from "@/constants/leadSources";
import EllipsisText from "@/components/EllipsisText";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Lead {
  name: string;
  email: string;
  phone: string;
  source: string;
  message?: string;
  course: string;
  submittedAt: string;
}

const defaultFields: CourseFieldsConfig = {
  name: true,
  email: true,
  phone: true,
  source: true,
};

const AdminPanel = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseFields] = useState<CourseFieldsConfig>({
    name: true,
    email: true,
    phone: true,
    source: true,
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourseFiles, setNewCourseFiles] = useState<File[]>([]);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [clearingLeads, setClearingLeads] = useState(false);
  const [clearingCourseId, setClearingCourseId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    courseId: string | null;
    courseName: string | null;
    scope: "all" | "course" | null;
  }>({ open: false, courseId: null, courseName: null, scope: null });

  const newCoursePreviews = useMemo(
    () => newCourseFiles.map((file) => ({ url: URL.createObjectURL(file), name: file.name })),
    [newCourseFiles],
  );

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `course-${Date.now()}`;

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("forup_leads") : null;
      const parsed: Lead[] = stored ? JSON.parse(stored) : [];
      setLeads(parsed);
      console.log("[admin] leads loaded", parsed.length);
    } catch (error) {
      console.error("Erro ao carregar leads salvos", error);
    }
  }, []);

  useEffect(() => {
    const normalizeCourse = (course: Course): Course => ({
      ...course,
      images: course.images ?? [],
      fields: (course.fields as CourseFieldsConfig | undefined) ?? defaultFields,
    });

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const remote = await courseApi.list();
        console.log("[admin] remote courses", remote);
        setCourses(remote.map(normalizeCourse));
      } catch (error) {
        console.warn("Falha ao carregar cursos do backend.", error);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const handleSaveCourse = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = newCourseName.trim();
    if (!trimmedName) {
      toast.error("Informe o nome do curso.");
      return;
    }

    const description = newCourseDescription.trim();

    setIsSavingCourse(true);

    try {
      if (editingCourseId) {
        const updated = await courseApi.update(editingCourseId, {
          id: editingCourseId,
          name: trimmedName,
          description,
          fields: newCourseFields,
        });
        setCourses((prev) => prev.map((course) => (course.id === editingCourseId ? updated : course)));
        toast.success("Curso atualizado.");
      } else {
        const slug = slugify(trimmedName);
        const created = await courseApi.create({
          id: slug,
          name: trimmedName,
          description,
          fields: newCourseFields,
        });

        let images: CourseImage[] = [];
        if (newCourseFiles.length > 0) {
          images = await courseApi.uploadImages(created.id, newCourseFiles);
        }

        const newCourse: Course = {
          ...created,
          images: images.length ? images : created.images ?? [],
          fields: created.fields ?? newCourseFields,
        };

        setCourses((prev) => [...prev, newCourse]);
        toast.success("Curso cadastrado.");
      }

      setNewCourseName("");
      setNewCourseDescription("");
      setEditingCourseId(null);
      setNewCourseFiles([]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar o curso.");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseDescription(course.description ?? "");
  };

  const handleSelectNewCourseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const invalid = files.find(
      (file) =>
        file.size > 2 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    );
    if (invalid) {
      toast.error("Use PNG/JPG/WebP até 2MB.");
      return;
    }
    setNewCourseFiles(files);
  };

  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setNewCourseName("");
    setNewCourseDescription("");
    setNewCourseFiles([]);
  };

  const handleAskDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const askClearAllLeads = () =>
    setConfirmModal({ open: true, courseId: null, courseName: null, scope: "all" });

  const askClearLeadsByCourse = (courseName: string, courseId: string) =>
    setConfirmModal({ open: true, courseId, courseName, scope: "course" });

  const handleConfirmClear = () => {
    const { scope, courseId, courseName } = confirmModal;
    if (!scope) return;

    if (scope === "all") {
      setClearingLeads(true);
      try {
        setLeads([]);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("forup_leads");
        }
        toast.success("Leads locais removidos do painel.");
      } catch (error) {
        console.error("Erro ao limpar leads locais", error);
        toast.error("Não foi possível limpar os leads locais.");
      } finally {
        setClearingLeads(false);
        setConfirmModal({ open: false, courseId: null, courseName: null, scope: null });
      }
      return;
    }

    if (scope === "course" && courseId && courseName) {
      setClearingCourseId(courseId);
      try {
        setLeads((prev) => {
          const filtered = prev.filter((lead) => lead.course !== courseName);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("forup_leads", JSON.stringify(filtered));
          }
          return filtered;
        });
        toast.success(`Leads locais do curso "${courseName}" foram removidos deste painel.`);
      } catch (error) {
        console.error("Erro ao limpar leads locais por curso", error);
        toast.error("Não foi possível limpar os leads locais deste curso.");
      } finally {
        setClearingCourseId(null);
        setConfirmModal({ open: false, courseId: null, courseName: null, scope: null });
      }
    }
  };

  const handleCancelClear = () => {
    setConfirmModal({ open: false, courseId: null, courseName: null, scope: null });
  };

  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    const course = courseToDelete;
    try {
      await courseApi.delete(course.id);
      setCourses((prev) => prev.filter((item) => item.id !== course.id));
      toast.success("Curso excluído.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Backend não achou o curso, mas removemos do painel/local para manter consistência.
        setCourses((prev) => prev.filter((item) => item.id !== course.id));
        toast.success("Curso removido do painel (já não estava no servidor).");
      } else {
        toast.error("Erro ao excluir curso.");
        return;
      }
    }

    if (editingCourseId === course.id) {
      setEditingCourseId(null);
      setNewCourseName("");
      setNewCourseDescription("");
    }

    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const handleImagesChange = (courseId: string, images: CourseImage[]) => {
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, images } : course)));
  };

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient-gold">
              Painel do Administrador
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe os interesses registrados em cada curso e gerencie os programas disponíveis.
            </p>
            <div className="mt-4 flex justify-center">
              <Button asChild variant="secondary">
                <Link to="/admin/news">Gerenciar notícias</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-card shadow-card mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-display text-foreground">
                Cadastro de cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCourse} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-1">
                    <Label htmlFor="course-name">Nome do curso</Label>
                    <Input
                      id="course-name"
                      value={newCourseName}
                      onChange={(event) => setNewCourseName(event.target.value)}
                      placeholder="Ex.: Liderança Humanizada"
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="course-description">Descrição</Label>
                    <Textarea
                      id="course-description"
                      value={newCourseDescription}
                      onChange={(event) => setNewCourseDescription(event.target.value)}
                      placeholder="Breve descrição para identificar o curso no painel."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-images">
                    Fotos do curso (PNG/JPG/WebP, até 2MB)
                  </Label>
                  <Input
                    id="course-images"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleSelectNewCourseFiles}
                    className="bg-secondary border-border text-foreground"
                  />
                  {newCoursePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {newCoursePreviews.map((preview) => (
                        <div
                          key={preview.url}
                          className="relative h-20 w-28 overflow-hidden rounded-lg border border-border/60"
                        >
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {editingCourseId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" variant="hero" disabled={isSavingCourse}>
                    {isSavingCourse
                      ? "Salvando..."
                      : editingCourseId
                        ? "Salvar alterações"
                        : "Salvar curso"}
                  </Button>
                </div>
              </form>

              {courses.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Cursos cadastrados</h3>
                  {loadingCourses && (
                    <p className="text-sm text-muted-foreground">Carregando cursos...</p>
                  )}
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col gap-4 rounded-lg border border-border/60 bg-secondary/20 px-4 py-4"
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">{course.name}</p>
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.description}
                          </p>
                        )}
                        <CourseImagesManager
                          courseId={course.id}
                          images={course.images ?? []}
                          onImagesChange={(images) => handleImagesChange(course.id, images)}
                        />
                      </div>
                      <div className="flex gap-2 self-end md:self-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAskDeleteCourse(course)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) {
                    setCourseToDelete(null);
                  }
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir curso</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o curso{" "}
                      <span className="font-semibold text-foreground">
                        {courseToDelete?.name}
                      </span>
                      ?
                      <br />
                      <br />
                      Essa ação não pode ser desfeita e o curso deixará de aparecer na página e
                      na listagem de leads.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleConfirmDeleteCourse}
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-card">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-2xl font-display text-foreground">
                Leads por curso
              </CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={askClearAllLeads}
                disabled={clearingLeads}
              >
                {clearingLeads ? "Limpando..." : "Limpar leads locais"}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={courses[0]?.id}>
                <TabsList className="mb-4">
                  {courses.map((course) => {
                    const count = leads.filter((lead) => lead.course === course.name).length;
                    return (
                      <TabsTrigger key={course.id} value={course.id}>
                        {course.name}
                        {count > 0 && (
                          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                            {count}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {courses.map((course) => {
                  const courseLeads = leads.filter((lead) => lead.course === course.name);

                  return (
                    <TabsContent key={course.id} value={course.id}>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        {course.description && (
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => askClearLeadsByCourse(course.name, course.id)}
                          disabled={clearingCourseId === course.id}
                        >
                          {clearingCourseId === course.id ? "Limpando..." : "Limpar leads deste curso"}
                        </Button>
                      </div>
                      {courseLeads.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum interesse registrado ainda para este curso.
                        </p>
                      ) : (
                        <div className="rounded-xl border border-border/60 overflow-hidden">
                          <Table>
                            <TableHeader className="bg-secondary/40">
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Origem</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Dúvidas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {courseLeads.map((lead, index) => (
                              <TableRow key={`${lead.email}-${lead.submittedAt}-${index}`}>
                                  <TableCell className="font-medium">{lead.name}</TableCell>
                                  <TableCell>{lead.email}</TableCell>
                                  <TableCell>{lead.phone}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                      {leadSourceLabel(lead.source)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(lead.submittedAt).toLocaleString("pt-BR")}
                                  </TableCell>
                                  <TableCell className="max-w-[220px]">
                                    {lead.message ? (
                                      <EllipsisText text={lead.message} maxLength={60} />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          <AlertDialog open={confirmModal.open} onOpenChange={(open) => !open && handleCancelClear()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmModal.scope === "all" && (
                    <>
                      Tem certeza que deseja remover todos os leads locais deste painel?
                      <br />
                      Esta ação não afeta o Supabase, apenas o cache local.
                    </>
                  )}
                  {confirmModal.scope === "course" && confirmModal.courseName && (
                    <>
                      Tem certeza que deseja remover os leads locais do curso{" "}
                      <span className="font-semibold text-foreground">"{confirmModal.courseName}"</span>?
                      <br />
                      Esta ação não afeta o Supabase, apenas o cache deste painel.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelClear}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClear} className="bg-destructive hover:bg-destructive/90">
                  Sim, remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </CourseLayout>
  );
};

export default AdminPanel;
