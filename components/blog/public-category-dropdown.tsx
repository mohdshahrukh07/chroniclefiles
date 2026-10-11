"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicCategoryLink } from "@/lib/public-posts";

export function PublicCategoryDropdown({
  categories,
}: {
  categories: PublicCategoryLink[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = "public-category-menu";

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 items-center gap-1 rounded-sm transition hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
      >
        Categories
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        id={panelId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`absolute left-0 top-full z-50 mt-2 grid w-[min(86vw,440px)] origin-top grid-cols-1 transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
          isOpen
            ? "grid-rows-[1fr] translate-y-0 opacity-100"
            : "pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden rounded-md border border-[#e5eae7] bg-white shadow-[0_14px_35px_rgba(0,0,0,.12)]">
          <ul className="grid grid-cols-2 gap-1 p-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  data-analytics-event="category-link"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-sm px-3 py-2.5 text-[13px] font-medium leading-5 hover:bg-[#E8F2F4] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
