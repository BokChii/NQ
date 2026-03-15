"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ArenaResultPage() {
  const searchParams = useSearchParams();
  const score = Number(searchParams.get("score")) || 0;
  const total = Number(searchParams.get("total")) || 10;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const rankup = searchParams.get("rankup") === "1";
  const levelup = searchParams.get("levelup") === "1";
  const rankName = searchParams.get("rank_name") ?? "";
  const xpGained = Number(searchParams.get("xp_gained")) || 0;
  const totalXp = Number(searchParams.get("total_xp")) || 0;
  const currentLevel = Number(searchParams.get("current_level")) || 1;
  const nextXp = Number(searchParams.get("next_xp")) || 50;
  const [rankupModalOpen, setRankupModalOpen] = useState(false);
  const [levelupModalOpen, setLevelupModalOpen] = useState(false);

  useEffect(() => {
    if (rankup) {
      setRankupModalOpen(true);
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#1E40AF", "#60A5FA", "#FACC15"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#1E40AF", "#60A5FA", "#FACC15"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [rankup]);

  useEffect(() => {
    if (levelup && !rankup) {
      setLevelupModalOpen(true);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }
  }, [levelup, rankup]);

  return (
    <div className="p-4 flex flex-col items-center min-h-[60vh] justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-center mb-6"
      >
        <p className="text-6xl font-bold text-primary mb-2">{pct}%</p>
        <p className="text-muted-foreground">
          {score} / {total} 정답
        </p>
        {xpGained > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            +{xpGained} XP · Lv.{currentLevel} · 다음 레벨까지 {nextXp - totalXp} XP
          </p>
        )}
      </motion.div>
      <Card className="w-full max-w-[320px]">
        <CardContent className="pt-6 flex flex-col gap-3">
          <Link href="/arena/ranking">
            <Button className="w-full">랭킹 보기</Button>
          </Link>
          <Link href="/arena">
            <Button variant="outline" className="w-full">
              아레나로 돌아가기
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Dialog open={rankupModalOpen} onOpenChange={setRankupModalOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-center text-primary">등급 상승!</DialogTitle>
          </DialogHeader>
          <p className="text-center text-lg font-semibold" style={{ color: "#1E40AF" }}>
            {rankName}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            새로운 등급에 도달했습니다.
          </p>
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
          <p className="text-center text-lg font-semibold">Lv.{currentLevel}</p>
          <p className="text-center text-sm text-muted-foreground">
            다음 레벨까지 {nextXp - totalXp} XP
          </p>
          <Button onClick={() => setLevelupModalOpen(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
