import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchiveLeadsDialog, DeleteCourseDialog } from "./AdminConfirmDialogs";

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? <div>{children}</div> : null),
  AlertDialogAction: (props: ComponentProps<"button">) => <button {...props} />,
  AlertDialogCancel: (props: ComponentProps<"button">) => <button {...props} />,
  AlertDialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const roots: Array<ReturnType<typeof createRoot>> = [];

const render = (node: ReactNode) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(node));
  return container;
};

afterEach(() => roots.splice(0).forEach((root) => act(() => root.unmount())));

describe("admin confirmation dialogs", () => {
  it("confirma e cancela a exclusão de curso pelos callbacks corretos", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const container = render(
      <DeleteCourseDialog
        course={{ id: "curso-a", name: "Curso A" }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const buttons = container.querySelectorAll("button");

    act(() => buttons[0]?.click());
    act(() => buttons[1]?.click());

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("mantém o curso selecionado na confirmação de arquivamento", () => {
    const onConfirm = vi.fn();
    const container = render(
      <ArchiveLeadsDialog
        archive={{ scope: "course", courseId: "curso-a", courseName: "Curso A" }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(container.textContent).toContain('"Curso A"');
    act(() => container.querySelectorAll("button")[1]?.click());
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
