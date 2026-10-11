"use client";

import { useState } from "react";

export function ArticleShareActions({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function shareArticle() {
    if (!navigator.share) {
      setMessage("Sharing is not supported by this browser.");
      return;
    }

    try {
      await navigator.share({ title, url: window.location.href });
      setMessage("Article shared.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("The article could not be shared. Please try again.");
    }
  }

  async function copyArticleLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Article link copied.");
    } catch {
      setMessage("The article link could not be copied. Please copy it from your browser.");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={shareArticle}
          className="min-h-11 rounded-md border border-[#e0e8e2] bg-white px-4 text-sm text-[#48534c] hover:border-[#02A95C] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
        >
          Share article
        </button>
        <button
          type="button"
          onClick={copyArticleLink}
          className="min-h-11 rounded-md border border-[#e0e8e2] bg-white px-4 text-sm text-[#48534c] hover:border-[#02A95C] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
        >
          Copy link
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-[#608A89]">
        {message}
      </p>
    </div>
  );
}
