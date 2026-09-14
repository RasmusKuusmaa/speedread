"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/session")) {
    return null;
  }

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4 font-sans text-sm">
        <Link href="/" className="text-ink">
          Reading trainer
        </Link>
        <nav className="flex gap-5 text-muted">
          <Link href="/practice">Practice</Link>
          <Link href="/books">Books</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </div>
    </header>
  );
}
