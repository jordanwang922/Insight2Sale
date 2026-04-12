export function toPercent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
