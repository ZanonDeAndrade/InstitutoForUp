import { describe, expect, it } from "vitest";
import { safeAdminRedirectPath } from "./navigation";

describe("safeAdminRedirectPath", () => {
  it("keeps local absolute paths", () => {
    expect(safeAdminRedirectPath("/admin/news")).toBe("/admin/news");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeAdminRedirectPath("https://evil.example/admin")).toBe("/");
    expect(safeAdminRedirectPath("//evil.example/admin")).toBe("/");
  });

  it("rejects protocol-like and control-character input", () => {
    expect(safeAdminRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeAdminRedirectPath("/admin\nhttps://evil.example")).toBe("/");
  });
});
