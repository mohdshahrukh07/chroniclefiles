"use client";

import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { uploadToCloudinary } from "@/components/admin-posts/cloudinary-upload";
import {
  cloudinaryUploadTargets,
  type CloudinaryUploadTarget,
} from "@/lib/cloudinary";

interface CloudinaryUploadButtonProps {
  target: CloudinaryUploadTarget;
  onUploaded: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  children: ReactNode;
  alt?: string;
  className?: string;
  disabled?: boolean;
}

export function CloudinaryUploadButton({
  target,
  onUploaded,
  onUploadingChange,
  children,
  alt,
  className,
  disabled = false,
}: CloudinaryUploadButtonProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const configuration = cloudinaryUploadTargets[target];

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadToCloudinary(file, target, alt);
      onUploaded(url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Cloudinary could not upload this file.",
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-hidden="true"
        tabIndex={-1}
        accept={
          configuration.resourceType === "image"
            ? "image/*"
            : "video/mp4,video/webm,video/quicktime,video/x-m4v"
        }
        onChange={(event) => void handleFileChange(event)}
        className="hidden"
      />
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => {
          setError("");
          inputRef.current?.click();
        }}
        className={className}
        aria-describedby={error ? `${inputId}-error` : undefined}
      >
        {isUploading ? "Uploading directly to Cloudinary..." : children}
      </button>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
