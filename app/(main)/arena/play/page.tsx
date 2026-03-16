"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuizQuestion } from "@/lib/supabase/types";

export default function ArenaPlayPage() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");
  const supabase = createClient();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number; isCorrect: boolean; timeMs: number }[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!quizId) {
      router.replace("/arena");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order");
      if (error || !data?.length) {
        router.replace("/arena");
        return;
      }
      setQuestions(data as QuizQuestion[]);
      setStartTime(Date.now());
      setLoading(false);
    })();
  }, [quizId, router, supabase]);

  const current = questions[index];
  const options = (current?.options as string[]) || [];

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (selected !== null || !current) return;
      setSelected(optionIndex);
      const correct = optionIndex === current.correct_index;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
      const timeMs = Date.now() - startTime;
      setAnswers((a) => [
        ...a,
        { questionId: current.id, selectedIndex: optionIndex, isCorrect: correct, timeMs },
      ]);
    },
    [current, selected, startTime]
  );

  const handleNext = useCallback(() => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setStartTime(Date.now());
    }
  }, [index, questions.length]);

  const handleFinish = useCallback(async () => {
    if (!quizId || submitting) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      setSubmitting(false);
      return;
    }
    const score = answers.filter((a) => a.isCorrect).length;
    const total = questions.length;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-quiz`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        mode: "daily_arena",
        quizId,
        score,
        total,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      toast.error("제출에 실패했습니다.");
      router.push(`/arena/result?score=${score}&total=${total}&error=1`);
      return;
    }
    toast.success("제출되었습니다.");
    const params = new URLSearchParams({
      score: String(score),
      total: String(total),
      xp_gained: String(data.xp_gained ?? 0),
      total_xp: String(data.total_xp ?? 0),
      current_level: String(data.current_level ?? 1),
      rank_name: data.rank_name ?? "",
      next_xp: String(data.next_level_xp_required ?? 0),
    });
    if (data.is_levelup_moment) params.set("levelup", "1");
    if (data.is_rankup_moment) params.set("rankup", "1");
    router.push(`/arena/result?${params.toString()}`);
    router.refresh();
  }, [quizId, answers, questions.length, submitting, supabase.auth, router, toast]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="p-4 pb-8">
      <div className="text-sm text-muted-foreground mb-2">
        {index + 1} / {questions.length}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <p className="text-base font-medium leading-relaxed">{current.question}</p>
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
                      : i === current.correct_index
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
          {selected !== null && (
            <>
              <p className={`text-sm font-medium mb-2 ${selected === current.correct_index ? "text-green-600" : "text-red-600"}`}>
                {selected === current.correct_index ? "정답!" : "오답"}
              </p>
              {selected === current.correct_index && (() => {
                let run = 0;
                for (let i = answers.length - 1; i >= 0; i--) {
                  if (answers[i].isCorrect) run++; else break;
                }
                return run >= 2 ? <p className="text-xs text-green-600/90 mb-3">{run}연속 정답!</p> : null;
              })()}
              {(current.explanation || current.source_url) && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 mb-4 space-y-3">
                  {current.explanation && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">해설</p>
                      <p className="text-sm text-foreground leading-relaxed">{current.explanation}</p>
                    </div>
                  )}
                  {current.source_url && (
                    <a
                      href={current.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "outline", size: "sm", className: "w-full sm:w-auto" })}
                    >
                      기사 보러가기
                    </a>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                {index < questions.length - 1 ? (
                  <Button onClick={handleNext}>다음</Button>
                ) : (
                  <Button onClick={handleFinish} disabled={submitting}>
                    {submitting ? "제출 중..." : "결과 보기"}
                  </Button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
