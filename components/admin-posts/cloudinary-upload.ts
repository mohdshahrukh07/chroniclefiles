import {
  getCloudinaryUploadConfiguration,
  recordMediaUpload,
  type UploadedMediaInput,
} from "@/app/admin-dashboard/posts/new/actions";
import {
  cloudinaryUploadTargets,
  type CloudinaryUploadTarget,
} from "@/lib/cloudinary";

interface CloudinaryResponse {
  secure_url?: unknown;
  original_filename?: unknown;
  bytes?: unknown;
  resource_type?: unknown;
  format?: unknown;
  folder?: unknown;
  asset_folder?: unknown;
  error?: { message?: unknown };
}

export async function uploadToCloudinary(
  file: File,
  target: CloudinaryUploadTarget,
  alt?: string,
): Promise<string> {
  const { resourceType, folder } = cloudinaryUploadTargets[target];
  const { cloudName, uploadPreset } =
    await getCloudinaryUploadConfiguration();

  const formData = new FormData();
  formData.set("file", file);
  formData.set("upload_preset", uploadPreset);
  formData.set("folder", folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );
  const uploaded: CloudinaryResponse = await uploadResponse.json();
  const uploadedFolder = uploaded.folder ?? uploaded.asset_folder;
  if (
    !uploadResponse.ok ||
    typeof uploaded.secure_url !== "string" ||
    typeof uploaded.bytes !== "number" ||
    uploaded.resource_type !== resourceType ||
    uploadedFolder !== folder
  ) {
    const message =
      typeof uploaded.error?.message === "string"
        ? uploaded.error.message
        : "Cloudinary could not upload this file.";
    throw new Error(message);
  }

  const mediaInput: UploadedMediaInput = {
    filename:
      typeof uploaded.original_filename === "string"
        ? uploaded.original_filename
        : file.name,
    url: uploaded.secure_url,
    mimeType:
      file.type ||
      `${resourceType}/${typeof uploaded.format === "string" ? uploaded.format : "octet-stream"}`,
    size: uploaded.bytes,
    resourceType,
    folder,
    ...(alt?.trim() ? { alt: alt.trim().slice(0, 300) } : {}),
  };
  const mediaResult = await recordMediaUpload(mediaInput);
  if (!mediaResult.success) {
    throw new Error(mediaResult.message);
  }

  return uploaded.secure_url;
}
