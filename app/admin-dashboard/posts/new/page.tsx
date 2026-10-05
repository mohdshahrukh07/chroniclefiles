import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Category from "@/models/category";
import { PostEditorForm } from "@/components/admin-posts/post-editor-form";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Create Post | ChronicleFiles",
  robots: { index: false, follow: false },
};

export default async function CreatePostPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin-dashboard");
  }

  let categories: { id: string; name: string }[] = [];
  let categoryLoadError: string | undefined;
  try {
    await connectToDatabase();
    const documents = await Category.find({})
      .select({ name: 1 })
      .sort({ name: 1 })
      .lean()
      .exec();
    categories = documents.map((category) => ({
      id: category._id.toString(),
      name: category.name,
    }));
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage =
      error instanceof Error
        ? error.message.replace(process.env.MONGODB_URI ?? "", "[redacted]")
        : "Unknown failure";
    console.error(
      `Create Post could not load categories (${errorName}): ${errorMessage}`,
    );
    categoryLoadError =
      "Categories could not be loaded. Check the database connection and reload this page.";
  }

  return (
    <PostEditorForm
      username={session.username}
      categories={categories}
      categoryLoadError={categoryLoadError}
    />
  );
}
