"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShortsSwiper } from "@/components/quiz/shorts-swiper";
import { createClient } from "@/lib/supabase/client";
import type { Quiz } from "@/lib/supabase/types";
import type { QuizQuestion } from "@/lib/supabase/types";

const CATEGORIES = [
  { id: "economy", label: "경제" },
  { id: "it", label: "IT" },
  { id: "sports", label: "스포츠" },
  { id: "politics", label: "정치" },
  { id: "culture", label: "문화" },
];

const PAGE_SIZE = 10;
type QuizMeta = Pick<Quiz, "id" | "title" | "category" | "difficulty"> & { created_at?: string };

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
  initialQuizzes: QuizMeta[];
  categories: { id: string; label: string }[];
};

export function ShortsList({ initialQuizzes, categories }: ShortsListProps) {
  const defaultCategory = categories[0]?.id ?? "economy";
  const [category, setCategory] = useState(defaultCategory);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);

  const [quizzesByCategory, setQuizzesByCategory] = useState<Record<string, QuizMeta[]>>(() => {
    const byCat: Record<string, QuizMeta[]> = {};
    for (const c of categories) byCat[c.id] = [];
    for (const q of initialQuizzes) {
      const cat = q.category;
      if (byCat[cat]) byCat[cat].push(q);
    }
    return byCat;
  });

  const [hasMoreByCategory, setHasMoreByCategory] = useState<Record<string, boolean>>(() => {
    const r: Record<string, boolean> = {};
    for (const c of categories) r[c.id] = true;
    return r;
  });

  const [loadingMore, setLoadingMore] = useState(false);
  const [shuffledByCategory, setShuffledByCategory] = useState<Record<string, boolean>>({});

  const [flatItemsByCategory, setFlatItemsByCategory] = useState<Record<string, QuestionItem[]>>({});
  const [expandedCountByCategory, setExpandedCountByCategory] = useState<Record<string, number>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!shuffleEnabled || shuffledByCategory[category]) return;
    const list = quizzesByCategory[category] ?? [];
    if (list.length === 0) return;
    setQuizzesByCategory((prev) => ({ ...prev, [category]: shuffle(list) }));
    setShuffledByCategory((prev) => ({ ...prev, [category]: true }));
    setFlatItemsByCategory((prev) => ({ ...prev, [category]: [] }));
    setExpandedCountByCategory((prev) => ({ ...prev, [category]: 0 }));
  }, [shuffleEnabled, category, shuffledByCategory, quizzesByCategory]);

  const quizzesForCurrent = quizzesByCategory[category] ?? [];
  const flatItemsForCurrent = flatItemsByCategory[category] ?? [];
  const expandedCount = expandedCountByCategory[category] ?? 0;

  const expandNextQuizzes = useCallback(
    async (cat: string) => {
      const quizzes = quizzesByCategory[cat] ?? [];
      const expanded = expandedCountByCategory[cat] ?? 0;
      const nextStart = expanded;
      const nextEnd = Math.min(nextStart + PAGE_SIZE, quizzes.length);
      if (nextStart >= nextEnd) return;
      const quizSlice = quizzes.slice(nextStart, nextEnd);
      const quizIds = quizSlice.map((q) => q.id);
      const quizTitleById = Object.fromEntries(quizSlice.map((q) => [q.id, q.title]));
      setLoadingQuestions(true);
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("*")
        .in("quiz_id", quizIds)
        .order("sort_order");
      setLoadingQuestions(false);
      const list = (questions ?? []) as QuizQuestion[];
      const ordered = list.slice().sort((a, b) => {
        const ai = quizIds.indexOf(a.quiz_id);
        const bi = quizIds.indexOf(b.quiz_id);
        return ai !== bi ? ai - bi : a.sort_order - b.sort_order;
      });
      const items: QuestionItem[] = ordered.map((q) => ({
        ...q,
        quiz_title: quizTitleById[q.quiz_id],
      }));
      setFlatItemsByCategory((prev) => ({
        ...prev,
        [cat]: [...(prev[cat] ?? []), ...items],
      }));
      setExpandedCountByCategory((prev) => ({ ...prev, [cat]: nextEnd }));
    },
    [quizzesByCategory, expandedCountByCategory, supabase]
  );

  useEffect(() => {
    if (loadingQuestions || loadingMore) return;
    const cat = category;
    const quizzes = quizzesByCategory[cat] ?? [];
    const flat = flatItemsByCategory[cat] ?? [];
    const expanded = expandedCountByCategory[cat] ?? 0;
    if (quizzes.length === 0) return;
    if (flat.length === 0 && expanded === 0) {
      expandNextQuizzes(cat);
    }
  }, [category, quizzesByCategory, flatItemsByCategory, expandedCountByCategory, loadingQuestions, loadingMore, expandNextQuizzes]);

  const loadMoreQuizzes = useCallback(
    async (cat: string) => {
      if (loadingMore) return;
      const current = quizzesByCategory[cat] ?? [];
      setLoadingMore(true);
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, category, difficulty, created_at")
        .eq("daily_arena", false)
        .eq("category", cat)
        .order("created_at", { ascending: false })
        .range(current.length, current.length + PAGE_SIZE - 1);
      setLoadingMore(false);
      const next = (data ?? []) as QuizMeta[];
      setHasMoreByCategory((prev) => ({ ...prev, [cat]: next.length >= PAGE_SIZE }));
      setQuizzesByCategory((prev) => ({
        ...prev,
        [cat]: [...(prev[cat] ?? []), ...next],
      }));
    },
    [loadingMore, quizzesByCategory, supabase]
  );

  const handleNeedMore = useCallback(() => {
    const quizzes = quizzesByCategory[category] ?? [];
    const expanded = expandedCountByCategory[category] ?? 0;
    if (expanded < quizzes.length) {
      expandNextQuizzes(category);
    } else if (hasMoreByCategory[category]) {
      loadMoreQuizzes(category);
    }
  }, [category, quizzesByCategory, expandedCountByCategory, hasMoreByCategory, expandNextQuizzes, loadMoreQuizzes]);

  const hasMore = expandedCount < quizzesForCurrent.length || hasMoreByCategory[category];

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
        {quizzesForCurrent.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            아직 이 카테고리의 퀴즈가 없습니다.
          </p>
        ) : flatItemsForCurrent.length === 0 && loadingQuestions ? (
          <p className="text-muted-foreground text-sm text-center py-8">문항 불러오는 중...</p>
        ) : (
          <ShortsSwiper
            items={flatItemsForCurrent}
            categoryLabel={CATEGORIES.find((c) => c.id === category)?.label ?? category}
            onNeedMore={handleNeedMore}
            hasMore={hasMore}
            loadingMore={loadingQuestions || loadingMore}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
