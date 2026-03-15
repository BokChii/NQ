import { createClient } from "@/lib/supabase/server";
import { ShortsList } from "./shorts-list";

const CATEGORIES = [
  { id: "economy", label: "경제" },
  { id: "it", label: "IT" },
  { id: "sports", label: "스포츠" },
  { id: "politics", label: "정치" },
  { id: "culture", label: "문화" },
];

export default async function ShortsPage() {
  const supabase = await createClient();
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, category, difficulty")
    .eq("daily_arena", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Category Shorts</h1>
          <p className="text-sm text-muted-foreground mb-4">
            관심사별 무제한 스와이프 퀴즈. XP와 레벨에 반영됩니다.
          </p>
      <ShortsList initialQuizzes={quizzes ?? []} categories={CATEGORIES} />
    </div>
  );
}
