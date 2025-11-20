import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CriteriosValores from "./pages/CriteriosValores";
import PerformandoLiderancas from "./pages/PerformandoLiderancas";
import JovensLideres from "./pages/JovensLideres";
import CriatividadeEmpresarial from "./pages/CriatividadeEmpresarial";
import CafeCultural from "./pages/CafeCultural";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import DynamicCourse from "./pages/DynamicCourse";
import NewsPage from "./pages/NewsPage";
import NewsDetails from "./pages/NewsDetails";
import NewsList from "./pages/NewsList";
import NewsCreate from "./pages/NewsCreate";
import NewsEdit from "./pages/NewsEdit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/criterios-valores" element={<CriteriosValores />} />
          <Route path="/performando-liderancas" element={<PerformandoLiderancas />} />
          <Route path="/jovens-lideres" element={<JovensLideres />} />
          <Route path="/criatividade-empresarial" element={<CriatividadeEmpresarial />} />
          <Route path="/cafe-cultural" element={<CafeCultural />} />
          <Route path="/curso/:courseId" element={<DynamicCourse />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetails />} />
          <Route path="/admin/news" element={<NewsList />} />
          <Route path="/admin/news/create" element={<NewsCreate />} />
          <Route path="/admin/news/:slug/edit" element={<NewsEdit />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
