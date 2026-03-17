import { GitHubProfile, Repository, LanguageStats } from '../types';
import { checkGitHubRateLimit } from '../utils/rateLimitMonitor';

/**
 * GitHub Analyzer Service
 * Fetches and analyzes GitHub profile data
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

const GITHUB_API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetches user profile and repositories from the GitHub REST API.
 * Enforces a 5-second timeout using AbortController.
 * @param username - GitHub username
 * @returns GitHubProfile with profile data and repositories
 * Requirements: 3.1, 3.3, 3.4, 3.5
 */
export async function fetchProfile(username: string): Promise<GitHubProfile> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/users/${username}`, { signal: controller.signal }),
      fetch(`${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated`, {
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);

    // Check GitHub rate limit headers and warn if approaching free tier limit
    // Requirements: 10.3, 10.4
    checkGitHubRateLimit(
      userResponse.headers?.get('X-RateLimit-Remaining') ?? null,
      userResponse.headers?.get('X-RateLimit-Limit') ?? null,
    );

    // Handle user profile errors
    if (!userResponse.ok) {
      if (userResponse.status === 404) throw new Error('GitHub user not found');
      if (userResponse.status === 403) throw new Error('GitHub API rate limit exceeded');
      if (userResponse.status >= 500) throw new Error('GitHub service unavailable');
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }

    // Handle repos errors
    if (!reposResponse.ok) {
      if (reposResponse.status === 404) throw new Error('GitHub user not found');
      if (reposResponse.status === 403) throw new Error('GitHub API rate limit exceeded');
      if (reposResponse.status >= 500) throw new Error('GitHub service unavailable');
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const userData = await userResponse.json();
    const reposData = await reposResponse.json();

    const repositories: Repository[] = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description ?? null,
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      updatedAt: repo.updated_at ?? '',
      url: repo.html_url ?? '',
    }));

    // Use sum of repo sizes as a proxy for total commits
    const totalCommits = reposData.reduce((sum: number, repo: any) => sum + (repo.size ?? 0), 0);

    // Check if any repo was updated within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = repositories.some(
      (repo) => repo.updatedAt && new Date(repo.updatedAt) > thirtyDaysAgo
    );

    // Calculate account age in days
    const createdAt = new Date(userData.created_at);
    const now = new Date();
    const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const languages = extractLanguages(repositories);

    const profile: GitHubProfile = {
      username: userData.login,
      publicRepos: userData.public_repos ?? 0,
      followers: userData.followers ?? 0,
      following: userData.following ?? 0,
      repositories,
      languages,
      totalCommits,
      accountAge,
      recentActivity,
      activityScore: 0, // will be set below
    };

    profile.activityScore = calculateActivityScore(profile);

    return profile;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('GitHub service unavailable');
    }
    throw error;
  }
}

/**
 * Calculates a 0-100 activity score for a GitHub profile.
 * Weights: repos 20%, commits 30%, languages 20%, account age 10%, followers 10%, recent activity 10%
 * @param profile - GitHubProfile to score
 * @returns number between 0 and 100
 * Requirements: 3.6
 */
export function calculateActivityScore(profile: GitHubProfile): number {
  // Repos score (0-100 internally, weight 20%)
  let repoScore: number;
  const repos = profile.publicRepos;
  if (repos <= 0) {
    repoScore = 0;
  } else if (repos <= 10) {
    // 0-10 repos → 0-30 pts
    repoScore = (repos / 10) * 30;
  } else if (repos <= 50) {
    // 10-50 repos → 30-60 pts
    repoScore = 30 + ((repos - 10) / 40) * 30;
  } else {
    // 50+ repos → 60-100 pts
    repoScore = Math.min(100, 60 + ((repos - 50) / 50) * 40);
  }

  // Commits score (0-100 internally, weight 30%)
  // Use totalCommits (sum of repo sizes) — cap at 10000 for normalization
  const commitScore = Math.min(100, (profile.totalCommits / 10000) * 100);

  // Language diversity score (0-100 internally, weight 20%)
  const languageCount = Object.keys(profile.languages).length;
  const languageScore = languageCount >= 3 ? 100 : (languageCount / 3) * 100;

  // Account age score (0-100 internally, weight 10%)
  // Cap at 5 years (1825 days) for normalization
  const ageScore = Math.min(100, (profile.accountAge / 1825) * 100);

  // Followers score (0-100 internally, weight 10%)
  // Cap at 1000 followers for normalization
  const followerScore = Math.min(100, (profile.followers / 1000) * 100);

  // Recent activity score (0-100 internally, weight 10%)
  const recentScore = profile.recentActivity ? 100 : 0;

  const raw =
    repoScore * 0.2 +
    commitScore * 0.3 +
    languageScore * 0.2 +
    ageScore * 0.1 +
    followerScore * 0.1 +
    recentScore * 0.1;

  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Aggregates language counts across repos and returns as a percentage map.
 * @param repositories - Array of Repository objects
 * @returns LanguageStats where each value is a percentage (count / total * 100)
 * Requirements: 3.2
 */
export function extractLanguages(repositories: Repository[]): LanguageStats {
  const counts: Record<string, number> = {};

  for (const repo of repositories) {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] ?? 0) + 1;
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (total === 0) return {};

  const stats: LanguageStats = {};
  for (const [lang, count] of Object.entries(counts)) {
    stats[lang] = (count / total) * 100;
  }

  return stats;
}
