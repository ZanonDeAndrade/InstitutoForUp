import { strict as assert } from "node:assert";
import test from "node:test";
import { courseContentSchema } from "../dtos/courseContentDto";

test("course content DTO accepts structured editorial data", () => {
  const result = courseContentSchema.safeParse({
    version: 1,
    seo: { title: "Curso" },
    sections: [{ id: "intro", type: "text", paragraphs: ["Conteudo editorial"], align: "center" }],
    images: [{ id: "cover", src: "/api/images/course/cover", alt: "Capa" }],
    cta: { type: "form" },
    form: { fields: { name: true, email: true, phone: true, source: true } },
  });

  assert.equal(result.success, true);
});

test("course content DTO rejects HTML and unsafe CTA URLs", () => {
  const html = courseContentSchema.safeParse({
    version: 1,
    sections: [{ id: "intro", type: "text", paragraphs: ["<img src=x onerror=alert(1)>"] }],
    cta: { type: "form" },
  });
  const unsafeUrl = courseContentSchema.safeParse({
    version: 1,
    sections: [],
    cta: { type: "external", label: "Abrir", url: "javascript:alert(1)" },
  });

  assert.equal(html.success, false);
  assert.equal(unsafeUrl.success, false);
});
