import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { SavedPostPreview } from "@/components/admin-posts/saved-post-preview";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";
import { normalizePostContent } from "@/lib/post-content";

export const metadata: Metadata = {
  title: "Post Preview | ChronicleFiles",
  robots: { index: false, follow: false },
};

interface PostPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPreviewPage({
  params,
}: PostPreviewPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  let post;
  try {
    await connectToDatabase();
    post = await Post.findById(id).lean().exec();
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Post preview could not be loaded (${errorName}).`);
    throw new Error("The post preview could not be loaded. Please try again.");
  }

  if (!post) notFound();

  return (
    <SavedPostPreview
      title={post.title}
      excerpt={post.excerpt ?? ""}
      thumbnail={post.thumbnail}
      blocks={normalizePostContent(post.content, post.videos ?? [])}
    />
  );
}
