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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
