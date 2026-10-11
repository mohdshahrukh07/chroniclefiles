export const cloudinaryUploadTargets = {
  postImage: {
    resourceType: "image",
    folder: "chroniclefiles/images/posts",
  },
  thumbnail: {
    resourceType: "image",
    folder: "chroniclefiles/images/thumbnails",
  },
  categoryImage: {
    resourceType: "image",
    folder: "chroniclefiles/images/categories",
  },
  postVideo: {
    resourceType: "video",
    folder: "chroniclefiles/videos/posts",
  },
} as const;

export type CloudinaryUploadTarget = keyof typeof cloudinaryUploadTargets;
export type CloudinaryUploadFolder =
  (typeof cloudinaryUploadTargets)[CloudinaryUploadTarget]["folder"];
export type CloudinaryResourceType = "image" | "video";

export function isCloudinaryUploadFolder(
  value: unknown,
): value is CloudinaryUploadFolder {
  return Object.values(cloudinaryUploadTargets).some(
    (target) => target.folder === value,
  );
}
