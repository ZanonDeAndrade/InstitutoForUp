import { describe, expect, it } from "vitest";
import { buildLegacyCourseContent } from "./legacyCourseContent";
import { parseCourseContent } from "@/types/courseContent";

describe("course structured content", () => {
  it("aceita o schema completo com seções, imagens, CTA e formulário", () => {
    const content = parseCourseContent({
      version: 1,
      seo: { title: "Curso", description: "Descrição segura", image: "/images/course.webp" },
      hero: { quote: "Uma citação" },
      sections: [
        { id: "intro", type: "text", heading: "Introdução", paragraphs: ["Texto"], bullets: ["Item"] },
        { id: "facts", type: "details", heading: "Detalhes", items: [{ title: "Formato", text: "Online" }] },
      ],
      images: [{ id: "cover", src: "https://example.com/course.webp", alt: "Capa" }],
      cta: { type: "form", label: "Tenho interesse" },
      form: { fields: { name: true, email: true, phone: false, source: true } },
      specific: { edition: "2026", featured: true },
    });

    expect(content?.sections).toHaveLength(2);
    expect(content?.form?.fields.phone).toBe(false);
  });

  it("recusa HTML arbitrário e protocolos inseguros", () => {
    expect(parseCourseContent({
      version: 1,
      sections: [{ id: "x", type: "text", paragraphs: ["<script>alert(1)</script>"] }],
      cta: { type: "form" },
    })).toBeNull();
    expect(parseCourseContent({
      version: 1,
      sections: [],
      cta: { type: "external", label: "Abrir", url: "javascript:alert(1)" },
    })).toBeNull();
  });

  it("mantém o CTA expansível do Café Cultural no fallback legado", () => {
    const content = buildLegacyCourseContent({ id: "cafe-cultural", name: "Café Cultural" });

    expect(content.cta.type).toBe("external");
    if (content.cta.type === "external") {
      expect(content.cta.url).toMatch(/^https:\/\/chat\.whatsapp\.com\//);
      expect(content.cta.collapsedSections).not.toHaveLength(0);
    }
    expect(content.sections.length).toBeGreaterThan(1);
  });

  it("converte descrição e citação antigas sem depender do novo campo", () => {
    const content = buildLegacyCourseContent({
      id: "valores-humanos",
      name: "Valores Humanos",
      description: "Introdução\n\nPropósito do Programa\nTexto do propósito",
      fields: { name: true, email: true, phone: true, source: true },
    });

    expect(content.hero?.quote).toContain("valores intangíveis");
    expect(content.sections[1]).toMatchObject({ type: "text", heading: "Propósito do Programa", align: "left" });
    expect(content.cta.type).toBe("form");
  });
});
