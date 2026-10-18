"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ImagePlus, LoaderCircle, Search, X } from "lucide-react";
import type { logoutAction } from "@/app/admin-dashboard/actions";
import {
  HOMEPAGE_SLOTS,
  type HomepageSlot,
  type HomepageSlotValues,
  type HomepageManagementData,
} from "@/types/homepage";
import type { PublicPostCardData } from "@/components/blog/public-post-card";
import { AdminHeader } from "@/components/admin-dashboard/admin-header";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";

interface HomepageManagementProps {
  username: string;
  logoutAction: typeof logoutAction;
  initialData?: HomepageManagementData;
  loadError?: string;
}

const SLOT_LABELS: Record<HomepageSlot, string> = {
  leftTopPostId: "Left column — first story",
  leftBottomPostId: "Left column — second story",
  editorsPickPostId: "Editor's Pick",
  rightTopPostId: "Right column — first story",
  rightBottomPostId: "Right column — ad fallback story",
};

const EMPTY_LAYOUT: HomepageSlotValues = {
  leftTopPostId: null,
  leftBottomPostId: null,
  editorsPickPostId: null,
  rightTopPostId: null,
  rightBottomPostId: null,
};

interface SearchResponse {
  posts?: PublicPostCardData[];
  message?: string;
}

interface SaveResponse {
  success?: boolean;
  layout?: HomepageSlotValues;
  message?: string;
}

function getErrorMessage(payload: { message?: string }, fallback: string) {
  return typeof payload.message === "string" ? payload.message : fallback;
}

function SelectedPost({
  post,
  unavailable,
}: {
  post: PublicPostCardData | null;
  unavailable: boolean;
}) {
  if (!post) {
    return (
      <div className="flex min-h-[88px] items-center gap-3 rounded-lg bg-[#f6f8f7] p-3">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-[#E8F2F4] text-[#608A89]">
          <ImagePlus aria-hidden="true" className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#444444]">
            {unavailable ? "Previously selected post is unavailable" : "No post selected"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Choose an eligible published post for this slot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[88px] min-w-0 items-center gap-3 rounded-lg bg-[#f6f8f7] p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-[#E8F2F4]">
        {post.thumbnail && (
          <Image
            unoptimized
            fill
            src={post.thumbnail}
            alt={post.title}
            sizes="64px"
            className="object-cover"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#444444]">
          {post.title}
        </span>
        <span className="mt-1 block truncate text-xs text-gray-500">
          {post.categoryName}
        </span>
      </span>
    </div>
  );
}

export function HomepageManagement({
  username,
  logoutAction,
  initialData,
  loadError,
}: HomepageManagementProps) {
  const [layout, setLayout] = useState(
    initialData?.layout ?? EMPTY_LAYOUT,
  );
  const [selectedPosts, setSelectedPosts] = useState<
    Record<HomepageSlot, PublicPostCardData | null>
  >(
    initialData?.selectedPosts ?? {
      leftTopPostId: null,
      leftBottomPostId: null,
      editorsPickPostId: null,
      rightTopPostId: null,
      rightBottomPostId: null,
    },
  );
  const [dirtySlots, setDirtySlots] = useState<Set<HomepageSlot>>(new Set());
  const [activeSlot, setActiveSlot] = useState<HomepageSlot | null>(null);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState(initialData?.posts ?? []);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!activeSlot || !search.trim()) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const response = await fetch(
          `/api/admin/homepage-layout?q=${encodeURIComponent(search.trim())}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const payload = (await response.json()) as SearchResponse;
        if (!response.ok) {
          setSearchError(
            getErrorMessage(payload, "Published posts could not be searched."),
          );
          setPosts([]);
          return;
        }
        setPosts(Array.isArray(payload.posts) ? payload.posts : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchError("Published posts could not be searched. Check your connection.");
        setPosts([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activeSlot, initialData?.posts, search]);

  function openPostPicker(slot: HomepageSlot) {
    setActiveSlot(slot);
    setSearch("");
    setPosts(initialData?.posts ?? []);
    setSearchError("");
  }

  function closePostPicker() {
    setActiveSlot(null);
    setSearch("");
    setSearchError("");
  }

  function selectPost(post: PublicPostCardData) {
    if (!activeSlot) return;
    setLayout((current) => ({ ...current, [activeSlot]: post.id }));
    setSelectedPosts((current) => ({ ...current, [activeSlot]: post }));
    setDirtySlots((current) => new Set(current).add(activeSlot));
    setSaveError("");
    setNotice("");
    closePostPicker();
  }

  function clearSlot(slot: HomepageSlot) {
    setLayout((current) => ({ ...current, [slot]: null }));
    setSelectedPosts((current) => ({ ...current, [slot]: null }));
    setDirtySlots((current) => new Set(current).add(slot));
    setSaveError("");
    setNotice("");
  }

  function updateSearch(value: string) {
    setSearch(value);
    if (!value.trim()) {
      setPosts(initialData?.posts ?? []);
      setSearchError("");
      setIsSearching(false);
    }
  }

  async function saveChanges() {
    if (!dirtySlots.size || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    setNotice("");
    const changes = Object.fromEntries(
      [...dirtySlots].map((slot) => [slot, layout[slot]]),
    );

    try {
      const response = await fetch("/api/admin/homepage-layout", {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      const payload = (await response.json()) as SaveResponse;
      if (!response.ok || payload.success !== true || !payload.layout) {
        setSaveError(
          getErrorMessage(payload, "Homepage selections could not be saved."),
        );
        return;
      }
      setLayout(payload.layout);
      setDirtySlots(new Set());
      setNotice("Homepage selections saved successfully.");
    } catch {
      setSaveError("Homepage selections could not be saved. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#444444]">
      <AdminSidebar username={username} activeHref="/admin-dashboard/homepage" />
      <main className="min-w-0 lg:ml-64">
        <AdminHeader
          username={username}
          logoutAction={logoutAction}
          title="Homepage Management"
          description="Choose the stories featured on the public homepage."
        />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-[#444444]">
                  Featured story slots
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                  Select up to five different published posts. The right-bottom
                  selection remains saved as a fallback whenever its ad slot is
                  hidden.
                </p>
              </div>
              <button
                type="button"
                onClick={saveChanges}
                disabled={!dirtySlots.size || isSaving || Boolean(loadError)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#02a95c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSaving ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Check aria-hidden="true" className="size-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {HOMEPAGE_SLOTS.map((slot) => (
                <article
                  key={slot}
                  className="min-w-0 rounded-xl border border-gray-200 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-[#444444]">
                      {SLOT_LABELS[slot]}
                    </h3>
                    {slot === "rightBottomPostId" && (
                      <span className="rounded-full bg-[#E8F2F4] px-2.5 py-1 text-[10px] font-semibold text-[#3c6661]">
                        Ad fallback
                      </span>
                    )}
                  </div>
                  <SelectedPost
                    post={selectedPosts[slot]}
                    unavailable={Boolean(layout[slot]) && !selectedPosts[slot]}
                  />
                  <div
                    className={`mt-3 grid gap-2 ${
                      layout[slot] ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openPostPicker(slot)}
                      disabled={Boolean(loadError) || isSaving}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#02a95c] px-3 text-sm font-semibold text-[#16834f] transition hover:bg-[#effaf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selectedPosts[slot] ? "Change Blog" : "Select Blog"}
                    </button>
                    {layout[slot] && (
                      <button
                        type="button"
                        onClick={() => clearSlot(slot)}
                        disabled={Boolean(loadError) || isSaving}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Clear slot
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {loadError && (
              <div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 sm:mx-6">
                <p role="alert" className="text-sm text-red-800">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="min-h-10 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  Retry
                </button>
              </div>
            )}
            {saveError && (
              <p role="alert" className="mx-5 mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800 sm:mx-6">
                {saveError}
              </p>
            )}
            {notice && (
              <p role="status" className="mx-5 mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800 sm:mx-6">
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>

      {activeSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePostPicker();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") closePostPicker();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="homepage-post-picker-heading"
            className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
              <div>
                <h2
                  id="homepage-post-picker-heading"
                  className="text-lg font-bold text-[#444444]"
                >
                  Select a published post
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  For {SLOT_LABELS[activeSlot]}
                </p>
              </div>
              <button
                type="button"
                onClick={closePostPicker}
                aria-label="Close post selector"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="p-5 pb-3 sm:px-6">
              <label
                htmlFor="homepage-post-search"
                className="mb-2 block text-sm font-semibold text-[#444444]"
              >
                Search by title or tag
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="homepage-post-search"
                  type="search"
                  autoFocus
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Search published posts..."
                  className="min-h-11 w-full rounded-lg border border-gray-300 pl-10 pr-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-[#02a95c]/20"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
              {searchError && (
                <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {searchError}
                </p>
              )}
              {isSearching ? (
                <p className="flex items-center gap-2 py-8 text-sm text-gray-500">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Searching published posts...
                </p>
              ) : posts.length ? (
                <ul className="space-y-2">
                  {posts.map((post) => {
                    const selectedElsewhere = HOMEPAGE_SLOTS.some(
                      (slot) => slot !== activeSlot && layout[slot] === post.id,
                    );
                    return (
                      <li key={post.id}>
                        <button
                          type="button"
                          disabled={selectedElsewhere}
                          onClick={() => selectPost(post)}
                          className="flex min-h-[76px] w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-[#02a95c] hover:bg-[#f6fbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#E8F2F4]">
                            {post.thumbnail && (
                              <Image
                                unoptimized
                                fill
                                src={post.thumbnail}
                                alt={post.title}
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[#444444]">
                              {post.title}
                            </span>
                            <span className="mt-1 block truncate text-xs text-gray-500">
                              {post.categoryName}
                            </span>
                          </span>
                          {selectedElsewhere && (
                            <span className="shrink-0 text-xs text-gray-500">
                              Used in another slot
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-8 text-sm text-gray-500">
                  {initialData?.posts.length
                    ? "No published posts match this search."
                    : "No eligible published posts are available yet."}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
