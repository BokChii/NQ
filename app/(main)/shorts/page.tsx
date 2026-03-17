import { createClient } from "@/lib/supabase/server";
import { ShortsList } from "./shorts-list";
import type { QuestionItem } from "./shorts-list";

const CATEGORIES = [
  { id: "economy", label: "경제" },
  { id: "it", label: "IT" },
  { id: "sports", label: "스포츠" },
  { id: "politics", label: "정치" },
  { id: "culture", label: "문화" },
];

export default async function ShortsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let excludedQuestionIds: string[] = [];
  if (user) {
    const { data: answers } = await supabase
      .from("user_answers")
      .select("question_id")
      .eq("user_id", user.id);
    excludedQuestionIds = (answers ?? []).map((a) => a.question_id);
  }

  let query = supabase
    .from("quiz_questions")
    .select(
      `
      *,
      quizzes!inner(id, title, category, difficulty)
    `
    )
    .eq("quizzes.daily_arena", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (excludedQuestionIds.length > 0) {
    query = query.not("id", "in", `(${excludedQuestionIds.join(",")})`);
  }

  const { data: rows } = await query;

  const byCategory: Record<string, QuestionItem[]> = {};
  for (const c of CATEGORIES) byCategory[c.id] = [];
  for (const row of rows ?? []) {
    const quiz = row.quizzes as { id: string; title: string; category: string; difficulty: number } | null;
    const cat = (row as { category?: string | null }).category ?? quiz?.category;
    if (!cat || !byCategory[cat]) continue;
    const { quizzes: _quizzes, ...qq } = row as typeof row & { quizzes: unknown };
    byCategory[cat].push({ ...qq, quiz_title: quiz?.title });
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Category Shorts</h1>
      <p className="text-sm text-muted-foreground mb-4">
        관심사별 무제한 스와이프 퀴즈. XP와 레벨에 반영됩니다.
      </p>
      <ShortsList
        initialQuestionsByCategory={byCategory}
        categories={CATEGORIES}
        excludedQuestionIds={excludedQuestionIds}
      />
    </div>
  );
}
