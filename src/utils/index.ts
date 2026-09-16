/**
 * Mobile utility helpers placeholder
 */
export const formatAccuracy = (correct: number, total: number = 25): string => {
  if (total === 0) return '0%';
  return `${Math.round((correct / total) * 100)}%`;
};
