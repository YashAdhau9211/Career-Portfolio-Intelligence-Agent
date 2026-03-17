import { ImprovementPlan, GitHubProfile, ReasoningTrace, CachedPlan, CachedGitHubProfile } from '../types';

/**
 * Cache Manager Service
 * Manages localStorage-based caching for plans and GitHub profiles
 * Requirements: 6.1, 6.2, 15.5, 18.6
 */

const PLAN_KEY_PREFIX = 'cpia_plan_';
const GITHUB_KEY_PREFIX = 'cpia_github_';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Returns true if localStorage is available (client-side only).
 */
function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Saves an improvement plan to localStorage with a 24-hour TTL.
 * @param plan - The improvement plan to cache
 * @param key - The GitHub username used as the cache key
 * @param reasoningTrace - Optional reasoning trace to store alongside the plan
 * @param jobSearchScore - Optional job search score to store alongside the plan
 * Requirements: 6.1, 6.2
 */
export function savePlan(
  plan: ImprovementPlan,
  key: string,
  reasoningTrace?: ReasoningTrace,
  jobSearchScore?: number
): void {
  if (!isLocalStorageAvailable()) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);

  const cached: CachedPlan = {
    plan,
    reasoningTrace: reasoningTrace ?? { steps: [], generatedAt: now.toISOString() },
    jobSearchScore: jobSearchScore ?? 0,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  try {
    window.localStorage.setItem(`${PLAN_KEY_PREFIX}${key}`, JSON.stringify(cached));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

/**
 * Loads an improvement plan from localStorage, returning null if expired or not found.
 * @param key - The GitHub username used as the cache key
 * Returns: ImprovementPlan or null
 * Requirements: 6.1, 6.2, 18.6
 */
export function loadPlan(key: string): ImprovementPlan | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(`${PLAN_KEY_PREFIX}${key}`);
    if (!raw) return null;

    const cached: CachedPlan = JSON.parse(raw);
    if (new Date() > new Date(cached.expiresAt)) {
      window.localStorage.removeItem(`${PLAN_KEY_PREFIX}${key}`);
      return null;
    }

    return cached.plan;
  } catch {
    return null;
  }
}

/**
 * Saves a GitHub profile to localStorage with a 24-hour TTL.
 * @param profile - The GitHub profile to cache
 * @param username - The GitHub username used as the cache key
 * Requirements: 15.5
 */
export function saveGitHubProfile(profile: GitHubProfile, username: string): void {
  if (!isLocalStorageAvailable()) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);

  const cached: CachedGitHubProfile = {
    profile,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  try {
    window.localStorage.setItem(`${GITHUB_KEY_PREFIX}${username}`, JSON.stringify(cached));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

/**
 * Loads a GitHub profile from localStorage, returning null if expired or not found.
 * @param username - The GitHub username used as the cache key
 * Returns: GitHubProfile or null
 * Requirements: 15.5
 */
export function loadGitHubProfile(username: string): GitHubProfile | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(`${GITHUB_KEY_PREFIX}${username}`);
    if (!raw) return null;

    const cached: CachedGitHubProfile = JSON.parse(raw);
    if (new Date() > new Date(cached.expiresAt)) {
      window.localStorage.removeItem(`${GITHUB_KEY_PREFIX}${username}`);
      return null;
    }

    return cached.profile;
  } catch {
    return null;
  }
}

/**
 * Removes all expired cache entries with the 'cpia_' prefix from localStorage.
 * Requirements: 18.6
 */
export function clearExpired(): void {
  if (!isLocalStorageAvailable()) return;

  const now = new Date();
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith('cpia_')) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const cached = JSON.parse(raw) as { expiresAt?: string };
      if (cached.expiresAt && now > new Date(cached.expiresAt)) {
        keysToRemove.push(key);
      }
    } catch {
      // Remove malformed entries
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}
