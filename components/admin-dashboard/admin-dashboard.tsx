import { AdminHeader } from "@/components/admin-dashboard/admin-header";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";
import { ContentActivity } from "@/components/admin-dashboard/content-activity";
import {
  dashboardMetrics,
  KpiCard,
} from "@/components/admin-dashboard/dashboard-components";
import { QuickActions } from "@/components/admin-dashboard/quick-actions";
import { RecentPosts } from "@/components/admin-dashboard/recent-posts";
import type { logoutAction } from "@/app/admin-dashboard/actions";

interface AdminDashboardProps {
  username: string;
  logoutAction: typeof logoutAction;
}

export function AdminDashboard({
  username,
  logoutAction,
}: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-[#444444]">
      <AdminSidebar username={username} />
      <main className="min-w-0 lg:ml-64">
        <AdminHeader username={username} logoutAction={logoutAction} />
        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          <section
            aria-label="Content overview"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            {dashboardMetrics.map((metric) => (
              <KpiCard key={metric.title} {...metric} />
            ))}
          </section>
          <QuickActions />
          <section
            aria-label="Recent content and activity"
            className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3"
          >
            <RecentPosts />
            <ContentActivity />
          </section>
        </div>
      </main>
    </div>
  );
}
