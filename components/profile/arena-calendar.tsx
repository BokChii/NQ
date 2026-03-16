"use client";

import { useRef, useEffect } from "react";

type Participation = { score: number; total: number };

type ArenaCalendarProps = {
  participations: Record<string, Participation>;
};

const CELL_SIZE = 10;
const TOTAL_DAYS = 365;
const COLS = 53;
const ROWS = 7;

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}년 ${m}월 ${day}일`;
}

export function ArenaCalendar({ participations }: ArenaCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const startOfRange = new Date(Date.now() - (TOTAL_DAYS - 1) * 86400 * 1000);
  const startOfRangeStr = startOfRange.toISOString().slice(0, 10);
  const startSunday = new Date(startOfRange);
  startSunday.setUTCDate(startOfRange.getUTCDate() - startOfRange.getUTCDay());

  const cells: { dateStr: string; inRange: boolean; data?: Participation }[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const dayOffset = col * 7 + row;
    const d = new Date(startSunday);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const inRange = dateStr >= startOfRangeStr && dateStr <= today;
    const data = participations[dateStr];
    cells.push({ dateStr, inRange, data });
  }

  return (
    <div
      ref={scrollRef}
      className="arena-calendar-scroll overflow-x-auto overflow-y-hidden"
    >
      <div
        className="inline-grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
        }}
      >
        {cells.map((cell, i) => {
          const fill = !cell.inRange
            ? "bg-muted/30"
            : cell.data
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-muted/60 hover:bg-muted";
          const title = cell.inRange
            ? cell.data
              ? `${formatDateLabel(cell.dateStr)} · ${cell.data.score}/${cell.data.total}점`
              : formatDateLabel(cell.dateStr)
            : "";
          return (
            <div
              key={i}
              className={`rounded-[2px] min-w-[10px] min-h-[10px] ${fill} transition-colors cursor-default`}
              title={title}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          );
        })}
      </div>
    </div>
  );
}
