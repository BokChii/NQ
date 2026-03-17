import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              ←
            </Button>
          </Link>
          <h1 className="text-xl font-bold">저장한 뉴스 퀴즈</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center py-12">
          아직 저장한 퀴즈가 없어요. 쇼츠에서 ☆ 버튼을 눌러 저장해 보세요!
        </p>
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
      return {
        ...qq,
        quiz_title: quiz?.title,
        category: quiz?.category,
        _order: orderMap[qq.id] ?? 999,
      };
    })
    .sort((a, b) => (a._order as number) - (b._order as number))
    .map(({ _order, ...rest }) => rest);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            ←
          </Button>
        </Link>
        <h1 className="text-xl font-bold">저장한 뉴스 퀴즈</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        쇼츠에서 저장한 퀴즈를 모아봤어요.
      </p>
      <SavedShortsList items={items} />
    </div>
  );
}
