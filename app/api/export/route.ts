import { NextRequest, NextResponse } from 'next/server';
import type { ImprovementPlan } from '@/lib/types';

/**
 * POST /api/export
 * Generates a formatted Markdown file from an improvement plan and returns it as a download.
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body — expected JSON.', 400);
  }

  const raw = body as Record<string, unknown>;

  if (!raw.plan || typeof raw.plan !== 'object') {
    return errorResponse('Missing required field: plan', 400);
  }
  if (typeof raw.jobSearchScore !== 'number') {
    return errorResponse('Missing or invalid field: jobSearchScore (must be a number)', 400);
  }
  if (typeof raw.timestamp !== 'string') {
    return errorResponse('Missing or invalid field: timestamp (must be a string)', 400);
  }

  const plan = raw.plan as ImprovementPlan;
  const jobSearchScore = raw.jobSearchScore as number;
  const timestamp = raw.timestamp as string;

  const markdown = generateMarkdown(plan, jobSearchScore, timestamp);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="improvement-plan.md"',
    },
  });
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

/**
 * Generates a well-formatted Markdown document from an improvement plan.
 * Requirements: 19.2, 19.3
 */
function generateMarkdown(plan: ImprovementPlan, jobSearchScore: number, timestamp: string): string {
  const lines: string[] = [];

  // Header
  lines.push('# Career Portfolio Improvement Plan');
  lines.push('');
  lines.push(`**Generated:** ${formatDate(timestamp)}`);
  lines.push(`**Job Search Score:** ${jobSearchScore}/100`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(plan.summary);
  lines.push('');

  // Mini Projects
  lines.push('## Recommended Mini-Projects');
  lines.push('');
  if (plan.miniProjects && plan.miniProjects.length > 0) {
    plan.miniProjects.forEach((project, i) => {
      lines.push(`### ${i + 1}. ${project.title}`);
      lines.push('');
      lines.push(`**Difficulty:** ${project.difficulty}  `);
      lines.push(`**Estimated Time:** ${project.estimatedDays} day${project.estimatedDays !== 1 ? 's' : ''}`);
      lines.push('');
      lines.push(project.description);
      lines.push('');
      if (project.freeTools && project.freeTools.length > 0) {
        lines.push('**Free Tools:**');
        project.freeTools.forEach(tool => lines.push(`- ${tool}`));
        lines.push('');
      }
      if (project.learningOutcomes && project.learningOutcomes.length > 0) {
        lines.push('**Learning Outcomes:**');
        project.learningOutcomes.forEach(outcome => lines.push(`- ${outcome}`));
        lines.push('');
      }
    });
  } else {
    lines.push('No mini-projects recommended.');
    lines.push('');
  }

  // CV Rewrites
  lines.push('## CV Rewrite Suggestions');
  lines.push('');
  if (plan.cvRewrites && plan.cvRewrites.length > 0) {
    plan.cvRewrites.forEach((rewrite, i) => {
      lines.push(`### ${i + 1}. CV Improvement`);
      lines.push('');
      lines.push('**Original:**');
      lines.push(`> ${rewrite.original}`);
      lines.push('');
      lines.push('**Improved:**');
      lines.push(`> ${rewrite.improved}`);
      lines.push('');
      lines.push(`**Rationale:** ${rewrite.rationale}`);
      if (rewrite.githubProjectReference) {
        lines.push('');
        lines.push(`**GitHub Reference:** ${rewrite.githubProjectReference}`);
      }
      lines.push('');
    });
  } else {
    lines.push('No CV rewrites recommended.');
    lines.push('');
  }

  // Learning Resources
  lines.push('## Learning Resources');
  lines.push('');
  if (plan.learningResources && plan.learningResources.length > 0) {
    plan.learningResources.forEach((resource, i) => {
      const freeLabel = resource.isFree ? '🆓 Free' : 'Paid';
      lines.push(`### ${i + 1}. ${resource.title}`);
      lines.push('');
      lines.push(`**Type:** ${resource.type}  `);
      lines.push(`**Provider:** ${resource.provider}  `);
      lines.push(`**Estimated Time:** ${resource.estimatedHours} hour${resource.estimatedHours !== 1 ? 's' : ''}  `);
      lines.push(`**Cost:** ${freeLabel}`);
      lines.push('');
      lines.push(`🔗 [${resource.title}](${resource.url})`);
      lines.push('');
    });
  } else {
    lines.push('No learning resources recommended.');
    lines.push('');
  }

  // JSO Alignment
  lines.push('## JSO Pillar Alignment');
  lines.push('');
  if (plan.jsoAlignment && plan.jsoAlignment.length > 0) {
    plan.jsoAlignment.forEach((alignment) => {
      lines.push(`### ${alignment.pillar}`);
      lines.push('');
      lines.push(`**Recommendation:** ${alignment.recommendation}`);
      lines.push('');
      lines.push(alignment.explanation);
      lines.push('');
    });
  } else {
    lines.push('No JSO alignment recommendations.');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*This plan was generated on ${formatDate(timestamp)} by the Career Portfolio Intelligence Agent.*`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Formats an ISO timestamp into a human-readable date string.
 */
function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message, code: 'VALIDATION_ERROR' }, { status });
}
