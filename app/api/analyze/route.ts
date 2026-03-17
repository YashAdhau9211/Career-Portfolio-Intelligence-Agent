import { NextRequest, NextResponse } from 'next/server';

// Allow up to 60s for Gemini plan generation
export const maxDuration = 60;

import { validateAll } from '@/lib/services/inputValidator';
import { fetchProfile } from '@/lib/services/githubAnalyzer';
import { calculateJobSearchScore } from '@/lib/services/scoreCalculator';
import { generatePlan } from '@/lib/services/planGenerator';
import { generateTrace } from '@/lib/services/reasoningTracer';
import { checkPlan } from '@/lib/services/biasChecker';
import { logAnalysis, logError, hashInputData } from '@/lib/services/auditLogger';
import { trackAnalysis } from '@/lib/services/metricsTracker';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { withTimeout, TimeoutError } from '@/lib/utils/timeout';
import { checkGeminiRateLimit } from '@/lib/utils/rateLimitMonitor';
import type { AnalysisResponse, ErrorResponse, AnalysisInput } from '@/lib/types';

/**
 * POST /api/analyze
 * Main analysis endpoint — orchestrates the full career portfolio analysis pipeline.
 * Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 9.1, 7.1, 20.1, 15.1
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let cvScore: number | undefined;
  let githubUsername: string | undefined;

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid request body — expected JSON.', 'VALIDATION_ERROR', 400);
    }

    const raw = body as Record<string, unknown>;

    // Sanitize and extract inputs
    const rawUsername = typeof raw.githubUsername === 'string'
      ? sanitizeInput(raw.githubUsername)
      : '';
    const rawScore = raw.cvScore;

    cvScore = typeof rawScore === 'number' ? rawScore : Number(rawScore);
    githubUsername = rawUsername;

    // Validate inputs
    const validation = validateAll(cvScore, githubUsername);
    if (!validation.valid) {
      return errorResponse(
        validation.errors.join(' '),
        'VALIDATION_ERROR',
        400,
      );
    }

    // Fetch GitHub profile with 5-second timeout (Requirement 3.5, 15.4)
    let githubProfile;
    const githubStartTime = Date.now();
    try {
      githubProfile = await withTimeout(
        fetchProfile(githubUsername),
        5000,
        'GitHub data retrieval timed out after 5 seconds',
      );
      const githubElapsed = Date.now() - githubStartTime;
      if (githubElapsed > 5000) {
        console.warn(`[analyze] GitHub fetch took ${githubElapsed}ms, exceeded 5s threshold`);
      }
    } catch (err) {
      if (err instanceof TimeoutError) {
        await fireAndForgetError('TIMEOUT_ERROR', err.message, cvScore, githubUsername, startTime);
        return errorResponse(
          'GitHub data retrieval timed out. Please try again.',
          'TIMEOUT_ERROR',
          504,
        );
      }
      const msg = err instanceof Error ? err.message : String(err);
      await fireAndForgetError('GITHUB_ERROR', msg, cvScore, githubUsername, startTime);
      return githubErrorResponse(msg);
    }

    // Calculate job search score
    const jobSearchScore = calculateJobSearchScore(cvScore, githubProfile);

    // Build analysis input for downstream services
    const analysisInput: AnalysisInput = {
      cvScore,
      githubUsername,
      githubProfile,
      jobSearchScore,
    };

    // Check Gemini rate limit before calling the API (Requirement 10.1, 10.2)
    checkGeminiRateLimit();

    // Generate improvement plan via Gemini API (10-second timeout per spec, extended for real-world)
    let improvementPlan;
    const planStartTime = Date.now();
    try {
      improvementPlan = await withTimeout(
        generatePlan(analysisInput),
        45000,
        'Plan generation timed out after 45 seconds',
      );
      const planElapsed = Date.now() - planStartTime;
      if (planElapsed > 10000) {
        console.warn(`[analyze] Plan generation took ${planElapsed}ms, exceeded 10s threshold`);
      }
    } catch (err) {
      if (err instanceof TimeoutError) {
        await fireAndForgetError('TIMEOUT_ERROR', err.message, cvScore, githubUsername, startTime);
        return errorResponse(
          'Plan generation timed out. Please try again.',
          'TIMEOUT_ERROR',
          504,
        );
      }
      const msg = err instanceof Error ? err.message : String(err);
      await fireAndForgetError('GEMINI_ERROR', msg, cvScore, githubUsername, startTime);
      return errorResponse(
        'AI plan generation is currently unavailable. Please try again later.',
        'GEMINI_ERROR',
        502,
      );
    }

    // Generate reasoning trace and run bias checker in parallel (both are synchronous CPU work,
    // wrapped in Promise.resolve so they can be scheduled concurrently)
    // Requirements: 15.3
    const [reasoningTrace, biasResult] = await Promise.all([
      Promise.resolve(generateTrace(analysisInput, improvementPlan)),
      Promise.resolve(checkPlan(improvementPlan)),
    ]);

    const responseTimeMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    // Warn if end-to-end analysis exceeded 10 seconds (Requirement 15.4)
    if (responseTimeMs > 10000) {
      console.warn(`[analyze] Response time ${responseTimeMs}ms exceeded 10s threshold`);
    }

    // Non-blocking: log audit entry and metrics
    const inputHash = hashInputData(cvScore, githubUsername);
    const githubLanguages = Object.keys(githubProfile.languages);

    Promise.all([
      logAnalysis({
        id: crypto.randomUUID(),
        timestamp,
        inputHash,
        cvScore,
        jobSearchScore,
        planGenerated: true,
        biasCheckPassed: biasResult.passed,
        biasWarnings: biasResult.warnings,
        responseTimeMs,
        errorCode: null,
      }),
      trackAnalysis({
        timestamp,
        responseTimeMs,
        success: true,
        errorType: null,
        cvScore,
        jobSearchScore,
        githubLanguages,
      }),
    ]).catch((err) => {
      console.error('[analyze] Non-blocking logging failed:', err);
    });

    const response: AnalysisResponse = {
      jobSearchScore,
      improvementPlan,
      reasoningTrace,
      timestamp,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    // Catch-all for unexpected errors — sanitize before returning
    const responseTimeMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    console.error('[analyze] Unexpected error:', err);

    if (cvScore !== undefined && githubUsername !== undefined) {
      Promise.all([
        logError({
          timestamp,
          errorType: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : String(err),
          context: { cvScore, githubUsername },
        }),
        trackAnalysis({
          timestamp,
          responseTimeMs,
          success: false,
          errorType: 'UNKNOWN_ERROR',
          cvScore: cvScore ?? 0,
          jobSearchScore: 0,
          githubLanguages: [],
        }),
      ]).catch(() => {});
    }

    return errorResponse(
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      500,
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a sanitized JSON error response.
 * Never exposes stack traces or internal details.
 * Requirements: 12.4, 12.5
 */
function errorResponse(
  message: string,
  code: ErrorResponse['code'],
  status: number,
): NextResponse {
  const body: ErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}

/**
 * Maps GitHub error messages to user-friendly responses.
 * Requirements: 12.1
 */
function githubErrorResponse(msg: string): NextResponse {
  if (msg.includes('not found')) {
    return errorResponse(
      'GitHub user not found. Please check the username and try again.',
      'GITHUB_ERROR',
      404,
    );
  }
  if (msg.includes('rate limit')) {
    return errorResponse(
      'GitHub API rate limit reached. Please try again in a few minutes.',
      'GITHUB_ERROR',
      429,
    );
  }
  if (msg.includes('unavailable')) {
    return errorResponse(
      'GitHub service is currently unavailable. Please try again later.',
      'GITHUB_ERROR',
      502,
    );
  }
  return errorResponse(
    'Failed to retrieve GitHub profile. Please try again.',
    'GITHUB_ERROR',
    502,
  );
}

/**
 * Fire-and-forget error logging — does not block the response.
 * Requirements: 7.1, 12.4, 20.2
 */
async function fireAndForgetError(
  errorType: string,
  message: string,
  cvScore: number,
  githubUsername: string,
  startTime: number,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const responseTimeMs = Date.now() - startTime;

  Promise.all([
    logError({
      timestamp,
      errorType,
      message,
      context: { cvScore, githubUsername },
    }),
    trackAnalysis({
      timestamp,
      responseTimeMs,
      success: false,
      errorType,
      cvScore,
      jobSearchScore: 0,
      githubLanguages: [],
    }),
  ]).catch((err) => {
    console.error('[analyze] fireAndForgetError logging failed:', err);
  });
}
