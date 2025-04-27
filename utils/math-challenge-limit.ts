// Utilidad para limitar la cantidad de retos matemáticos resueltos por usuario cada 24h
// Se utiliza localStorage para persistencia sencilla

const LIMIT = 3;
const REWARD = 100;
const PERIOD_MS = 24 * 60 * 60 * 1000; // 24 horas
const STORAGE_KEY = 'math_challenge_attempts';

export interface MathChallengeLimit {
  count: number;
  resetAt: number;
}

export function getMathChallengeLimit(): MathChallengeLimit {
  if (typeof window === 'undefined') return { count: 0, resetAt: Date.now() + PERIOD_MS };
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { count: 0, resetAt: Date.now() + PERIOD_MS };
  }
  try {
    const parsed = JSON.parse(data);
    if (parsed.resetAt < Date.now()) {
      // Reset attempts
      return { count: 0, resetAt: Date.now() + PERIOD_MS };
    }
    return parsed;
  } catch {
    return { count: 0, resetAt: Date.now() + PERIOD_MS };
  }
}

export function incrementMathChallengeCount() {
  if (typeof window === 'undefined') return;
  const current = getMathChallengeLimit();
  const now = Date.now();
  let count = current.count;
  let resetAt = current.resetAt;
  if (resetAt < now) {
    count = 0;
    resetAt = now + PERIOD_MS;
  }
  count += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, resetAt }));
}

export function canAttemptMathChallenge(): boolean {
  const { count, resetAt } = getMathChallengeLimit();
  return count < LIMIT;
}

export function getMathChallengeTimeLeft(): number {
  const { resetAt } = getMathChallengeLimit();
  return Math.max(0, resetAt - Date.now());
}

export { LIMIT as MATH_CHALLENGE_LIMIT, REWARD as MATH_CHALLENGE_REWARD };
