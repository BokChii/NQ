import { createClient } from "@/lib/supabase/server";
import { ShortsList } from "./shorts-list";
import type { QuestionItem } from "./shorts-list";
import { Layers } from "lucide-react";

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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-v/15 px-3 py-1 text-xs font-semibold text-accent-v">
          <Layers className="h-3.5 w-3.5" strokeWidth={2.5} />
          Category Shorts
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">쇼츠 퀴즈</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          관심사별로 스와이프하며 풀어요. XP와 레벨에 반영됩니다.
        </p>
      </div>
      <ShortsList
        initialQuestionsByCategory={byCategory}
        categories={CATEGORIES}
        excludedQuestionIds={excludedQuestionIds}
      />
    </div>
  );
}
