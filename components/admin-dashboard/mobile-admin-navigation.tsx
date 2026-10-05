"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  AdminIdentity,
  AdminNavigation,
  Brand,
} from "@/components/admin-dashboard/admin-navigation";

interface MobileAdminNavigationProps {
  username: string;
  activeHref?: string;
}

export function MobileAdminNavigation({
  username,
  activeHref = "/admin-dashboard",
}: MobileAdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3 lg:hidden">
      <Brand className="py-3" />
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-admin-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2"
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>
      {isOpen && (
        <div
          id="mobile-admin-navigation"
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
        >
          <AdminNavigation
            activeHref={activeHref}
            onNavigate={() => setIsOpen(false)}
          />
          <div className="mt-3 border-t border-gray-100 pt-3">
            <AdminIdentity username={username} />
          </div>
        </div>
      )}
    </div>
  );
}
