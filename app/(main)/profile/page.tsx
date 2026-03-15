import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, nq, level, xp, streak, school_id, region_id")
    .eq("id", user.id)
    .single();
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
            <span>🔥 {profile?.streak ?? 0}</span>
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
