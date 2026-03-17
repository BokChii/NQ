"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { QuizQuestion } from "@/lib/supabase/types";

type SavedItem = QuizQuestion & { quiz_title?: string; category?: string };

type Props = { items: SavedItem[] };

export function SavedShortsList({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const toast = useToast();
  const supabase = createClient();

  const remove = useCallback(
    async (questionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("user_saved_shorts").delete().eq("user_id", user.id).eq("question_id", questionId);
      if (error) {
        toast.error("저장 해제에 실패했어요.");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== questionId));
      toast.success("저장 목록에서 제거했어요.");
    },
    [supabase, toast]
  );

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.quiz_title ?? item.category ?? "퀴즈"}</p>
                <p className="text-sm font-medium leading-relaxed">{item.question}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 px-2 text-muted-foreground"
                onClick={() => remove(item.id)}
              >
                저장 해제
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href={`/shorts/share/${item.id}`}>
              <Button variant="outline" size="sm">
                다시 풀기
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shorts/share/${item.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("링크가 복사되었어요.");
                } catch {
                  toast.error("복사에 실패했어요.");
                }
              }}
            >
              링크 복사
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
