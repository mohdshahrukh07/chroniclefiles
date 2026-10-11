import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { CategoryManagement } from "@/components/admin-categories/category-management";
import Category from "@/models/category";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Categories | ChronicleFiles",
  robots: { index: false, follow: false },
};

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  postCount: number;
}

export default async function CategoriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  let categories: CategoryRow[] = [];
  let loadError: string | undefined;

  try {
    await connectToDatabase();
    const [documents, postCounts] = await Promise.all([
      Category.find({})
        .select({ name: 1, slug: 1, description: 1, image: 1 })
        .sort({ name: 1 })
        .lean()
        .exec(),
      Post.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { category: { $type: "objectId" } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]).exec(),
    ]);

    const countsByCategory = new Map(
      postCounts.map(({ _id, count }) => [_id.toString(), count]),
    );
    categories = documents.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      ...(category.image ? { image: category.image } : {}),
      postCount: countsByCategory.get(category._id.toString()) ?? 0,
    }));
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Categories could not be loaded (${errorName}).`);
    loadError =
      "Categories could not be loaded. Check the database connection and try again.";
  }

  return (
    <CategoryManagement
      username={session.username}
      categories={categories}
      loadError={loadError}
    />
  );
}
