import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8f5] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[960px]">
          <Link
            href="/"
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-[#52766b] transition hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to ChronicleFiles
          </Link>
          <section
            aria-labelledby="admin-login-title"
            className="grid overflow-hidden rounded-xl border border-[#dce9e1] bg-[#FEFEFE] shadow-[0_24px_70px_rgba(36,72,54,.12)] md:grid-cols-[.9fr_1.1fr]"
          >
            <div className="relative flex min-h-56 flex-col justify-between overflow-hidden bg-[#174d3a] p-7 text-white sm:p-10 md:min-h-[540px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border border-white/10 shadow-[0_0_0_28px_rgba(255,255,255,.035),0_0_0_58px_rgba(255,255,255,.025)]"
              />
              <div className="relative">
                <Link
                  href="/"
                  className="rounded-sm text-[25px] font-black tracking-[-1.4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9de5bd]"
                >
                  Chronicle<span className="text-[#65d495]">Files</span>
                </Link>
                <p className="mt-1 text-xs font-medium tracking-[.08em] text-white/65">
                  STORIES · IDEAS · KNOWLEDGE
                </p>
              </div>
              <div className="relative mt-10 md:mt-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#8fe0b1]">
                  ChronicleFiles Admin
                </p>
                <h1
                  id="admin-login-title"
                  className="mt-3 max-w-sm font-serif text-3xl font-bold leading-tight tracking-[-.03em] sm:text-4xl"
                >
                  Your publication, thoughtfully managed.
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
                  Sign in to create stories, manage categories, and shape what
                  readers discover.
                </p>
              </div>
              <p className="relative mt-8 flex items-center gap-2 text-xs font-medium text-white/65 md:mt-0">
                <LockKeyhole
                  aria-hidden="true"
                  className="size-4 text-[#8fe0b1]"
                />
                Secure administrator access
              </p>
            </div>

            <div className="flex items-center p-6 sm:p-10 md:p-12">
              <div className="mx-auto w-full max-w-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#02A95C]">
                  Administration
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-.03em] text-[#303a34] sm:text-[34px]">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6d7971]">
                  Sign in to continue to your ChronicleFiles dashboard.
                </p>
                <div className="mt-8">
                  <LoginForm />
                </div>
                <p className="mt-7 border-t border-[#e8eee9] pt-5 text-xs leading-5 text-[#87918b]">
                  Authorized administrators only. Your session is protected
                  with a secure sign-in.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <AdminDashboard username={session.username} logoutAction={logoutAction} />
  );
}
