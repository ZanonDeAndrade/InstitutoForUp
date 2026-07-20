import EllipsisText from "@/components/EllipsisText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leadSourceLabel } from "@/constants/leadSources";
import type { LeadVisibility } from "@/services/adminLeadApi";
import type { Course } from "@/types/course";
import type { Lead } from "@/types/lead";
import { ArchiveLeadsDialog } from "../modals/AdminConfirmDialogs";
import { useAdminLeads } from "./useAdminLeads";

interface LeadsManagementProps {
  courses: Course[];
  loadingCourses: boolean;
  canDeleteLeads: boolean;
}

const leadMatchesCourse = (lead: Lead, course: Course) => lead.courseId === course.id || lead.course === course.name;

export const LeadsManagement = ({ courses, loadingCourses, canDeleteLeads }: LeadsManagementProps) => {
  const model = useAdminLeads(true, canDeleteLeads);

  return (
    <>
      <Card className="bg-card shadow-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-2xl font-display text-foreground">Leads por curso</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={model.visibility}
              onChange={(event) => model.setVisibility(event.target.value as LeadVisibility)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">Ativos</option>
              <option value="deleted">Arquivados</option>
              <option value="all">Todos</option>
            </select>
            {canDeleteLeads && (
              <Button
                variant="destructive"
                size="sm"
                onClick={model.askArchiveAll}
                disabled={model.archiving === "all" || model.visibility !== "active"}
              >
                {model.archiving === "all" ? "Arquivando..." : "Arquivar leads ativos"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {model.loading || loadingCourses ? (
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          ) : courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Cadastre um curso para visualizar os leads correspondentes.
            </p>
          ) : (
            <>
              <Tabs defaultValue={courses[0]?.id}>
                <TabsList className="mb-4 grid h-auto w-full grid-cols-1 gap-3 rounded-xl bg-secondary/30 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {courses.map((course) => {
                    const count = model.leads.filter((lead) => leadMatchesCourse(lead, course)).length;
                    return (
                      <TabsTrigger
                        key={course.id}
                        value={course.id}
                        className="flex h-full w-full items-start justify-between gap-2 whitespace-normal break-words text-left leading-snug min-h-[64px] text-sm md:text-base px-4 py-3 rounded-lg border border-border/60 bg-card/60 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10"
                      >
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
                  const courseLeads = model.leads.filter((lead) => leadMatchesCourse(lead, course));
                  return (
                    <TabsContent key={course.id} value={course.id}>
                      {canDeleteLeads && (
                        <div className="flex justify-end mb-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => model.askArchiveCourse(course.id, course.name)}
                            disabled={model.archiving === course.id || model.visibility !== "active"}
                          >
                            {model.archiving === course.id ? "Arquivando..." : "Arquivar leads deste curso"}
                          </Button>
                        </div>
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
                                <TableHead>Status</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Dúvidas</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {courseLeads.map((lead) => (
                                <TableRow key={lead.id}>
                                  <TableCell className="font-medium">{lead.name}</TableCell>
                                  <TableCell>{lead.email}</TableCell>
                                  <TableCell>{lead.phone || "Não informado"}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                      {leadSourceLabel(lead.source)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{new Date(lead.submittedAt).toLocaleString("pt-BR")}</TableCell>
                                  <TableCell>
                                    {canDeleteLeads && lead.deletedAt ? (
                                      <Badge variant="outline">Arquivado</Badge>
                                    ) : (
                                      <Badge variant="secondary">Ativo</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {lead.deletedAt ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void model.restoreLead(lead)}
                                        disabled={model.restoringLeadId === lead.id}
                                      >
                                        {model.restoringLeadId === lead.id ? "Restaurando..." : "Restaurar"}
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
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
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {model.meta.total} lead{model.meta.total === 1 ? "" : "s"} encontrados
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={model.meta.page <= 1 || model.loading}
                    onClick={model.previousPage}
                  >
                    Anterior
                  </Button>
                  <span>
                    Pagina {model.meta.page} de {model.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={model.meta.page >= model.meta.totalPages || model.loading}
                    onClick={model.nextPage}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <ArchiveLeadsDialog
        archive={model.pendingArchive}
        onCancel={model.cancelArchive}
        onConfirm={() => void model.confirmArchive()}
      />
    </>
  );
};
