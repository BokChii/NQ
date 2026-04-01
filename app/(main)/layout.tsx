import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayStreak } from "@/lib/streak";
import { MainNav } from "@/components/main-nav";

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
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="flex items-center justify-between gap-2 min-h-14 px-5 py-2">
          <Link
            href="/arena"
            className="font-display text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-90"
          >
            NQ
          </Link>
          {profile?.data && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs">
              {(profile.data as { rank_name?: string }).rank_name && (
                <span className="inline-flex max-w-[7rem] truncate rounded-full border border-border bg-muted/60 px-2.5 py-1 font-medium text-foreground">
                  {(profile.data as { rank_name?: string }).rank_name}
                </span>
              )}
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary tabular-nums">
                NQ {Number(profile.data.nq).toFixed(1)}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground tabular-nums">
                Lv.{profile.data.level}
              </span>
              <span className="rounded-full bg-orange-500/12 px-2.5 py-1 font-medium text-orange-700 tabular-nums dark:text-orange-400">
                🔥 {getDisplayStreak(Number(profile.data.streak), profile.data.last_played_at as string | null)}
              </span>
            </div>
          )}
        </div>
        <MainNav />
      </header>
      <main className="flex-1 px-5 py-5">{children}</main>
    </div>
  );
}
