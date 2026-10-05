import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import type { JSONContent } from "@tiptap/core";
import { PostEditorForm } from "@/components/admin-posts/post-editor-form";
import Category from "@/models/category";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Edit Post | ChronicleFiles",
  robots: { index: false, follow: false },
};

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  const [post, categoryDocuments] = await (async () => {
    try {
      await connectToDatabase();
      return await Promise.all([
        Post.findById(id).lean().exec(),
        Category.find({})
          .select({ name: 1 })
          .sort({ name: 1 })
          .lean()
          .exec(),
      ]);
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      console.error(`Edit Post could not be loaded (${errorName}).`);
      throw new Error("The post editor could not be loaded. Please try again.");
    }
  })();

  if (!post) notFound();

  const categories = categoryDocuments.map((category) => ({
    id: category._id.toString(),
    name: category.name,
  }));

  return (
    <PostEditorForm
      username={session.username}
      categories={categories}
      initialPost={{
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        thumbnail: post.thumbnail,
        category: post.category?.toString() ?? "",
        tags: post.tags ?? [],
        status: post.status,
        content: post.content
          ? (JSON.parse(JSON.stringify(post.content)) as JSONContent)
          : { type: "doc", content: [] },
        videos: (post.videos ?? []).map((video) => ({
          type: video.type,
          url: video.url,
          videoId: video.videoId,
          title: video.title,
        })),
        seo: {
          metaTitle: post.seo?.metaTitle ?? "",
          metaDescription: post.seo?.metaDescription ?? "",
        },
      }}
    />
  );
}
