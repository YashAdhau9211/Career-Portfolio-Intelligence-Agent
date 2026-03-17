import { GitHubProfile } from '../types';

/**
 * Score Calculator Service
 * Calculates job search scores from CV score and GitHub profile data.
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

/**
 * Calculates the overall job search score.
 * Formula: Job_Search_Score = (CV_Score * 0.6) + (GitHub_Activity_Score * 0.4)
 * Output is clamped to 0-100.
 * @param cvScore - CV score in range 0-100
 * @param githubProfile - GitHub profile data
 * @returns number between 0 and 100
 * Requirements: 2.1, 2.3
 */
export function calculateJobSearchScore(cvScore: number, githubProfile: GitHubProfile): number {
  const githubActivityScore = calculateGitHubActivityScore(githubProfile);
  const raw = cvScore * 0.6 + githubActivityScore * 0.4;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Calculates a 0-100 GitHub activity score from a profile.
 * Weights:
 *   - Repos:       20% — 0-10 repos = 0-30 pts, 10-50 repos = 30-60 pts, 50+ repos = 60-100 pts
 *   - Commits:     30% — based on average commits per repo (proxy: totalCommits / publicRepos)
 *   - Languages:   20% — diversity bonus (3+ languages = +10 pts applied as full score)
 *   - Account age: 10% — capped at 5 years (1825 days)
 *   - Followers:   10% — capped at 1000 followers
 *   - Recency:     10% — activity in last 30 days = full score
 * Output is clamped to 0-100.
 * @param profile - GitHubProfile to score
 * @returns number between 0 and 100
 * Requirements: 2.2, 2.5
 */
export function calculateGitHubActivityScore(profile: GitHubProfile): number {
  // --- Repos score (0-100 internally, weight 20%) ---
  const repos = profile.publicRepos;
  let repoScore: number;
  if (repos <= 0) {
    repoScore = 0;
  } else if (repos <= 10) {
    // 0-10 repos → 0-30 pts
    repoScore = (repos / 10) * 30;
  } else if (repos <= 50) {
    // 10-50 repos → 30-60 pts
    repoScore = 30 + ((repos - 10) / 40) * 30;
  } else {
    // 50+ repos → 60-100 pts (capped at 100)
    repoScore = Math.min(100, 60 + ((repos - 50) / 50) * 40);
  }

  // --- Commits score (0-100 internally, weight 30%) ---
  // Average commits per repo; cap at 1000 for normalization
  const avgCommits =
    profile.publicRepos > 0 ? profile.totalCommits / profile.publicRepos : 0;
  const commitScore = Math.min(100, (avgCommits / 1000) * 100);

  // --- Language diversity score (0-100 internally, weight 20%) ---
  const languageCount = Object.keys(profile.languages).length;
  // 3+ languages = full score (100), with diversity bonus note
  const languageScore = languageCount >= 3 ? 100 : (languageCount / 3) * 100;

  // --- Account age score (0-100 internally, weight 10%) ---
  // Cap at 5 years (1825 days)
  const ageScore = Math.min(100, (profile.accountAge / 1825) * 100);

  // --- Followers score (0-100 internally, weight 10%) ---
  // Cap at 1000 followers
  const followerScore = Math.min(100, (profile.followers / 1000) * 100);

  // --- Recency score (0-100 internally, weight 10%) ---
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
