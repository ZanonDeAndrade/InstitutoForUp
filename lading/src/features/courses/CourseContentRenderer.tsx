import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CourseForm from "@/components/CourseForm";
import type { Course } from "@/types/course";
import type { CourseContent, CourseSection } from "@/types/courseContent";

const CourseSectionView = ({ section }: { section: CourseSection }) => {
  if (section.type === "details") {
    return (
      <div className="space-y-3 text-left">
        <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed text-justify">{section.heading}</p>
        {section.items.map((item) => (
          <p key={`${section.id}-${item.title}`} className="text-lg md:text-xl text-muted-foreground leading-relaxed text-justify">
            <span className="font-semibold text-foreground">{item.title}</span> {item.text}
          </p>
        ))}
      </div>
    );
  }

  const textAlignment = section.align === "left" ? "text-left" : "text-center";
  return (
    <div className={`space-y-3 ${section.heading ? "text-left" : textAlignment}`}>
      {section.heading && (
        <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed text-justify">{section.heading}</p>
      )}
      {section.paragraphs.map((paragraph, index) => (
        <p
          key={`${section.id}-paragraph-${index}`}
          className={`text-lg md:text-xl text-muted-foreground leading-relaxed text-justify whitespace-pre-line ${textAlignment}`}
        >
          {paragraph}
        </p>
      ))}
      {!!section.bullets?.length && (
        <ul className="text-lg md:text-xl text-muted-foreground leading-relaxed text-left text-justify space-y-2 list-disc list-inside">
          {section.bullets.map((bullet, index) => <li key={`${section.id}-bullet-${index}`}>{bullet}</li>)}
        </ul>
      )}
    </div>
  );
};

export const CourseContentSections = ({ sections, children }: { sections: CourseSection[]; children?: ReactNode }) => (
  <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay space-y-4">
    {sections.map((section) => <CourseSectionView key={section.id} section={section} />)}
    {children}
  </div>
);

interface CourseContentRendererProps {
  course: Course;
  content: CourseContent;
}

export const CourseContentRenderer = ({ course, content }: CourseContentRendererProps) => {
  const [expanded, setExpanded] = useState(false);
  const externalCta = content.cta.type === "external" ? content.cta : null;
  const visibleSections = !expanded && externalCta?.collapsedSections?.length
    ? externalCta.collapsedSections
    : content.sections;

  useEffect(() => setExpanded(false), [course.id]);

  return (
    <>
      {visibleSections.length > 0 && (
        <CourseContentSections sections={visibleSections}>
          {externalCta?.collapsedSections?.length && (
            <div className="mt-2 text-center">
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:text-primary/80 underline"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? "Ver menos" : "Ver mais"}
              </button>
            </div>
          )}
        </CourseContentSections>
      )}
      {externalCta ? (
        <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
          <Button asChild variant="hero" size="lg" className="text-lg px-10 py-6 h-auto">
            <a href={externalCta.url} target="_blank" rel="noopener noreferrer">
              {externalCta.label}
            </a>
          </Button>
          {externalCta.helperText && <p className="text-sm text-muted-foreground">{externalCta.helperText}</p>}
        </div>
      ) : (
        <div className="animate-slide-up mt-10">
          <CourseForm
            courseId={course.id}
            courseName={course.name}
            fields={content.form?.fields ?? course.fields}
          />
        </div>
      )}
    </>
  );
};
