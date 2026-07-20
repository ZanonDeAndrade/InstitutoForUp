import { useEffect } from "react";
import type { CourseContent } from "@/types/courseContent";

const setMeta = (selector: string, attribute: "name" | "property", key: string, content?: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

export const useCourseSeo = (courseName: string, content: CourseContent) => {
  useEffect(() => {
    const title = content.seo?.title ?? courseName;
    const description = content.seo?.description;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:image"]', "property", "og:image", content.seo?.image);
  }, [content, courseName]);
};
