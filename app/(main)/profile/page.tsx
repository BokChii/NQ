import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDisplayStreak } from "@/lib/streak";
import { ArenaCalendar } from "@/components/profile/arena-calendar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, nq, level, xp, streak, last_played_at, school_id, region_id")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 364 * 86400 * 1000).toISOString().slice(0, 10);
  const { data: arenaDays } = await supabase
    .from("user_daily_arena")
    .select("play_date, score, total")
    .eq("user_id", user.id)
    .gte("play_date", startDate)
    .lte("play_date", today);
  const participationMap: Record<string, { score: number; total: number }> = {};
  for (const row of arenaDays ?? []) {
    const d = String(row.play_date).slice(0, 10);
    participationMap[d] = { score: row.score ?? 0, total: row.total ?? 10 };
  }
  const schoolName =
    profile?.school_id &&
    (await supabase.from("schools").select("name").eq("id", profile.school_id).single()).data?.name;
  const regionName =
    profile?.region_id &&
    (await supabase.from("regions").select("name").eq("id", profile.region_id).single()).data?.name;

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const nextLevelXp = 50 * level * level;
  const currentLevelStartXp = 50 * (level - 1) * (level - 1);
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);
  const progressDenom = nextLevelXp - currentLevelStartXp;
  const progressPct = progressDenom > 0 ? Math.min(1, (xp - currentLevelStartXp) / progressDenom) : 1;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">프로필</h1>
      <Card>
        <CardHeader>
          <p className="font-medium">{profile?.display_name || user.email}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">nq 지수</span>
            <span className="font-semibold text-primary">
              {Number(profile?.nq ?? 0).toFixed(1)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">레벨</span>
              <span>Lv.{level} → Lv.{level + 1}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>경험치 {xp.toLocaleString()} XP</span>
              <span>다음 레벨까지 {xpToNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all rounded-full"
                style={{ width: `${progressPct * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">연속 참여</span>
            <span>🔥 {getDisplayStreak(Number(profile?.streak ?? 0), profile?.last_played_at ?? null)}</span>
          </div>
          {schoolName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">학교</span>
              <span>{schoolName}</span>
            </div>
          )}
          {regionName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">지역</span>
              <span>{regionName}</span>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <p className="font-medium">일일 아레나 참여</p>
          <p className="text-xs text-muted-foreground">날짜에 마우스를 올리면 점수를 볼 수 있어요</p>
        </CardHeader>
        <CardContent>
          <ArenaCalendar participations={participationMap} />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2">
        <Link href="/profile/edit">
          <Button variant="outline" className="w-full">
            프로필 편집
          </Button>
        </Link>
        <Link href="/profile/share">
          <Button variant="outline" className="w-full">
            nq 인증 카드 공유
          </Button>
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
