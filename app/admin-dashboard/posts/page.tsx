import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Types, type QueryFilter } from "mongoose";
import { PostsList } from "@/components/admin-posts/posts-list";
import Category from "@/models/category";
import Post, { type PostDocument } from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Posts | ChronicleFiles",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;

interface PostsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    page?: string;
    notice?: string;
  }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const status =
    params.status === "draft" || params.status === "published"
      ? params.status
      : "";
  const categoryId =
    params.category && Types.ObjectId.isValid(params.category)
      ? params.category
      : "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const notice =
    params.notice === "draft-saved" ||
    params.notice === "draft-updated" ||
    params.notice === "post-published" ||
    params.notice === "post-updated"
      ? params.notice
      : undefined;
  let page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const filter: QueryFilter<PostDocument> = {};
  if (query) {
    const safeQuery = escapeRegExp(query);
    filter.$or = [
      { title: { $regex: safeQuery, $options: "i" } },
      { slug: { $regex: safeQuery, $options: "i" } },
    ];
  }
  if (status) filter.status = status;
  if (categoryId) filter.category = new Types.ObjectId(categoryId);

  let posts: {
    id: string;
    title: string;
    slug: string;
    category: string;
    status: "draft" | "published";
    updatedAt: string;
    publishedAt?: string;
  }[] = [];
  let categories: { id: string; name: string }[] = [];
  let totalPosts = 0;
  let loadError: string | undefined;

  try {
    await connectToDatabase();
    const [count, categoryDocuments] = await Promise.all([
      Post.countDocuments(filter).exec(),
      Category.find({})
        .select({ name: 1 })
        .sort({ name: 1 })
        .lean()
        .exec(),
    ]);
    totalPosts = count;
    const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const documents = await Post.find(filter)
      .select({ title: 1, slug: 1, category: 1, status: 1, updatedAt: 1 })
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean()
      .exec();

    const categoryNames = new Map(
      categoryDocuments.map((category) => [category._id.toString(), category.name]),
    );
    posts = documents.map((post) => {
      return {
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        category: post.category
          ? categoryNames.get(post.category.toString()) ?? "Uncategorized"
          : "Uncategorized",
        status: post.status,
        updatedAt: post.updatedAt.toISOString(),
      };
    });
    categories = categoryDocuments.map((category) => ({
      id: category._id.toString(),
      name: category.name,
    }));
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Posts list could not be loaded (${errorName}).`);
    loadError = "Posts could not be loaded. Check the database connection and try again.";
  }

  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));

  return (
    <PostsList
      username={session.username}
      posts={posts}
      categories={categories}
      filters={{ query, status, category: categoryId }}
      page={page}
      totalPages={totalPages}
      totalPosts={totalPosts}
      loadError={loadError}
      notice={notice}
    />
  );
}
