import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface CourseLayoutProps {
  children: ReactNode;
  minimalHeader?: boolean;
}

const CourseLayout = ({ children, minimalHeader = false }: CourseLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header minimal={minimalHeader} />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default CourseLayout;
