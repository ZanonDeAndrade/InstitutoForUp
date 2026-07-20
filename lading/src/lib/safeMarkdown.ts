import DOMPurify from "dompurify";
import { marked } from "marked";

const ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const ALLOWED_ATTR = ["href", "rel", "target", "title"];

const FORBID_TAGS = [
  "embed",
  "form",
  "iframe",
  "img",
  "input",
  "link",
  "math",
  "meta",
  "object",
  "script",
  "style",
  "svg",
];

const escapeRawHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const isExternalHttpUrl = (href: string) => {
  try {
    const base = window.location.origin;
    const url = new URL(href, base);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin !== base;
  } catch {
    return false;
  }
};

const hardenLinks = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (!isExternalHttpUrl(href)) return;
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  });

  return template.innerHTML;
};

export const renderSafeMarkdown = (markdown: string) => {
  const escapedMarkdown = escapeRawHtml(markdown);
  const html = marked.parse(escapedMarkdown, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string;

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/)|#)/i,
    FORBID_ATTR: ["style"],
    FORBID_TAGS,
  });

  return hardenLinks(sanitized);
};

export const getSafeImageUrl = (value?: string | null, options?: { allowBlob?: boolean }) => {
  if (!value) return null;

  try {
    const url = new URL(value, window.location.origin);
    const protocol = url.protocol.toLowerCase();
    if (protocol === "blob:" && options?.allowBlob) {
      return value;
    }
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }
    if (url.pathname.toLowerCase().endsWith(".svg")) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};
