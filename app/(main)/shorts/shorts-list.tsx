"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShortsSwiper } from "@/components/quiz/shorts-swiper";
import { createClient } from "@/lib/supabase/client";
import type { QuizQuestion } from "@/lib/supabase/types";

const CATEGORIES = [
  { id: "economy", label: "경제" },
  { id: "it", label: "IT" },
  { id: "sports", label: "스포츠" },
  { id: "politics", label: "정치" },
  { id: "culture", label: "문화" },
];

const PAGE_SIZE = 10;

export type QuestionItem = QuizQuestion & { quiz_title?: string };

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type ShortsListProps = {
  initialQuestionsByCategory: Record<string, QuestionItem[]>;
  categories: { id: string; label: string }[];
  excludedQuestionIds?: string[];
};

export function ShortsList({ initialQuestionsByCategory, categories, excludedQuestionIds = [] }: ShortsListProps) {
  const defaultCategory = categories[0]?.id ?? "economy";
  const [category, setCategory] = useState(defaultCategory);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);

  const [itemsByCategory, setItemsByCategory] = useState<Record<string, QuestionItem[]>>(
    () => ({ ...initialQuestionsByCategory })
  );
  const [hasMoreByCategory, setHasMoreByCategory] = useState<Record<string, boolean>>(() => {
    const r: Record<string, boolean> = {};
    for (const c of categories) r[c.id] = true;
    return r;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [shuffledByCategory, setShuffledByCategory] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  useEffect(() => {
    if (!shuffleEnabled || shuffledByCategory[category]) return;
    const list = itemsByCategory[category] ?? [];
    if (list.length === 0) return;
    setItemsByCategory((prev) => ({ ...prev, [category]: shuffle(list) }));
    setShuffledByCategory((prev) => ({ ...prev, [category]: true }));
  }, [shuffleEnabled, category, shuffledByCategory, itemsByCategory]);

  const itemsForCurrent = itemsByCategory[category] ?? [];

  const loadMoreQuestions = useCallback(
    async (cat: string) => {
      if (loadingMore) return;
      const current = itemsByCategory[cat] ?? [];
      const offset = current.length;
      setLoadingMore(true);
      let query = supabase
        .from("quiz_questions")
        .select(
          `
          *,
          quizzes!inner(id, title, category, difficulty)
        `
        )
        .eq("quizzes.daily_arena", false)
        .or(`category.eq.${cat},quizzes.category.eq.${cat}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (excludedQuestionIds.length > 0) {
        query = query.not("id", "in", `(${excludedQuestionIds.join(",")})`);
      }
      const { data: rows } = await query;
      setLoadingMore(false);
      const next: QuestionItem[] = (rows ?? []).map((row: Record<string, unknown>) => {
        const quiz = row.quizzes as { id: string; title: string; category: string; difficulty: number } | null;
        const { quizzes: _quizzes, ...qq } = row;
        return { ...qq, quiz_title: quiz?.title } as QuestionItem;
      });
      setHasMoreByCategory((prev) => ({ ...prev, [cat]: next.length >= PAGE_SIZE }));
      setItemsByCategory((prev) => ({
        ...prev,
        [cat]: [...(prev[cat] ?? []), ...next],
      }));
    },
    [loadingMore, itemsByCategory, supabase, excludedQuestionIds]
  );

  const handleNeedMore = useCallback(() => {
    if (hasMoreByCategory[category]) {
      loadMoreQuestions(category);
    }
  }, [category, hasMoreByCategory, loadMoreQuestions]);

  const hasMore = hasMoreByCategory[category];

  return (
    <Tabs value={category} onValueChange={setCategory}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <TabsList className="grid grid-cols-5 flex-1">
          {categories.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <label className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground whitespace-nowrap">
          <input
            type="checkbox"
            checked={shuffleEnabled}
            onChange={(e) => setShuffleEnabled(e.target.checked)}
            className="rounded border-input"
          />
          순서 섞기
        </label>
      </div>
      <TabsContent value={category}>
        {itemsForCurrent.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            아직 이 카테고리의 퀴즈가 없어요. 다른 카테고리를 눌러 보세요.
          </p>
        ) : (
          <ShortsSwiper
            items={itemsForCurrent}
            categoryLabel={CATEGORIES.find((c) => c.id === category)?.label ?? category}
            onNeedMore={handleNeedMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
