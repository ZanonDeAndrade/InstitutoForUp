import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DynamicCourse from "./pages/DynamicCourse";
import NewsPage from "./pages/NewsPage";
import NewsDetails from "./pages/NewsDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/criterios-valores" element={<Navigate to="/curso/criterios-valores" replace />} />
          <Route path="/performando-liderancas" element={<Navigate to="/curso/performando-liderancas" replace />} />
          <Route path="/jovens-lideres" element={<Navigate to="/curso/jovens-lideres" replace />} />
          <Route path="/valores-humanos" element={<Navigate to="/curso/valores-humanos" replace />} />
          <Route path="/cafe-cultural" element={<Navigate to="/curso/cafe-cultural" replace />} />
          <Route path="/curso/:courseId" element={<DynamicCourse />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
