import CourseLayout from "@/components/CourseLayout";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/lib/adminPermissions";
import { useAdminSession } from "@/lib/adminSessionContext";
import { CourseManagement } from "@/features/admin/courses/CourseManagement";
import { useAdminCourses } from "@/features/admin/courses/useAdminCourses";
import { LeadsManagement } from "@/features/admin/leads/LeadsManagement";
import { AdminPanelHeader } from "@/features/admin/navigation/AdminPanelHeader";

const AdminPanel = () => {
  const adminUser = useAdminSession();
  const canViewLeads = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.VIEW_LEADS);
  const canDeleteLeads = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.DELETE_LEADS);
  const canManageCourses = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.MANAGE_COURSES);
  const canManageImages = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.MANAGE_IMAGES);
  const canPublishNews = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.PUBLISH_NEWS);
  const coursesModel = useAdminCourses(canManageCourses);

  return (
    <CourseLayout minimalHeader>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <AdminPanelHeader canPublishNews={canPublishNews} />
          {canManageCourses && <CourseManagement model={coursesModel} canManageImages={canManageImages} />}
          {canViewLeads && (
            <LeadsManagement
              courses={coursesModel.courses}
              loadingCourses={coursesModel.loading}
              canDeleteLeads={canDeleteLeads}
            />
          )}
        </div>
      </div>
    </CourseLayout>
  );
};

export default AdminPanel;
