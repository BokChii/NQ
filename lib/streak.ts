/**
 * 연속 참여는 오늘 또는 어제 참여했을 때만 유효하게 표시.
 * 그 외(참여 안 했거나 하루 이상 빠짐)는 0으로 표시.
 */
export function getDisplayStreak(streak: number, lastPlayedAt: string | null): number {
  if (streak == null || streak === 0) return 0;
  if (!lastPlayedAt) return 0;
  const datePart = String(lastPlayedAt).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10);
  if (datePart === today || datePart === yesterday) return streak;
  return 0;
}
