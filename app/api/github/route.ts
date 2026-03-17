import { NextRequest, NextResponse } from 'next/server';
import { fetchProfile } from '@/lib/services/githubAnalyzer';
import { withTimeout, TimeoutError } from '@/lib/utils/timeout';
import type { GitHubProfile, ErrorResponse } from '@/lib/types';

/**
 * GET /api/github?username=<username>
 * Proxy route for GitHub profile data — avoids CORS issues and adds server-side caching.
 * Requirements: 3.1, 3.2, 15.5
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username');

  if (!username || username.trim() === '') {
    return errorResponse('Missing required query parameter: username', 'VALIDATION_ERROR', 400);
  }

  try {
    const profile: GitHubProfile = await withTimeout(
      fetchProfile(username.trim()),
      5000,
      'GitHub data retrieval timed out after 5 seconds',
    );

    return NextResponse.json(profile, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    if (err instanceof TimeoutError) {
      return errorResponse(
        'GitHub data retrieval timed out. Please try again.',
        'TIMEOUT_ERROR',
        504,
      );
    }

    const msg = err instanceof Error ? err.message : String(err);
    return githubErrorResponse(msg);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(
  message: string,
  code: ErrorResponse['code'],
  status: number,
): NextResponse {
  const body: ErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}

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
