import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CourseLayout from "@/components/CourseLayout";
import CourseForm from "@/components/CourseForm";
import CourseImageCarousel from "@/components/CourseImageCarousel";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";

const COURSES_STORAGE_KEY = "forup_courses";
const fallbackFields = { name: true, email: true, phone: true, source: true };

const DynamicCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [fallbackCourse, setFallbackCourse] = useState<Course | null>(null);

  const {
    data: remoteCourse,
    isPending,
  } = useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    retry: 1,
    queryFn: () => courseApi.getById(courseId ?? ""),
  });

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(COURSES_STORAGE_KEY) : null;
      const parsed: Course[] = stored ? JSON.parse(stored) : [];
      const found = parsed.find((item) => item.id === courseId);
      if (found) {
        setFallbackCourse(found);
      }
    } catch (error) {
      console.error("Erro ao carregar curso dinâmico", error);
    }
  }, [courseId]);

  const course = remoteCourse ?? fallbackCourse;
  const loading = isPending && !course;
  useEffect(() => {
    if (course) {
      const fixedImages = course.images?.map((img) => ({
        ...img,
        url: img.url?.replace("/courses/courses/", "/courses/"),
      }));
      // eslint-disable-next-line no-console
      console.log("[dynamic-course] loaded", {
        id: course.id,
        images: fixedImages?.map((img) => img.url),
      });
    } else {
      console.log("[dynamic-course] no course found");
    }
  }, [course]);

  if (loading) {
    return (
      <CourseLayout>
        <div className="container mx-auto px-4 py-20">
          <p className="text-center text-muted-foreground">Carregando curso...</p>
        </div>
      </CourseLayout>
    );
  }

  if (!course) {
    return (
      <CourseLayout>
        <div className="container mx-auto px-4 py-20">
          <p className="text-center text-muted-foreground">Curso não encontrado.</p>
        </div>
      </CourseLayout>
    );
  }

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">
              {course.name}
            </h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8" />
          </div>

          {course.images && course.images.length > 0 && (
            <div className="mb-10 animate-fade-in-delay">
              <CourseImageCarousel images={course.images} />
            </div>
          )}

          {course.description && (
            <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                {course.description}
              </p>
            </div>
          )}

          <div className="animate-slide-up">
            <CourseForm courseName={course.name} fields={course.fields ?? fallbackFields} />
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default DynamicCourse;
