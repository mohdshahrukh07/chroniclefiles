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

const PAGE_SIZE = 10;

interface CategoriesPageProps {
  searchParams: Promise<{ page?: string }>;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  postCount: number;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  const params = await searchParams;
  const requestedPage =
    params.page && /^[1-9]\d*$/.test(params.page) ? Number(params.page) : 1;
  let page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  let categories: CategoryRow[] = [];
  let totalCategories = 0;
  let loadError: string | undefined;

  try {
    await connectToDatabase();
    const categoryCount = await Category.countDocuments({}).exec();
    totalCategories = categoryCount;
    const totalPages = Math.max(1, Math.ceil(totalCategories / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const documents = await Category.find({})
      .select({ name: 1, slug: 1, description: 1, image: 1 })
      .sort({ name: 1, _id: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean()
      .exec();
    const postCounts = documents.length
      ? await Post.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { category: { $in: documents.map(({ _id }) => _id) } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]).exec()
      : [];
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
      page={page}
      totalPages={Math.max(1, Math.ceil(totalCategories / PAGE_SIZE))}
      totalCategories={totalCategories}
      loadError={loadError}
    />
  );
}
