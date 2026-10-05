"use client";

import { useState } from "react";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import type { PostVideo, PostVideoType } from "@/models/post";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { CloudinaryUploadButton } from "@/components/admin-posts/cloudinary-upload-button";

export interface EditorVideo {
  id: number;
  type: "" | PostVideoType;
  youtubeUrl: string;
  url?: string;
  videoId?: string;
  title?: string;
  isUploading: boolean;
  error?: string;
}

export function toPostVideos(videos: EditorVideo[]): PostVideo[] {
  const postVideos: PostVideo[] = [];
  for (const video of videos) {
    if (video.type === "cloudinary" && video.url) {
      postVideos.push({
        type: "cloudinary",
        url: video.url,
        ...(video.title ? { title: video.title } : {}),
      });
    }
    if (video.type === "youtube" && video.videoId) {
      postVideos.push({
        type: "youtube",
        videoId: video.videoId,
        ...(video.title ? { title: video.title } : {}),
      });
    }
  }
  return postVideos;
}

interface VideoSectionProps {
  videos: EditorVideo[];
  onChange: (videos: EditorVideo[]) => void;
  fieldError?: string;
  allowAdd?: boolean;
}

export function VideoSection({
  videos,
  onChange,
  fieldError,
  allowAdd = true,
}: VideoSectionProps) {
  const [nextId, setNextId] = useState(
    () => Math.max(0, ...videos.map((video) => video.id)) + 1,
  );

  function addVideo() {
    if (videos.length >= 2) return;
    onChange([
      ...videos,
      {
        id: nextId,
        type: "",
        youtubeUrl: "",
        isUploading: false,
      },
    ]);
    setNextId((id) => id + 1);
  }

  function updateVideo(id: number, update: Partial<EditorVideo>) {
    onChange(videos.map((video) => (video.id === id ? { ...video, ...update } : video)));
  }

  function changeType(id: number, type: "" | PostVideoType) {
    updateVideo(id, {
      type,
      url: undefined,
      videoId: undefined,
      youtubeUrl: "",
      error: undefined,
      isUploading: false,
    });
  }

  function updateYouTubeUrl(id: number, youtubeUrl: string) {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    updateVideo(id, {
      youtubeUrl,
      videoId: videoId ?? undefined,
      error:
        youtubeUrl && !videoId
          ? "Enter a valid YouTube video URL."
          : undefined,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="videos-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="videos-title" className="text-lg font-bold">
            Videos <span className="font-normal text-slate-400">(Optional)</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add up to 2 videos. Choose Cloudinary upload or YouTube.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {videos.length} / 2
        </span>
      </div>

      <div className="space-y-4">
        {videos.map((video, index) => (
          <article key={video.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Video {index + 1}</h3>
              <button
                type="button"
                onClick={() => onChange(videos.filter((item) => item.id !== video.id))}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={`Remove video ${index + 1}`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Remove
              </button>
            </div>

            <label htmlFor={`video-type-${video.id}`} className="mb-2 block text-sm font-semibold">
              Video type
            </label>
            <select
              id={`video-type-${video.id}`}
              value={video.type}
              onChange={(event) =>
                changeType(video.id, event.target.value as "" | PostVideoType)
              }
              className="mb-3 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
            >
              <option value="">Select video type</option>
              <option value="cloudinary">Upload Video to Cloudinary</option>
              <option value="youtube">YouTube Video</option>
            </select>

            {video.type === "cloudinary" && (
              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <UploadCloud aria-hidden="true" className="size-5 text-[#02a95c]" />
                  <CloudinaryUploadButton
                    target="postVideo"
                    disabled={video.isUploading}
                    onUploadingChange={(isUploading) =>
                      updateVideo(video.id, { isUploading })
                    }
                    onUploaded={(url) =>
                      updateVideo(video.id, {
                        url,
                        isUploading: false,
                        error: undefined,
                      })
                    }
                    className="min-h-11 rounded-lg bg-[#e8f2f4] px-4 text-sm font-medium text-[#02a95c] hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
                  >
                    {video.isUploading
                      ? "Uploading directly to Cloudinary..."
                      : video.url
                        ? "Video uploaded. Choose another to replace."
                        : "Choose a video file to upload directly to Cloudinary."}
                  </CloudinaryUploadButton>
                </div>
                {video.url && (
                  <video
                    controls
                    preload="metadata"
                    src={video.url}
                    className="mt-4 aspect-video w-full rounded-lg bg-black"
                  >
                    Your browser does not support video playback.
                  </video>
                )}
              </div>
            )}

            {video.type === "youtube" && (
              <div>
                <label htmlFor={`youtube-url-${video.id}`} className="mb-2 block text-sm font-semibold">
                  YouTube URL
                </label>
                <input
                  id={`youtube-url-${video.id}`}
                  type="url"
                  value={video.youtubeUrl}
                  onChange={(event) => updateYouTubeUrl(video.id, event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-invalid={Boolean(video.error)}
                  aria-describedby={video.error ? `youtube-error-${video.id}` : undefined}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  The video ID is extracted and saved; iframe HTML is never stored.
                </p>
                {video.error && (
                  <p id={`youtube-error-${video.id}`} role="alert" className="mt-2 text-sm text-red-600">
                    {video.error}
                  </p>
                )}
              </div>
            )}

            {!video.type && (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                Choose Cloudinary or YouTube to add a video.
              </p>
            )}

            {video.error && video.type === "cloudinary" && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {video.error}
              </p>
            )}
          </article>
        ))}
      </div>

      {allowAdd && (
        <button
          type="button"
          onClick={addVideo}
          disabled={videos.length >= 2}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-[#02a95c] hover:text-[#02a95c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add Video
        </button>
      )}
      {fieldError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {fieldError}
        </p>
      )}
    </section>
  );
}
