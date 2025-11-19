import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface CourseLayoutProps {
  children: ReactNode;
}

const CourseLayout = ({ children }: CourseLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default CourseLayout;
