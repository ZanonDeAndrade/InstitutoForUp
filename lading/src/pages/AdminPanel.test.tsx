import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminSessionContext } from "@/lib/adminSessionContext";
import { ADMIN_PERMISSIONS, type AdminSessionUser } from "@/lib/adminPermissions";
import AdminPanel from "./AdminPanel";

vi.mock("@/components/CourseLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/features/admin/courses/useAdminCourses", () => ({
  useAdminCourses: () => ({ courses: [], loading: false }),
}));
vi.mock("@/features/admin/courses/CourseManagement", () => ({
  CourseManagement: () => <section data-testid="courses">Cursos</section>,
}));
vi.mock("@/features/admin/leads/LeadsManagement", () => ({
  LeadsManagement: () => <section data-testid="leads">Leads</section>,
}));
vi.mock("@/features/admin/navigation/AdminPanelHeader", () => ({
  AdminPanelHeader: ({ canPublishNews }: { canPublishNews: boolean }) => (
    <header data-testid="header" data-can-publish-news={String(canPublishNews)} />
  ),
}));

const roots: Array<ReturnType<typeof createRoot>> = [];

const renderPanel = (user: AdminSessionUser) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <AdminSessionContext.Provider value={user}>
        <AdminPanel />
      </AdminSessionContext.Provider>,
    );
  });
  return container;
};

afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()));
});

describe("AdminPanel permissions", () => {
  it("renderiza apenas o domínio de leads para um visualizador", () => {
    const container = renderPanel({
      id: "viewer-1",
      username: "viewer",
      role: "viewer",
      permissions: [ADMIN_PERMISSIONS.VIEW_LEADS],
    });

    expect(container.querySelector('[data-testid="leads"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="courses"]')).toBeNull();
    expect(container.querySelector('[data-testid="header"]')?.getAttribute("data-can-publish-news")).toBe("false");
  });

  it("mantém cursos, leads e notícias disponíveis para quem possui as permissões", () => {
    const container = renderPanel({
      id: "admin-1",
      username: "admin",
      role: "super_admin",
      permissions: [
        ADMIN_PERMISSIONS.VIEW_LEADS,
        ADMIN_PERMISSIONS.DELETE_LEADS,
        ADMIN_PERMISSIONS.MANAGE_COURSES,
        ADMIN_PERMISSIONS.MANAGE_IMAGES,
        ADMIN_PERMISSIONS.PUBLISH_NEWS,
      ],
    });

    expect(container.querySelector('[data-testid="leads"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="courses"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="header"]')?.getAttribute("data-can-publish-news")).toBe("true");
  });
});
