import { describe, expect, it } from "vitest";
import { getSafeImageUrl, renderSafeMarkdown } from "./safeMarkdown";

const toTemplate = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
};

describe("renderSafeMarkdown", () => {
  it("renders legitimate Markdown content", () => {
    const html = renderSafeMarkdown(
      [
        "## Titulo",
        "",
        "Texto com **negrito**, _italico_ e [link externo](https://example.org/path).",
        "",
        "- item um",
        "- item dois",
      ].join("\n"),
    );

    expect(html).toContain("<h2>Titulo</h2>");
    expect(html).toContain("<strong>negrito</strong>");
    expect(html).toContain("<em>italico</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain('href="https://example.org/path"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does not allow executable raw HTML", () => {
    const html = renderSafeMarkdown(
      '<script>alert(1)</script><img src=x onerror=alert(1)><button onclick="alert(1)">x</button>',
    );
    const template = toTemplate(html);

    expect(template.content.querySelector("script")).toBeNull();
    expect(template.content.querySelector("img")).toBeNull();
    expect(template.content.querySelector("button")).toBeNull();
    expect(template.content.querySelector("[onerror]")).toBeNull();
    expect(template.content.querySelector("[onclick]")).toBeNull();
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });

  it("removes dangerous Markdown link protocols", () => {
    const html = renderSafeMarkdown(
      [
        "[javascript](javascript:alert(1))",
        "[data](data:text/html,<script>alert(1)</script>)",
        "[safe](/news/post)",
      ].join("\n"),
    );

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain('href="/news/post"');
  });

  it("blocks svg, iframe and style based payloads", () => {
    const html = renderSafeMarkdown(
      [
        '<svg><script>alert(1)</script></svg>',
        '<iframe src="https://evil.test"></iframe>',
        '<p style="background-image:url(javascript:alert(1))">x</p>',
      ].join("\n"),
    );
    const template = toTemplate(html);

    expect(template.content.querySelector("svg")).toBeNull();
    expect(template.content.querySelector("iframe")).toBeNull();
    expect(template.content.querySelector("[style]")).toBeNull();
  });
});

describe("getSafeImageUrl", () => {
  it("allows http, https and relative image URLs", () => {
    expect(getSafeImageUrl("https://cdn.example.org/news.png")).toBe("https://cdn.example.org/news.png");
    expect(getSafeImageUrl("/api/images/news/photo.jpg")).toBe("/api/images/news/photo.jpg");
  });

  it("blocks dangerous image URL schemes and svg", () => {
    expect(getSafeImageUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeImageUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
    expect(getSafeImageUrl("https://cdn.example.org/payload.svg")).toBeNull();
  });
});
