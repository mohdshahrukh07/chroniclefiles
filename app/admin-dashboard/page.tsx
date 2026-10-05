import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/admin-session";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin dashboard | ChronicleFiles",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
        <section
          aria-labelledby="admin-login-title"
          className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.12em] text-primary"
          >
            CHRONICLEFILES
          </Link>
          <p className="mt-8 text-sm font-medium text-muted-foreground">
            ADMINISTRATION
          </p>
          <h1
            id="admin-login-title"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in to continue to the ChronicleFiles dashboard.
          </p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </section>
      </main>
    );
  }

  return (
    <AdminDashboard username={session.username} logoutAction={logoutAction} />
  );
}
