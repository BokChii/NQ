"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [levelupModalOpen, setLevelupModalOpen] = useState(false);
  const [rankupModalOpen, setRankupModalOpen] = useState(false);
  const [levelupPayload, setLevelupPayload] = useState<LevelUpPayload | null>(null);
  const [rankupPayload, setRankupPayload] = useState<RankUpPayload | null>(null);
  const consecutiveCorrect = useRef(0);
  const supabase = createClient();

  const currentQ = items[currentIndex];
  const options = (currentQ?.options as string[]) ?? [];
  const explanation = currentQ?.explanation ?? null;
  const sourceUrl = (currentQ as { source_url?: string | null })?.source_url ?? null;

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

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        아직 문항이 없습니다.
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
              <p className="text-sm text-muted-foreground">
                {categoryLabel}
              </p>
              <p className="text-base font-medium leading-relaxed">{currentQ.question}</p>
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
                        ? "border-green-500 bg-green-500/10"
                        : selected === i
                          ? "border-red-500 bg-red-500/10"
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
              <p className={`text-sm font-medium ${selected === currentQ.correct_index ? "text-green-600" : "text-red-600"}`}>
                {selected === currentQ.correct_index ? "정답!" : "오답"}
              </p>
              {selected === currentQ.correct_index && consecutiveCorrect.current >= 2 && (
                <p className="text-xs text-green-600/90">{consecutiveCorrect.current}연속 정답!</p>
              )}
              {explanation && (
                <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">{explanation}</p>
              )}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline block"
                >
                  관련 기사 보기
                </a>
              )}
              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  다음
                </Button>
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
