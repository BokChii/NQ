import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_ARENA_BASE_XP = 30;
const DAILY_ARENA_XP_PER_CORRECT = 10;
const SHORTS_BASE_XP = 2;
const SHORTS_XP_PER_CORRECT = 5;
const SHORTS_DAILY_CAP = 200;
const STREAK_BONUS_MAX = 1.5;

function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function nextLevelXpRequired(level: number): number {
  return 50 * level * level;
}

function rankFromLevel(level: number): { name: string; color: string } {
  if (level <= 5) return { name: "옵저버", color: "#94A3B8" };
  if (level <= 15) return { name: "큐레이터", color: "#CBD5E1" };
  if (level <= 30) return { name: "팩트체커", color: "#60A5FA" };
  if (level <= 50) return { name: "인사이더", color: "#FACC15" };
  if (level <= 80) return { name: "아키텍트", color: "#10B981" };
  if (level <= 99) return { name: "오라클", color: "#F472B6" };
  return { name: "언노운", color: "#A855F7" };
}

function todayUtc(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured: SUPABASE_ANON_KEY required for JWT verification" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ code: 401, message: "Invalid JWT" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { mode, quizId, questionId, selectedIndex: rawSelectedIndex, score, total } = body as {
      mode: "daily_arena" | "category_shorts";
      quizId: string;
      questionId?: string;
      selectedIndex?: number | string;
      score?: number;
      total?: number;
    };
    const selectedIndex = typeof rawSelectedIndex === "number" ? rawSelectedIndex : Number(rawSelectedIndex);
    const isShortsSingle = mode === "category_shorts" && questionId != null && Number.isInteger(selectedIndex) && selectedIndex >= 0;
    let resolvedScore = score;
    let resolvedTotal = total;
    if (isShortsSingle) {
      resolvedScore = undefined;
      resolvedTotal = undefined;
    } else if (typeof score !== "number" || typeof total !== "number") {
      return new Response(JSON.stringify({ error: "Bad request: mode, quizId, score, total required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!quizId || !mode) {
      return new Response(JSON.stringify({ error: "Bad request: mode, quizId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode !== "daily_arena" && mode !== "category_shorts") {
      return new Response(JSON.stringify({ error: "Bad request: mode must be daily_arena or category_shorts" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "category_shorts" && !isShortsSingle && (typeof score !== "number" || typeof total !== "number")) {
      return new Response(JSON.stringify({ error: "Bad request: category_shorts requires score,total or questionId,selectedIndex" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = todayUtc();
    const yesterday = yesterdayUtc();

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, level, streak, last_played_at, nq, rank_name")
      .eq("id", userId)
      .single();

    const prevXp = Number(profile?.xp) ?? 0;
    const prevLevel = Number(profile?.level) ?? 1;
    const prevRankName = (profile?.rank_name as string) ?? "옵저버";
    const lastPlayed = (profile?.last_played_at as string) ?? null;

    let xpGained = 0;
    let newStreak = 1;
    let newLastPlayedAt: string | null = today;
    let nqEarned: number | null = null;

    if (mode === "daily_arena") {
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("difficulty, daily_arena")
        .eq("id", quizId)
        .single();
      if (!quiz?.daily_arena) {
        return new Response(JSON.stringify({ error: "Not a daily arena quiz" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existing } = await supabase
        .from("user_daily_arena")
        .select("id")
        .eq("user_id", userId)
        .eq("quiz_id", quizId)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "Already submitted today's arena" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prevStreak = Number(profile?.streak) ?? 0;
      if (lastPlayed === yesterday) {
        newStreak = prevStreak + 1;
      } else if (lastPlayed !== today) {
        newStreak = 1;
      }
      const baseXp = DAILY_ARENA_BASE_XP + DAILY_ARENA_XP_PER_CORRECT * score;
      const streakMultiplier = Math.min(1 + newStreak * 0.05, STREAK_BONUS_MAX);
      xpGained = Math.floor(baseXp * streakMultiplier);
      const difficulty = Number(quiz?.difficulty ?? 1);
      const correctRate = total ? score / total : 0;
      nqEarned = Math.round((correctRate * difficulty + Math.log(newStreak + 1)) * 100) / 100;

      const { error: insertErr } = await supabase.from("user_daily_arena").insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total,
        nq_earned: nqEarned,
      });
      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (isShortsSingle) {
        const { data: question } = await supabase
          .from("quiz_questions")
          .select("correct_index")
          .eq("id", questionId)
          .eq("quiz_id", quizId)
          .single();
        if (!question) {
          return new Response(JSON.stringify({ error: "Question not found" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const correctIndex = Number(question.correct_index);
        const isCorrect = selectedIndex === correctIndex;
        const { data: existingAnswer } = await supabase
          .from("user_answers")
          .select("id")
          .eq("user_id", userId)
          .eq("question_id", questionId)
          .maybeSingle();
        if (!existingAnswer) {
          const { error: insertAnswerErr } = await supabase.from("user_answers").insert({
            user_id: userId,
            quiz_id: quizId,
            question_id: questionId,
            selected_index: selectedIndex,
            is_correct: isCorrect,
          });
          if (insertAnswerErr) {
            return new Response(JSON.stringify({ error: insertAnswerErr.message }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        resolvedScore = isCorrect ? 1 : 0;
        resolvedTotal = 1;
      }
      const scoreVal = Number(resolvedScore ?? score) || 0;
      const runXp = SHORTS_BASE_XP + SHORTS_XP_PER_CORRECT * scoreVal;
      const { data: row } = await supabase
        .from("user_daily_shorts_xp")
        .select("xp_gained")
        .eq("user_id", userId)
        .eq("play_date", today)
        .maybeSingle();
      const todayShortsXp = Number(row?.xp_gained) ?? 0;
      const remaining = Math.max(0, SHORTS_DAILY_CAP - todayShortsXp);
      xpGained = Math.min(runXp, remaining);
      newLastPlayedAt = null;

      const newTodayShorts = todayShortsXp + xpGained;
      const safeXpGained = Number.isFinite(newTodayShorts) ? Math.max(0, Math.floor(newTodayShorts)) : 0;
      const { error: upsertErr } = await supabase.from("user_daily_shorts_xp").upsert(
        { user_id: userId, play_date: today, xp_gained: safeXpGained },
        { onConflict: "user_id,play_date" }
      );
      if (upsertErr) {
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const totalXp = prevXp + xpGained;
    const currentLevel = levelFromXp(totalXp);
    const { name: rankName, color: rankColor } = rankFromLevel(currentLevel);

    const updatePayload: Record<string, unknown> = {
      xp: totalXp,
      level: currentLevel,
      rank_name: rankName,
      rank_color: rankColor,
    };
    if (mode === "daily_arena") {
      updatePayload.streak = newStreak;
      updatePayload.last_played_at = newLastPlayedAt;
      const prevNq = Number(profile?.nq) ?? 0;
      updatePayload.nq = Math.round((prevNq + (nqEarned ?? 0)) * 100) / 100;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isLevelup = currentLevel > prevLevel;
    const isRankup = rankName !== prevRankName;

    const res: Record<string, unknown> = {
      ok: true,
      xp_gained: xpGained,
      total_xp: totalXp,
      current_level: currentLevel,
      rank_name: rankName,
      is_levelup_moment: isLevelup,
      is_rankup_moment: isRankup,
      next_level_xp_required: nextLevelXpRequired(currentLevel),
    };
    if (nqEarned != null) res.nq_earned = nqEarned;

    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
