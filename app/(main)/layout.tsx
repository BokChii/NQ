import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? await supabase.from("profiles").select("nq, level, streak, rank_name, last_played_at").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/arena" className="font-bold text-primary text-lg">
            NQ
          </Link>
          {profile?.data && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {(profile.data as { rank_name?: string }).rank_name && (
                <span className="font-medium">{(profile.data as { rank_name?: string }).rank_name}</span>
              )}
              <span>nq {Number(profile.data.nq).toFixed(1)}</span>
              <span>Lv.{profile.data.level}</span>
              <span>🔥 {getDisplayStreak(Number(profile.data.streak), profile.data.last_played_at as string | null)}</span>
            </div>
          )}
        </div>
        <nav className="flex border-t border-border">
          <NavLink href="/arena">아레나</NavLink>
          <NavLink href="/shorts">쇼츠</NavLink>
          <NavLink href="/rivalry">대결</NavLink>
          <NavLink href="/profile">프로필</NavLink>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
