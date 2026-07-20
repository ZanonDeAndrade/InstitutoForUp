import { describe, expect, it, vi } from "vitest";
import { defaultCourseFields, isValidCourseImage, normalizeCourse, slugifyCourseName } from "./courseDomain";

describe("courseDomain", () => {
  it("normaliza dados incompletos recebidos da API", () => {
    const course = normalizeCourse({ id: "lideranca", name: "Liderança" });

    expect(course.images).toEqual([]);
    expect(course.fields).toEqual(defaultCourseFields);
    expect(course.pillar).toBeDefined();
  });

  it("gera o mesmo identificador usado no fluxo de cadastro", () => {
    expect(slugifyCourseName("  Liderança & Gestão  ")).toBe("lideranca-gestao");
    vi.spyOn(Date, "now").mockReturnValueOnce(123);
    expect(slugifyCourseName("!!!")).toBe("course-123");
  });

  it("aceita somente imagens suportadas de até 2 MB", () => {
    expect(isValidCourseImage(new File(["image"], "curso.webp", { type: "image/webp" }))).toBe(true);
    expect(isValidCourseImage(new File(["text"], "curso.txt", { type: "text/plain" }))).toBe(false);
    expect(isValidCourseImage(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "curso.png", { type: "image/png" }))).toBe(false);
  });
});
