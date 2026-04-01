import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarDays, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function ArenaPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: quizToday } = await supabase
    .from("quizzes")
    .select("id, title, difficulty, quiz_date")
    .eq("daily_arena", true)
    .eq("quiz_date", today)
    .maybeSingle();
  let quiz = quizToday ?? null;
  if (!quiz) {
    const { data: quizFallback } = await supabase
      .from("quizzes")
      .select("id, title, difficulty, quiz_date")
      .eq("daily_arena", true)
      .order("quiz_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    quiz = quizFallback ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let alreadyPlayed = false;
  if (user && quiz) {
    const { data: played } = await supabase
      .from("user_daily_arena")
      .select("id")
      .eq("user_id", user.id)
      .eq("quiz_id", quiz.id)
      .eq("play_date", today)
      .maybeSingle();
    alreadyPlayed = !!played;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
          Daily Arena
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">오늘의 아레나</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          매일 10문항. 전체 랭킹에 반영돼요.
        </p>
      </div>
      {!quiz ? (
        <Card variant="elevated" className="border-dashed">
          <CardContent className="space-y-3 pt-8 pb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">오늘의 퀴즈가 아직 준비 중이에요</p>
            <p className="text-xs text-muted-foreground">매일 새벽에 업데이트됩니다. 잠시 후 다시 확인해 주세요.</p>
          </CardContent>
        </Card>
      ) : alreadyPlayed ? (
        <Card variant="elevated">
          <CardHeader className="space-y-1">
            <p className="font-medium leading-snug">{quiz.title}</p>
            <p className="text-xs text-muted-foreground">
              난이도 {Number(quiz.difficulty).toFixed(1)} · {String(quiz.quiz_date)}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">오늘은 이미 참여했어요. 내일 다시 도전해요!</p>
            <Link href="/arena/ranking">
              <Button variant="outlinePrimary" className="w-full">
                랭킹 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Link href={`/arena/play?quizId=${quiz.id}`} className="block transition-transform duration-200 active:scale-[0.99]">
          <Card variant="elevated" className="border-primary/20 ring-1 ring-primary/10">
            <CardHeader className="space-y-1">
              <p className="font-display text-lg font-bold leading-snug">{quiz.title}</p>
              <p className="text-xs text-muted-foreground">
                난이도 {Number(quiz.difficulty).toFixed(1)} · 10문항 · {String(quiz.quiz_date)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent-v text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25">
                시작하기
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
