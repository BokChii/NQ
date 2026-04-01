"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShortsSwiper } from "@/components/quiz/shorts-swiper";
import { createClient } from "@/lib/supabase/client";
import type { QuizQuestion } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "economy", label: "경제" },
  { id: "it", label: "IT" },
  { id: "sports", label: "스포츠" },
  { id: "politics", label: "정치" },
  { id: "culture", label: "문화" },
];

const CATEGORY_TAB_TRIGGER: Record<string, string> = {
  economy: "aria-selected:!bg-emerald-500/20 aria-selected:!text-emerald-950 aria-selected:shadow-sm",
  it: "aria-selected:!bg-sky-500/20 aria-selected:!text-sky-950 aria-selected:shadow-sm",
  sports: "aria-selected:!bg-orange-500/20 aria-selected:!text-orange-950 aria-selected:shadow-sm",
  politics: "aria-selected:!bg-violet-500/20 aria-selected:!text-violet-950 aria-selected:shadow-sm",
  culture: "aria-selected:!bg-rose-500/20 aria-selected:!text-rose-950 aria-selected:shadow-sm",
};

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="grid h-auto w-full grid-cols-5 gap-0.5 p-1 sm:flex-1">
          {categories.map((c) => (
            <TabsTrigger
              key={c.id}
              value={c.id}
              className={cn(
                "text-[10px] font-semibold leading-tight sm:text-xs",
                CATEGORY_TAB_TRIGGER[c.id] ?? ""
              )}
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">순서 섞기</span>
          <button
            type="button"
            role="switch"
            aria-checked={shuffleEnabled}
            onClick={() => setShuffleEnabled((v) => !v)}
            className={cn(
              "relative h-7 w-11 min-h-[28px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              shuffleEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200",
                shuffleEnabled && "translate-x-[1.125rem]"
              )}
            />
          </button>
        </div>
      </div>
      <TabsContent value={category} className="mt-4">
        {itemsForCurrent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
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
