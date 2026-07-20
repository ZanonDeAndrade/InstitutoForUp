import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminLeadApi, leadDeleteConfirmations, type LeadVisibility } from "@/services/adminLeadApi";
import type { Lead } from "@/types/lead";

export type PendingLeadArchive =
  | { scope: "all" }
  | { scope: "course"; courseId: string; courseName: string };

const initialMeta = { page: 1, pageSize: 50, total: 0, totalPages: 1 };

export const useAdminLeads = (canViewLeads: boolean, canDeleteLeads: boolean) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState(initialMeta);
  const [visibility, setVisibilityState] = useState<LeadVisibility>("active");
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState<"all" | string | null>(null);
  const [restoringLeadId, setRestoringLeadId] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<PendingLeadArchive | null>(null);

  const loadLeads = useCallback(async () => {
    if (!canViewLeads) {
      setLeads([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const remote = await adminLeadApi.list({ page: meta.page, pageSize: meta.pageSize, visibility });
      setLeads(remote.items);
      setMeta({
        page: remote.page,
        pageSize: remote.pageSize,
        total: remote.total,
        totalPages: remote.totalPages,
      });
    } catch (error) {
      console.error("Erro ao carregar leads", error);
      toast.error("Não foi possível carregar os leads.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [canViewLeads, meta.page, meta.pageSize, visibility]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const setVisibility = (next: LeadVisibility) => {
    setVisibilityState(next);
    setMeta((current) => ({ ...current, page: 1 }));
  };

  const askArchiveAll = () => {
    if (canDeleteLeads) setPendingArchive({ scope: "all" });
  };

  const askArchiveCourse = (courseId: string, courseName: string) => {
    if (canDeleteLeads) setPendingArchive({ scope: "course", courseId, courseName });
  };

  const confirmArchive = async () => {
    if (!pendingArchive) return;
    if (!canDeleteLeads) {
      toast.error("Acesso negado.");
      return;
    }

    const archive = pendingArchive;
    setArchiving(archive.scope === "all" ? "all" : archive.courseId);
    try {
      if (archive.scope === "all") {
        await adminLeadApi.softDelete({
          scope: "all",
          reason: "Arquivamento administrativo em lote",
          confirmation: leadDeleteConfirmations.all,
        });
        await loadLeads();
        toast.success("Leads arquivados.");
      } else {
        await adminLeadApi.softDelete({
          scope: "course",
          courseId: archive.courseId,
          courseName: archive.courseName,
          reason: `Arquivamento administrativo do curso ${archive.courseName}`,
          confirmation: leadDeleteConfirmations.course,
        });
        await loadLeads();
        toast.success(`Leads do curso "${archive.courseName}" foram arquivados.`);
      }
    } catch (error) {
      console.error("Erro ao arquivar leads", error);
      toast.error(
        archive.scope === "all"
          ? "Não foi possível limpar os leads."
          : "Não foi possível limpar os leads deste curso.",
      );
    } finally {
      setArchiving(null);
      setPendingArchive(null);
    }
  };

  const restoreLead = async (lead: Lead) => {
    if (!canDeleteLeads) {
      toast.error("Acesso negado.");
      return;
    }
    setRestoringLeadId(lead.id);
    try {
      await adminLeadApi.restore({
        leadIds: [lead.id],
        reason: "Restauracao administrativa",
        confirmation: leadDeleteConfirmations.restore,
      });
      await loadLeads();
      toast.success("Lead restaurado.");
    } catch (error) {
      console.error("Erro ao restaurar lead", error);
      toast.error("Nao foi possivel restaurar o lead.");
    } finally {
      setRestoringLeadId(null);
    }
  };

  const previousPage = () => setMeta((current) => ({ ...current, page: Math.max(1, current.page - 1) }));
  const nextPage = () => setMeta((current) => ({ ...current, page: Math.min(current.totalPages, current.page + 1) }));

  return {
    leads,
    meta,
    visibility,
    loading,
    archiving,
    restoringLeadId,
    pendingArchive,
    setVisibility,
    askArchiveAll,
    askArchiveCourse,
    cancelArchive: () => setPendingArchive(null),
    confirmArchive,
    restoreLead,
    previousPage,
    nextPage,
  };
};

export type AdminLeadsModel = ReturnType<typeof useAdminLeads>;
