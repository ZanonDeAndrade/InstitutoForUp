import { act, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCourseApi } from "@/services/adminCourseApi";
import { adminLeadApi, leadDeleteConfirmations } from "@/services/adminLeadApi";
import { PILLARS } from "@/constants/pillars";
import { defaultCourseFields } from "./courses/courseDomain";
import { useAdminCourses } from "./courses/useAdminCourses";
import { useAdminLeads } from "./leads/useAdminLeads";

vi.mock("@/services/adminCourseApi", () => ({
  adminCourseApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    uploadImages: vi.fn(),
  },
}));

vi.mock("@/services/adminLeadApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/adminLeadApi")>();
  return {
    ...original,
    adminLeadApi: { list: vi.fn(), softDelete: vi.fn(), restore: vi.fn(), purge: vi.fn() },
  };
});

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

interface HookHandle<T> {
  get current(): T;
  unmount: () => void;
}

const renderHook = async <T,>(useHook: () => T): Promise<HookHandle<T>> => {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let value: T | undefined;

  const Probe = () => {
    const nextValue = useHook();
    useLayoutEffect(() => {
      value = nextValue;
    });
    return null;
  };

  await act(async () => {
    root.render(<Probe />);
  });

  return {
    get current() {
      if (!value) throw new Error("Hook ainda não foi renderizado");
      return value;
    },
    unmount: () => root.unmount(),
  };
};

const emptyLeadPage = { items: [], page: 1, pageSize: 50, total: 0, totalPages: 1 };

describe("admin domain hooks", () => {
  const mounted: Array<HookHandle<unknown>> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminCourseApi.list).mockResolvedValue([]);
    vi.mocked(adminLeadApi.list).mockResolvedValue(emptyLeadPage);
  });

  afterEach(() => {
    mounted.splice(0).forEach((hook) => {
      act(() => hook.unmount());
    });
  });

  it("cadastra curso, envia imagens e atualiza a lista em uma única mutação", async () => {
    vi.mocked(adminCourseApi.create).mockResolvedValue({ id: "lideranca", name: "Liderança", pillar: PILLARS[0].id });
    vi.mocked(adminCourseApi.uploadImages).mockResolvedValue([{ id: "image-1", url: "/image.webp" }]);
    const hook = await renderHook(() => useAdminCourses(true));
    mounted.push(hook);
    const file = new File(["image"], "image.webp", { type: "image/webp" });

    let saved = false;
    await act(async () => {
      saved = await hook.current.saveCourse({
        editingCourseId: null,
        name: " Liderança ",
        description: " Curso ",
        pillar: PILLARS[0].id,
        fields: defaultCourseFields,
        files: [file],
      });
    });

    expect(saved).toBe(true);
    expect(adminCourseApi.create).toHaveBeenCalledWith(expect.objectContaining({ id: "lideranca", name: "Liderança" }));
    expect(adminCourseApi.uploadImages).toHaveBeenCalledWith("lideranca", [file]);
    expect(hook.current.courses[0]?.images).toEqual([{ id: "image-1", url: "/image.webp" }]);
  });

  it("mantém a permissão dentro da mutação de curso", async () => {
    const hook = await renderHook(() => useAdminCourses(false));
    mounted.push(hook);

    await act(async () => {
      await hook.current.saveCourse({
        editingCourseId: null,
        name: "Curso",
        description: "",
        pillar: PILLARS[0].id,
        fields: defaultCourseFields,
        files: [],
      });
    });

    expect(adminCourseApi.create).not.toHaveBeenCalled();
  });

  it("arquiva leads por curso com confirmação e recarrega a busca", async () => {
    vi.mocked(adminLeadApi.softDelete).mockResolvedValue({ deleted: 2 });
    const hook = await renderHook(() => useAdminLeads(true, true));
    mounted.push(hook);

    act(() => hook.current.askArchiveCourse("curso-a", "Curso A"));
    await act(async () => {
      await hook.current.confirmArchive();
    });

    expect(adminLeadApi.softDelete).toHaveBeenCalledWith({
      scope: "course",
      courseId: "curso-a",
      courseName: "Curso A",
      reason: "Arquivamento administrativo do curso Curso A",
      confirmation: leadDeleteConfirmations.course,
    });
    expect(adminLeadApi.list).toHaveBeenCalledTimes(2);
    expect(hook.current.pendingArchive).toBeNull();
  });
});
