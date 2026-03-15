"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";

const W = 1080;
const H = 1920;
const SCALE = 0.28;

type ShareCardProps = {
  displayName: string;
  nq: string;
  level: number;
  streak: number;
};

const CardContent = React.forwardRef<
  HTMLDivElement,
  ShareCardProps & { className?: string }
>(function CardContent(
  { displayName, nq, level, streak, className = "" },
  ref
) {
  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center p-16 text-center bg-[#0F172A] ${className}`}
      style={{ width: W, height: H }}
    >
      <div className="text-[#1E40AF] font-bold text-6xl tracking-tight mb-4">
        NQ
      </div>
      <div className="text-white/90 text-4xl font-semibold mb-12">
        News Quotient
      </div>
      <div className="text-white/70 text-3xl mb-6">{displayName}</div>
      <div className="flex items-center gap-12 text-white text-5xl font-bold mb-16">
        <span>nq {nq}</span>
        <span>Lv.{level}</span>
        <span>🔥 {streak}</span>
      </div>
      <div className="text-white/50 text-2xl">뉴스 문해력을 증명하다</div>
    </div>
  );
});

export function ShareCard({ displayName, nq, level, streak }: ShareCardProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(captureRef.current, {
      scale: 1,
      backgroundColor: "#0F172A",
      width: W,
      height: H,
    });
    const link = document.createElement("a");
    link.download = `nq-${displayName}-${nq}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{ width: W * SCALE, height: H * SCALE }}
      >
        <div
          style={{
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <CardContent
            displayName={displayName}
            nq={nq}
            level={level}
            streak={streak}
          />
        </div>
      </div>
      <div className="absolute -left-[9999px] top-0" aria-hidden>
        <CardContent
          ref={captureRef}
          displayName={displayName}
          nq={nq}
          level={level}
          streak={streak}
        />
      </div>
      <Button onClick={handleDownload} className="w-full max-w-[280px]">
        이미지 저장
      </Button>
    </div>
  );
}
