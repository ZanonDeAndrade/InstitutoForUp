import { Navigate, Route, Routes } from "react-router-dom";
import AdminPanel from "@/pages/AdminPanel";
import AdminLogin from "@/pages/AdminLogin";
import NewsCreate from "@/pages/NewsCreate";
import NewsEdit from "@/pages/NewsEdit";
import NewsList from "@/pages/NewsList";
import RequireAdmin from "@/components/RequireAdmin";

const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route
      path="news"
      element={
        <RequireAdmin>
          <NewsList />
        </RequireAdmin>
      }
    />
    <Route
      path="news/create"
      element={
        <RequireAdmin>
          <NewsCreate />
        </RequireAdmin>
      }
    />
    <Route
      path="news/:slug/edit"
      element={
        <RequireAdmin>
          <NewsEdit />
        </RequireAdmin>
      }
    />
    <Route
      index
      element={
        <RequireAdmin>
          <AdminPanel />
        </RequireAdmin>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AdminRoutes;
