import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomepageManagement } from "@/components/admin-homepage/homepage-management";
import { getAdminSession } from "@/lib/admin-session";
import { getHomepageManagementData } from "@/lib/homepage";
import { logoutAction } from "@/app/admin-dashboard/actions";

export const metadata: Metadata = {
  title: "Homepage Management | ChronicleFiles",
  robots: { index: false, follow: false },
};

export default async function HomepageManagementPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  let initialData;
  let loadError: string | undefined;
  try {
    initialData = await getHomepageManagementData();
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Homepage settings could not be loaded (${errorName}).`);
    loadError =
      "Homepage settings could not be loaded. Check the database connection and try again.";
  }

  return (
    <HomepageManagement
      username={session.username}
      logoutAction={logoutAction}
      initialData={initialData}
      loadError={loadError}
    />
  );
}
