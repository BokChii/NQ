"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Layers, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/arena", label: "아레나", Icon: Flame },
  { href: "/shorts", label: "쇼츠", Icon: Layers },
  { href: "/rivalry", label: "대결", Icon: Swords },
  { href: "/profile", label: "프로필", Icon: User },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-stretch justify-around gap-0.5 border-t border-border/70 bg-card/60 px-1.5 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-card/50">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          href === "/arena"
            ? pathname === "/arena" || pathname.startsWith("/arena/")
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-colors duration-200",
              isActive
                ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} strokeWidth={isActive ? 2.25 : 2} />
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
