import CourseLayout from "@/components/CourseLayout";
import CourseForm from "@/components/CourseForm";

const JovensLideres = () => {
  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">
              Jovens Líderes
            </h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8"></div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
              Voltado a jovens que desejam descobrir seu papel no mundo e desenvolver liderança com base em valores humanos e responsabilidade social.
            </p>
          </div>

          {/* Form */}
          <div className="animate-slide-up mt-10">
            <CourseForm courseName="Jovens Líderes" />
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default JovensLideres;
