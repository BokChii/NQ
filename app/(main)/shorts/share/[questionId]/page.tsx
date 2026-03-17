import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShortsShareClient } from "./shorts-share-client";

type Props = { params: Promise<{ questionId: string }> };

export default async function ShortsSharePage({ params }: Props) {
  const { questionId } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("quiz_questions")
    .select(
      `
      *,
      quizzes!inner(id, title, category, difficulty, daily_arena)
    `
    )
    .eq("id", questionId)
    .eq("quizzes.daily_arena", false)
    .single();

  if (!row) notFound();

  const quiz = row.quizzes as { id: string; title: string; category: string; difficulty: number } | null;
  if (!quiz) notFound();

  const question = {
    ...row,
    quizzes: undefined,
    quiz_title: quiz.title,
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-2">퀴즈 공유</h1>
      <p className="text-sm text-muted-foreground mb-4">
        친구에게 공유된 퀴즈예요. 풀어보고 결과를 확인해 보세요!
      </p>
      <ShortsShareClient question={question} />
      <a
        href="/shorts"
        className="mt-4 block text-center text-sm text-primary hover:underline"
      >
        쇼츠에서 더 풀기 →
      </a>
    </div>
  );
}
