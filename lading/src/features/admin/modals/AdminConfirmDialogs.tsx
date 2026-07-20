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
import type { Course } from "@/types/course";
import type { PendingLeadArchive } from "../leads/useAdminLeads";

interface DeleteCourseDialogProps {
  course: Course | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteCourseDialog = ({ course, onCancel, onConfirm }: DeleteCourseDialogProps) => (
  <AlertDialog open={course !== null} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir curso</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir o curso <span className="font-semibold text-foreground">{course?.name}</span>?
          <br />
          <br />
          Essa ação não pode ser desfeita e o curso deixará de aparecer na página e na listagem de leads.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onConfirm}
        >
          Sim, excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

interface ArchiveLeadsDialogProps {
  archive: PendingLeadArchive | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ArchiveLeadsDialog = ({ archive, onCancel, onConfirm }: ArchiveLeadsDialogProps) => (
  <AlertDialog open={archive !== null} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmação</AlertDialogTitle>
        <AlertDialogDescription>
          {archive?.scope === "all" && (
            <>
              Tem certeza que deseja remover todos os leads cadastrados?
              <br />
              Esta ação remove os registros do backend e não pode ser desfeita.
            </>
          )}
          {archive?.scope === "course" && (
            <>
              Tem certeza que deseja remover os leads do curso{" "}
              <span className="font-semibold text-foreground">"{archive.courseName}"</span>?
              <br />
              Esta ação remove os registros do backend e não pode ser desfeita.
            </>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
          Sim, remover
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
