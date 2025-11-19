import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import CourseForm from "@/components/CourseForm";

interface CourseFieldsConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  source: boolean;
}

interface CourseConfig {
  id: string;
  name: string;
  description: string;
  fields: CourseFieldsConfig;
}

const COURSES_STORAGE_KEY = "forup_courses";

const DynamicCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(COURSES_STORAGE_KEY) : null;
      const parsed: CourseConfig[] = stored ? JSON.parse(stored) : [];
      const found = parsed.find((item) => item.id === courseId);
      if (found) {
        setCourse(found);
      }
    } catch (error) {
      console.error("Erro ao carregar curso dinâmico", error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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

          {course.description && (
            <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                {course.description}
              </p>
            </div>
          )}

          <div className="animate-slide-up">
            <CourseForm courseName={course.name} fields={course.fields} />
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default DynamicCourse;

