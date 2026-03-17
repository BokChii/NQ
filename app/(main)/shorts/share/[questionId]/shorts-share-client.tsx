"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/supabase/types";

type QuestionWithTitle = QuizQuestion & { quiz_title?: string };

type Props = { question: QuestionWithTitle };

export function ShortsShareClient({ question }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const supabase = createClient();

  const options = (question.options as string[]) ?? [];
  const explanation = question.explanation ?? null;
  const sourceUrl = question.source_url ?? null;
  const sourceDate = question.source_date ?? null;

  function formatSourceDate(dateStr: string): string {
    const [y, m, d] = dateStr.slice(0, 10).split("-");
    if (!y || !m || !d) return dateStr;
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  }

  const handleSelect = useCallback(
    async (optionIndex: number) => {
      if (selected !== null) return;
      setSelected(optionIndex);
      setShowResult(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-quiz`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            mode: "category_shorts",
            quizId: question.quiz_id,
            questionId: question.id,
            selectedIndex: Number(optionIndex),
          }),
        });
      }
    },
    [question, selected, supabase.auth]
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <p className="text-sm text-muted-foreground">{question.quiz_title ?? "퀴즈"}</p>
        <p className="text-base font-medium leading-relaxed">{question.question}</p>
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
                : i === question.correct_index
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
      {showResult && (
        <div className="px-6 pb-6 space-y-3">
          <p
            className={`text-sm font-medium ${
              selected === question.correct_index ? "text-success" : "text-destructive"
            }`}
          >
            {selected === question.correct_index ? "정답!" : "오답"}
          </p>
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
        </div>
      )}
    </Card>
  );
}
