"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/arena", label: "아레나" },
  { href: "/shorts", label: "쇼츠" },
  { href: "/rivalry", label: "대결" },
  { href: "/profile", label: "프로필" },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t border-border">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive =
          href === "/arena"
            ? pathname === "/arena" || pathname.startsWith("/arena/")
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              isActive
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
