import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark } from "lucide-react";
import { SavedShortsList } from "./saved-shorts-list";

export default async function ProfileSavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: savedRows } = await supabase
    .from("user_saved_shorts")
    .select("question_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const questionIds = (savedRows ?? []).map((r) => r.question_id);
  if (questionIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl p-0" aria-label="프로필로">
              ←
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">저장한 뉴스 퀴즈</h1>
        </div>
        <Card variant="subtle" className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bookmark className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted-foreground">
              아직 저장한 퀴즈가 없어요. 쇼츠에서 ☆ 버튼을 눌러 저장해 보세요!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: questionRows } = await supabase
    .from("quiz_questions")
    .select(
      `
      *,
      quizzes!inner(title, category)
    `
    )
    .in("id", questionIds);

  const orderMap = Object.fromEntries(questionIds.map((id, i) => [id, i]));
  const items = (questionRows ?? [])
    .map((row) => {
      const quiz = row.quizzes as { title?: string; category?: string } | null;
      const { quizzes: _q, ...qq } = row as typeof row & { quizzes: unknown };
      const cat = (row as { category?: string | null }).category ?? quiz?.category;
      return {
        ...qq,
        quiz_title: quiz?.title,
        category: cat,
        _order: orderMap[qq.id] ?? 999,
      };
    })
    .sort((a, b) => (a._order as number) - (b._order as number))
    .map(({ _order, ...rest }) => rest);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl p-0" aria-label="프로필로">
            ←
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">저장한 뉴스 퀴즈</h1>
      </div>
      <p className="text-sm text-muted-foreground">쇼츠에서 저장한 퀴즈를 모아봤어요.</p>
      <SavedShortsList items={items} />
    </div>
  );
}
