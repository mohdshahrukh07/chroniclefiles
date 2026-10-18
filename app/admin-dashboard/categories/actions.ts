"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import Category from "@/models/category";
import Media from "@/models/media";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  image?: string;
}

export type CategoryMutationResult =
  | { success: true }
  | {
      success: false;
      message: string;
      field?: "name" | "slug" | "image";
    };

export type DeleteCategoryResult =
  | { success: true }
  | {
      success: false;
      message: string;
      code?: "has-posts";
      postCount?: number;
      categoryName?: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCloudinaryImageUrl(value: string): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
      /(?:^|\/)chroniclefiles\/images\/categories\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function getSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown failure";
  return message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]");
}

function validateInput(value: unknown): CategoryInput | null {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.description !== "string" ||
    (value.image !== undefined && typeof value.image !== "string")
  ) {
    return null;
  }

  return {
    name: value.name.trim(),
    slug: value.slug.trim().toLowerCase(),
    description: value.description.trim(),
    image: typeof value.image === "string" ? value.image.trim() : "",
  };
}

async function validateCategoryImage(
  image: string,
  currentImage: string | undefined,
  userId: string,
): Promise<boolean> {
  if (!image) return true;
  if (!isCloudinaryImageUrl(image)) return false;
  if (image === currentImage) return true;

  return Boolean(
    await Media.exists({
      url: image,
      mimeType: /^image\//,
      uploadedBy: new Types.ObjectId(userId),
    }),
  );
}

function revalidateCategorySurfaces(): void {
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin-dashboard/categories");
  revalidatePath("/admin-dashboard/posts");
  revalidatePath("/admin-dashboard/posts/new");
  revalidatePath("/admin-dashboard/posts/[id]/edit", "page");
  revalidatePath("/admin-dashboard");
}

export async function createCategoryAction(
  value: unknown,
): Promise<CategoryMutationResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, message: "Your session has expired. Sign in again." };
  }

  const input = validateInput(value);
  if (!input) {
    return { success: false, message: "The category details are invalid." };
  }
  if (!input.name) {
    return { success: false, message: "Enter a category name.", field: "name" };
  }
  if (input.name.length > 80) {
    return {
      success: false,
      message: "Category names must be 80 characters or fewer.",
      field: "name",
    };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    return {
      success: false,
      message: "Use lowercase letters, numbers, and hyphens for the slug.",
      field: "slug",
    };
  }
  try {
    await connectToDatabase();
    if (!(await validateCategoryImage(input.image ?? "", undefined, session.userId))) {
      return {
        success: false,
        message: "Upload the category image using the Cloudinary uploader.",
        field: "image",
      };
    }
    await Category.create({
      name: input.name,
      slug: input.slug,
      description: input.description || undefined,
      image: input.image || undefined,
    });
    revalidateCategorySurfaces();
    return { success: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        success: false,
        message: "A category with this name or slug already exists.",
        field: "slug",
      };
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Category creation failed (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return {
      success: false,
      message: "The category could not be created. Please try again.",
    };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  value: unknown,
): Promise<CategoryMutationResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, message: "Your session has expired. Sign in again." };
  }
  if (!Types.ObjectId.isValid(categoryId)) {
    return { success: false, message: "The requested category could not be found." };
  }

  const input = validateInput(value);
  if (!input) {
    return { success: false, message: "The category details are invalid." };
  }
  if (!input.name) {
    return { success: false, message: "Enter a category name.", field: "name" };
  }
  if (input.name.length > 80) {
    return {
      success: false,
      message: "Category names must be 80 characters or fewer.",
      field: "name",
    };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    return {
      success: false,
      message: "Use lowercase letters, numbers, and hyphens for the slug.",
      field: "slug",
    };
  }

  try {
    await connectToDatabase();
    const category = await Category.findById(categoryId).exec();
    if (!category) {
      return { success: false, message: "The requested category could not be found." };
    }
    if (
      !(await validateCategoryImage(
        input.image ?? "",
        category.image,
        session.userId,
      ))
    ) {
      return {
        success: false,
        message: "Upload the category image using the Cloudinary uploader.",
        field: "image",
      };
    }

    category.set({
      name: input.name,
      slug: input.slug,
      description: input.description || undefined,
      image: input.image || undefined,
    });
    await category.save();
    revalidateCategorySurfaces();
    return { success: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        success: false,
        message: "A category with this name or slug already exists.",
        field: "slug",
      };
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Category update failed (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return {
      success: false,
      message: "The category could not be updated. Please try again.",
    };
  }
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<DeleteCategoryResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, message: "Your session has expired. Sign in again." };
  }
  if (!Types.ObjectId.isValid(categoryId)) {
    return { success: false, message: "The requested category could not be found." };
  }

  try {
    await connectToDatabase();
    const category = await Category.findById(categoryId)
      .select({ name: 1 })
      .lean()
      .exec();
    if (!category) {
      return { success: false, message: "The requested category could not be found." };
    }

    const postCount = await Post.countDocuments({
      category: new Types.ObjectId(categoryId),
    }).exec();
    if (postCount > 0) {
      return {
        success: false,
        code: "has-posts",
        postCount,
        categoryName: category.name,
        message: "Reassign or remove the connected posts before deleting this category.",
      };
    }

    const deletedCategory = await Category.findOneAndDelete({
      _id: new Types.ObjectId(categoryId),
    }).exec();
    if (!deletedCategory) {
      return { success: false, message: "The category could not be deleted. Refresh and try again." };
    }

    revalidateCategorySurfaces();
    return { success: true };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Category deletion failed (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return {
      success: false,
      message: "The category could not be deleted. Please try again.",
    };
  }
}
