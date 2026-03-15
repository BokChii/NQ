import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ArenaPage() {
  const supabase = await createClient();
  // 테스트용: 오늘 날짜 퀴즈가 없으면 가장 최근 Daily Arena 퀴즈를 매일 조회
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
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Daily Arena</h1>
        <p className="text-sm text-muted-foreground mt-1">
          매일 10문항. 전체 랭킹에 반영됩니다.
        </p>
      </div>
      {!quiz ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center text-sm">
              오늘의 퀴즈가 아직 준비되지 않았습니다.
            </p>
          </CardContent>
        </Card>
      ) : alreadyPlayed ? (
        <Card>
          <CardHeader>
            <p className="font-medium">{quiz.title}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              오늘 이미 참여했습니다.
            </p>
            <Link href="/arena/ranking">
              <Button variant="outline" className="w-full">
                랭킹 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Link href={`/arena/play?quizId=${quiz.id}`}>
          <Card className="active:opacity-90 transition-opacity">
            <CardHeader>
              <p className="font-medium">{quiz.title}</p>
              <p className="text-xs text-muted-foreground">
                난이도 {Number(quiz.difficulty).toFixed(1)} · 10문항
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full">시작하기</Button>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
