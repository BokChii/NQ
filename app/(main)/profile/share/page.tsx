import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShareCard } from "@/components/share/share-card";
import { getDisplayStreak } from "@/lib/streak";

export default async function ProfileSharePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, nq, level, streak, last_played_at")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/profile");

  const displayStreak = getDisplayStreak(
    Number((profile as { streak?: number }).streak) ?? 0,
    (profile as { last_played_at?: string | null }).last_played_at ?? null
  );

  return (
    <div className="p-4 flex flex-col items-center min-h-screen">
      <h1 className="text-lg font-bold mb-4">nq 인증 카드</h1>
      <p className="text-sm text-muted-foreground mb-6">
        이미지를 길게 눌러 저장한 뒤 인스타 스토리에 공유하세요.
      </p>
      <ShareCard
        displayName={(profile as { display_name?: string }).display_name ?? "익명"}
        nq={Number((profile as { nq?: number }).nq).toFixed(1)}
        level={Number((profile as { level?: number }).level)}
        streak={displayStreak}
      />
    </div>
  );
}
