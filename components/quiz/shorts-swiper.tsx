"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { QuestionItem } from "@/app/(main)/shorts/shorts-list";

type ShortsSwiperProps = {
  items: QuestionItem[];
  categoryLabel: string;
  onNeedMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

type LevelUpPayload = {
  currentLevel: number;
  nextXpRequired: number;
  totalXp: number;
};
type RankUpPayload = { rankName: string };

export function ShortsSwiper({ items, categoryLabel, onNeedMore, hasMore = true, loadingMore = false }: ShortsSwiperProps) {
  const needMoreFired = useRef(false);
  const toast = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [levelupModalOpen, setLevelupModalOpen] = useState(false);
  const [rankupModalOpen, setRankupModalOpen] = useState(false);
  const [levelupPayload, setLevelupPayload] = useState<LevelUpPayload | null>(null);
  const [rankupPayload, setRankupPayload] = useState<RankUpPayload | null>(null);
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(() => new Set());
  const consecutiveCorrect = useRef(0);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_saved_shorts").select("question_id").eq("user_id", user.id);
      setSavedQuestionIds(new Set((data ?? []).map((r) => r.question_id)));
    })();
  }, [supabase]);

  const currentQ = items[currentIndex];
  const options = (currentQ?.options as string[]) ?? [];
  const explanation = currentQ?.explanation ?? null;
  const sourceUrl = (currentQ as { source_url?: string | null })?.source_url ?? null;
  const sourceDate = (currentQ as { source_date?: string | null })?.source_date ?? null;

  function formatSourceDate(dateStr: string): string {
    const [y, m, d] = dateStr.slice(0, 10).split("-");
    if (!y || !m || !d) return dateStr;
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  }

  useEffect(() => {
    if (currentIndex >= items.length - 2 && hasMore && !loadingMore && onNeedMore && !needMoreFired.current) {
      needMoreFired.current = true;
      onNeedMore();
    }
  }, [currentIndex, items.length, hasMore, loadingMore, onNeedMore]);

  useEffect(() => {
    needMoreFired.current = false;
  }, [items.length]);

  const submitShortsSingle = useCallback(
    async (quizId: string, questionId: string, selectedIndex: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-quiz`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "category_shorts",
          quizId,
          questionId,
          selectedIndex: Number(selectedIndex),
        }),
      });
      if (!res.ok) return;
      try {
        const data = await res.json();
        if (data.is_rankup_moment && data.rank_name) {
          setRankupPayload({ rankName: data.rank_name });
          setRankupModalOpen(true);
          const duration = 1500;
          const end = Date.now() + duration;
          const frame = () => {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#1E40AF", "#60A5FA", "#FACC15"] });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#1E40AF", "#60A5FA", "#FACC15"] });
            if (Date.now() < end) requestAnimationFrame(frame);
          };
          frame();
        } else if (data.is_levelup_moment) {
          setLevelupPayload({
            currentLevel: Number(data.current_level) ?? 1,
            nextXpRequired: Number(data.next_level_xp_required) ?? 50,
            totalXp: Number(data.total_xp) ?? 0,
          });
          setLevelupModalOpen(true);
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
        }
      } catch {
        // ignore parse error
      }
    },
    [supabase.auth]
  );

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (selected !== null || !currentQ) return;
      setSelected(optionIndex);
      setShowResult(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
      const correct = optionIndex === currentQ.correct_index;
      if (correct) {
        consecutiveCorrect.current += 1;
      } else {
        consecutiveCorrect.current = 0;
      }
      submitShortsSingle(currentQ.quiz_id, currentQ.id, optionIndex);
    },
    [currentQ, selected, submitShortsSingle]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  }, [currentIndex, items.length]);

  const toggleSave = useCallback(
    async (questionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인 후 저장할 수 있어요.");
        return;
      }
      const isSaved = savedQuestionIds.has(questionId);
      if (isSaved) {
        const { error } = await supabase.from("user_saved_shorts").delete().eq("user_id", user.id).eq("question_id", questionId);
        if (error) {
          toast.error("저장 해제에 실패했어요.");
          return;
        }
        setSavedQuestionIds((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
        toast.success("저장 목록에서 제거했어요.");
      } else {
        const { error } = await supabase.from("user_saved_shorts").insert({ user_id: user.id, question_id: questionId });
        if (error) {
          toast.error("저장에 실패했어요.");
          return;
        }
        setSavedQuestionIds((prev) => new Set(prev).add(questionId));
        toast.success("저장했어요.");
      }
    },
    [savedQuestionIds, supabase, toast]
  );

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        아직 풀 수 있는 문항이 없어요. 다른 카테고리를 확인해 보세요.
      </p>
    );
  }

  if (!currentQ) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {categoryLabel}
                  </p>
                  <p className="text-base font-medium leading-relaxed">{currentQ.question}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 px-2 text-muted-foreground"
                  onClick={() => toggleSave(currentQ.id)}
                  title={savedQuestionIds.has(currentQ.id) ? "저장 해제" : "저장"}
                >
                  {savedQuestionIds.has(currentQ.id) ? "★" : "☆"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selected === null
                      ? "border-border hover:bg-muted/50"
                      : i === currentQ.correct_index
                        ? "border-success bg-success/10"
                        : selected === i
                          ? "border-destructive bg-destructive/10"
                          : "border-border opacity-70"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </CardContent>
          </Card>
          {showResult && (
            <div className="mt-4 space-y-3">
              <p className={`text-sm font-medium ${selected === currentQ.correct_index ? "text-success" : "text-destructive"}`}>
                {selected === currentQ.correct_index ? "정답!" : "오답"}
              </p>
              {selected === currentQ.correct_index && consecutiveCorrect.current >= 2 && (
                <p className="text-xs text-success/90">{consecutiveCorrect.current}연속 정답!</p>
              )}
              {(explanation || sourceUrl || sourceDate) && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
                  {explanation && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">해설</p>
                      <p className="text-sm text-foreground leading-relaxed">{explanation}</p>
                    </div>
                  )}
                  {(sourceUrl || sourceDate) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {sourceDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatSourceDate(sourceDate)}
                          {" · "}
                        </span>
                      )}
                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({ variant: "outline", size: "sm", className: "w-full sm:w-auto" })}
                        >
                          기사 보러가기
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSave(currentQ.id)}
                  >
                    {savedQuestionIds.has(currentQ.id) ? "저장됨" : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shorts/share/${currentQ.id}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(5);
                        toast.success("링크가 복사되었어요.");
                      } catch {
                        toast.error("복사에 실패했어요.");
                      }
                    }}
                  >
                    링크 복사
                  </Button>
                </div>
                <Button onClick={handleNext}>다음</Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {loadingMore && (
        <p className="text-xs text-muted-foreground text-center py-2">다음 문항 불러오는 중...</p>
      )}

      <Dialog open={rankupModalOpen} onOpenChange={setRankupModalOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-center text-primary">등급 상승!</DialogTitle>
          </DialogHeader>
          {rankupPayload && (
            <>
              <p className="text-center text-lg font-semibold" style={{ color: "#1E40AF" }}>
                {rankupPayload.rankName}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                새로운 등급에 도달했습니다.
              </p>
            </>
          )}
          <Button onClick={() => setRankupModalOpen(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={levelupModalOpen} onOpenChange={setLevelupModalOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-center text-primary">레벨 업!</DialogTitle>
          </DialogHeader>
          {levelupPayload && (
            <>
              <p className="text-center text-lg font-semibold">Lv.{levelupPayload.currentLevel}</p>
              <p className="text-center text-sm text-muted-foreground">
                다음 레벨까지 {levelupPayload.nextXpRequired - levelupPayload.totalXp} XP
              </p>
            </>
          )}
          <Button onClick={() => setLevelupModalOpen(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
