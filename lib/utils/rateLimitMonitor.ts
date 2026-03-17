/**
 * Rate Limit Monitor
 * Tracks API usage and warns when approaching free tier limits.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 *
 * Free tier limits tracked:
 * - Gemini API: 15 req/min, 1,500 req/day
 * - GitHub API: 60 req/hour (unauthenticated)
 */

// ---------------------------------------------------------------------------
// Gemini rate limit state (module-level, in-memory)
// ---------------------------------------------------------------------------

const GEMINI_LIMIT_PER_MINUTE = 15;
const GEMINI_LIMIT_PER_DAY = 1500;
const GEMINI_WARN_THRESHOLD = 0.8; // warn at 80% usage

let geminiMinuteCount = 0;
let geminiDayCount = 0;
let geminiMinuteWindowStart = Date.now();
let geminiDayWindowStart = Date.now();

// ---------------------------------------------------------------------------
// GitHub rate limit constants
// ---------------------------------------------------------------------------

const GITHUB_LIMIT_PER_HOUR = 60;
const GITHUB_WARN_REMAINING = Math.floor(GITHUB_LIMIT_PER_HOUR * (1 - GEMINI_WARN_THRESHOLD)); // 12

/**
 * Checks and updates in-memory Gemini API request counters.
 * Resets per-minute counter every 60 seconds and per-day counter every 24 hours.
 * Emits console.warn when approaching 80% of either limit.
 * Never throws.
 * Requirements: 10.1, 10.2
 */
export function checkGeminiRateLimit(): void {
  try {
    const now = Date.now();

    // Reset per-minute window if 60 seconds have elapsed
    if (now - geminiMinuteWindowStart >= 60_000) {
      geminiMinuteCount = 0;
      geminiMinuteWindowStart = now;
    }

    // Reset per-day window if 24 hours have elapsed
    if (now - geminiDayWindowStart >= 86_400_000) {
      geminiDayCount = 0;
      geminiDayWindowStart = now;
    }

    geminiMinuteCount++;
    geminiDayCount++;

    const minuteWarnAt = Math.floor(GEMINI_LIMIT_PER_MINUTE * GEMINI_WARN_THRESHOLD); // 12
    const dayWarnAt = Math.floor(GEMINI_LIMIT_PER_DAY * GEMINI_WARN_THRESHOLD);       // 1200

    if (geminiMinuteCount >= minuteWarnAt) {
      console.warn(
        `⚠️ Gemini API: approaching rate limit (${geminiMinuteCount}/${GEMINI_LIMIT_PER_MINUTE} req/min). ` +
        `Consider slowing down requests to avoid hitting the free tier cap.`
      );
    }

    if (geminiDayCount >= dayWarnAt) {
      console.warn(
        `⚠️ Gemini API: approaching daily rate limit (${geminiDayCount}/${GEMINI_LIMIT_PER_DAY} req/day). ` +
        `Consider monitoring usage to avoid exceeding the free tier cap.`
      );
    }
  } catch {
    // Never throw from monitoring code
  }
}

/**
 * Checks GitHub API rate limit headers from a response and warns when remaining < 12 (80% used).
 * @param remaining - Value of the X-RateLimit-Remaining header
 * @param limit - Value of the X-RateLimit-Limit header
 * Never throws.
 * Requirements: 10.3, 10.4
 */
export function checkGitHubRateLimit(remaining: string | null, limit: string | null): void {
  try {
    const remainingNum = remaining !== null ? parseInt(remaining, 10) : null;
    const limitNum = limit !== null ? parseInt(limit, 10) : GITHUB_LIMIT_PER_HOUR;

    if (remainingNum === null || isNaN(remainingNum)) return;
    if (isNaN(limitNum)) return;

    const warnAt = Math.floor(limitNum * (1 - GEMINI_WARN_THRESHOLD)); // 20% remaining = warn

    if (remainingNum < warnAt) {
      console.warn(
        `⚠️ GitHub API: approaching rate limit (${remainingNum}/${limitNum} requests remaining). ` +
        `Resets hourly. Slow down requests to avoid hitting the unauthenticated free tier cap.`
      );
    }
  } catch {
    // Never throw from monitoring code
  }
}

/**
 * Logs the current in-memory Gemini request counts to console.
 * Useful for monitoring and debugging free tier usage.
 * Requirements: 10.5, 10.6
 */
export function logFreeTierStatus(): void {
  try {
    const now = Date.now();
    const minuteElapsed = Math.floor((now - geminiMinuteWindowStart) / 1000);
    const dayElapsed = Math.floor((now - geminiDayWindowStart) / 3600000);

    console.log(
      `[FreeTierStatus] Gemini: ${geminiMinuteCount}/${GEMINI_LIMIT_PER_MINUTE} req/min ` +
      `(window started ${minuteElapsed}s ago) | ` +
      `${geminiDayCount}/${GEMINI_LIMIT_PER_DAY} req/day ` +
      `(window started ${dayElapsed}h ago)`
    );
    console.log(
      `[FreeTierStatus] GitHub warn threshold: < ${GITHUB_WARN_REMAINING} remaining of ${GITHUB_LIMIT_PER_HOUR}/hour`
    );
  } catch {
    // Never throw from monitoring code
  }
}
