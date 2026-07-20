import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CourseLayout from "@/components/CourseLayout";
import CourseImageCarousel from "@/components/CourseImageCarousel";
import { CourseContentRenderer } from "@/features/courses/CourseContentRenderer";
import { buildLegacyCourseContent } from "@/features/courses/legacyCourseContent";
import { useCourseSeo } from "@/features/courses/useCourseSeo";
import { courseApi } from "@/services/courseApi";
import { parseCourseContent } from "@/types/courseContent";
import type { Course } from "@/types/course";

const CoursePage = ({ course }: { course: Course }) => {
  const content = parseCourseContent(course.content) ?? buildLegacyCourseContent(course);
  const contentImages = content.images?.map((image) => ({ id: image.id, url: image.src, alt: image.alt }));
  const images = contentImages?.length ? contentImages : course.images;
  useCourseSeo(course.name, content);

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">{course.name}</h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8" />
            {content.hero?.quote && (
              <div className="mt-6 bg-secondary/40 border border-border/60 rounded-2xl px-6 py-4 inline-block shadow-card">
                <p className="text-lg md:text-xl text-muted-foreground italic">{content.hero.quote}</p>
              </div>
            )}
          </div>
          {!!images?.length && (
            <div className="mb-10 animate-fade-in-delay">
              <CourseImageCarousel images={images} />
            </div>
          )}
          <CourseContentRenderer course={course} content={content} />
        </div>
      </div>
    </CourseLayout>
  );
};

const useCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const query = useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    retry: 1,
    queryFn: () => courseApi.getById(courseId ?? ""),
  });
  return { course: query.data ?? null, loading: query.isPending };
};

const DynamicCourse = () => {
  const { course, loading } = useCourse();
  if (loading) {
    return <CourseLayout><div className="container mx-auto px-4 py-20"><p className="text-center text-muted-foreground">Carregando curso...</p></div></CourseLayout>;
  }
  if (!course) {
    return <CourseLayout><div className="container mx-auto px-4 py-20"><p className="text-center text-muted-foreground">Curso não encontrado.</p></div></CourseLayout>;
  }
  return <CoursePage course={course} />;
};

export default DynamicCourse;
