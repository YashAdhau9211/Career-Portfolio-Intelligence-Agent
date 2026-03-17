import { AnalysisMetrics, MetricsSummary } from '../types';
import { supabase } from '../config/supabase';

/**
 * Metrics Tracker Service
 * Tracks analysis metrics and provides aggregated summaries.
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

/**
 * Logs analysis metrics to the Supabase metrics table.
 * Errors during insertion are logged to console and do NOT propagate to the caller.
 * Requirements: 20.1, 20.2, 20.4
 */
export async function trackAnalysis(metrics: AnalysisMetrics): Promise<void> {
  if (!supabase) {
    console.warn('[MetricsTracker] Supabase client is not configured. Skipping metrics tracking.');
    return;
  }

  try {
    const { error } = await supabase.from('metrics').insert({
      timestamp: metrics.timestamp,
      response_time_ms: metrics.responseTimeMs,
      success: metrics.success,
      error_type: metrics.errorType,
      cv_score: metrics.cvScore,
      job_search_score: metrics.jobSearchScore,
      github_languages: metrics.githubLanguages,
    });

    if (error) {
      console.error('[MetricsTracker] Failed to insert metrics entry:', error.message);
    }
  } catch (err) {
    console.error('[MetricsTracker] Unexpected error during metrics insertion:', err);
  }
}

/**
 * Retrieves aggregated metrics summary from the Supabase metrics table.
 * Calculates: total analyses, average response time, error rate, top languages, average scores.
 * Requirements: 20.3, 20.5, 20.6
 */
export async function getMetricsSummary(): Promise<MetricsSummary> {
  if (!supabase) {
    console.warn('[MetricsTracker] Supabase client is not configured. Returning empty summary.');
    return {
      totalAnalyses: 0,
      averageResponseTime: 0,
      errorRate: 0,
      errorsByType: {},
      topLanguages: [],
      averageCVScore: 0,
      averageJobSearchScore: 0,
    };
  }

  let metrics: Record<string, unknown>[] | null = null;
  try {
    const result = await supabase
      .from('metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (result.error) {
      console.error('[MetricsTracker] Failed to retrieve metrics:', result.error.message);
      return {
        totalAnalyses: 0,
        averageResponseTime: 0,
        errorRate: 0,
        errorsByType: {},
        topLanguages: [],
        averageCVScore: 0,
        averageJobSearchScore: 0,
      };
    }
    metrics = result.data;
  } catch (err) {
    console.error('[MetricsTracker] Unexpected error during metrics retrieval:', err);
    return {
      totalAnalyses: 0,
      averageResponseTime: 0,
      errorRate: 0,
      errorsByType: {},
      topLanguages: [],
      averageCVScore: 0,
      averageJobSearchScore: 0,
    };
  }

  if (!metrics || metrics.length === 0) {
    return {
      totalAnalyses: 0,
      averageResponseTime: 0,
      errorRate: 0,
      errorsByType: {},
      topLanguages: [],
      averageCVScore: 0,
      averageJobSearchScore: 0,
    };
  }

  const totalAnalyses = metrics.length;
  const successfulMetrics = metrics.filter((m) => m.success);
  const failedMetrics = metrics.filter((m) => !m.success);

  // Average response time across all entries
  const averageResponseTime =
    metrics.reduce((sum, m) => sum + (m.response_time_ms ?? 0), 0) / totalAnalyses;

  // Error rate as a fraction (0-1)
  const errorRate = failedMetrics.length / totalAnalyses;

  // Error counts by type
  const errorsByType: Record<string, number> = {};
  for (const m of failedMetrics) {
    const key = m.error_type ? String(m.error_type) : 'UNKNOWN';
    errorsByType[key] = (errorsByType[key] ?? 0) + 1;
  }

  // Top languages aggregated across all entries
  const languageCounts: Record<string, number> = {};
  for (const m of metrics) {
    const langs: string[] = Array.isArray(m.github_languages) ? m.github_languages : [];
    for (const lang of langs) {
      languageCounts[lang] = (languageCounts[lang] ?? 0) + 1;
    }
  }
  const topLanguages = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average CV and job search scores (only from successful analyses with valid scores)
  const withCVScore = successfulMetrics.filter((m) => m.cv_score != null);
  const averageCVScore =
    withCVScore.length > 0
      ? withCVScore.reduce((sum, m) => sum + m.cv_score, 0) / withCVScore.length
      : 0;

  const withJobScore = successfulMetrics.filter((m) => m.job_search_score != null);
  const averageJobSearchScore =
    withJobScore.length > 0
      ? withJobScore.reduce((sum, m) => sum + m.job_search_score, 0) / withJobScore.length
      : 0;

  return {
    totalAnalyses,
    averageResponseTime,
    errorRate,
    errorsByType,
    topLanguages,
    averageCVScore,
    averageJobSearchScore,
  };
}
