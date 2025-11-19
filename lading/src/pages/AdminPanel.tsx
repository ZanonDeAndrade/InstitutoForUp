import { useEffect, useState } from "react";
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
  course: string;
  submittedAt: string;
}

interface CourseFieldsConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  source: boolean;
}

interface CourseConfig {
  id: string;
  name: string;
  description: string;
  fields: CourseFieldsConfig;
}

const defaultFields: CourseFieldsConfig = {
  name: true,
  email: true,
  phone: true,
  source: true,
};

const defaultCourses: CourseConfig[] = [
  {
    id: "criterios-valores",
    name: "Critérios e Valores Humanos",
    description: "",
    fields: { ...defaultFields },
  },
  {
    id: "performando-liderancas",
    name: "Performando Lideranças",
    description: "",
    fields: { ...defaultFields },
  },
  {
    id: "jovens-lideres",
    name: "Jovens Líderes",
    description: "",
    fields: { ...defaultFields },
  },
  {
    id: "criatividade-empresarial",
    name: "Criatividade Empresarial",
    description: "",
    fields: { ...defaultFields },
  },
];

const COURSES_STORAGE_KEY = "forup_courses";

const AdminPanel = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<CourseConfig[]>(() => defaultCourses);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseFields] = useState<CourseFieldsConfig>({
    name: true,
    email: true,
    phone: true,
    source: true,
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseConfig | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("forup_leads") : null;
      const parsed: Lead[] = stored ? JSON.parse(stored) : [];
      setLeads(parsed);
    } catch (error) {
      console.error("Erro ao carregar leads salvos", error);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(COURSES_STORAGE_KEY) : null;
      const parsed: CourseConfig[] = stored ? JSON.parse(stored) : [];
      if (parsed && parsed.length > 0) {
        setCourses(parsed);
      }
    } catch (error) {
      console.error("Erro ao carregar cursos salvos", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error("Erro ao salvar cursos", error);
    }
  }, [courses]);

  const handleSaveCourse = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = newCourseName.trim();
    if (!trimmedName) {
      return;
    }

    const description = newCourseDescription.trim();

    if (editingCourseId) {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === editingCourseId ? { ...course, name: trimmedName, description } : course,
        ),
      );
    } else {
      const id = `course-${Date.now()}`;

      const course: CourseConfig = {
        id,
        name: trimmedName,
        description,
        fields: { ...newCourseFields },
      };

      setCourses((prev) => [...prev, course]);
    }

    setNewCourseName("");
    setNewCourseDescription("");
    setEditingCourseId(null);
  };

  const handleEditCourse = (course: CourseConfig) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseDescription(course.description);
  };

  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setNewCourseName("");
    setNewCourseDescription("");
  };

  const handleAskDeleteCourse = (course: CourseConfig) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteCourse = () => {
    if (!courseToDelete) return;

    const course = courseToDelete;
    setCourses((prev) => prev.filter((item) => item.id !== course.id));

    if (editingCourseId === course.id) {
      setEditingCourseId(null);
      setNewCourseName("");
      setNewCourseDescription("");
    }

    setDeleteDialogOpen(false);
    setCourseToDelete(null);
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

                <div className="flex justify-end gap-2">
                  {editingCourseId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" variant="hero">
                    {editingCourseId ? "Salvar alterações" : "Salvar curso"}
                  </Button>
                </div>
              </form>

              {courses.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Cursos cadastrados</h3>
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-lg border border-border/60 bg-secondary/20 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{course.name}</p>
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
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
            <CardHeader>
              <CardTitle className="text-2xl font-display text-foreground">
                Leads por curso
              </CardTitle>
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
                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {course.description}
                        </p>
                      )}
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
                                      {lead.source.replace("-", " ")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(lead.submittedAt).toLocaleString("pt-BR")}
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
        </div>
      </div>
    </CourseLayout>
  );
};

export default AdminPanel;
