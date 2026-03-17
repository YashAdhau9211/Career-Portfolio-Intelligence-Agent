import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AnalysisInput,
  ImprovementPlan,
  MiniProject,
  CVRewrite,
  LearningResource,
  JSOAlignment,
} from '../types';

/**
 * Plan Generator Service
 * Generates personalized 30-day improvement plans using Google Gemini API.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 8.1, 8.2, 8.3
 */

// Gemini client — initialized lazily so tests can run without a real key
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Gemini generation configuration.
 * Requirements: 4.1, 10.2
 */
const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

const JSO_PILLARS = [
  'Governance',
  'Workers',
  'Community',
  'Environment',
  'Customers',
  'Sustainability',
] as const;

/**
 * Builds the structured prompt sent to Gemini.
 * Explicitly requires FREE resources only.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 8.1, 8.2, 8.3
 */
export function buildPrompt(input: AnalysisInput): string {
  const { cvScore, githubUsername, githubProfile, jobSearchScore } = input;

  const topLanguages = Object.entries(githubProfile.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang]) => lang);

  const languageList =
    topLanguages.length > 0 ? topLanguages.join(', ') : 'None detected';

  return `You are a career improvement advisor for the JSO platform.

CONTEXT:
- CV Score: ${cvScore}/100
- GitHub Username: ${githubUsername}
- Public Repositories: ${githubProfile.publicRepos}
- Primary Languages: ${languageList}
- Account Age: ${githubProfile.accountAge} days
- Recent Activity (last 30 days): ${githubProfile.recentActivity ? 'Yes' : 'No'}
- Total Commits: ${githubProfile.totalCommits}
- Followers: ${githubProfile.followers}
- Job Search Score: ${jobSearchScore}/100

TASK:
Generate a personalized 30-day career improvement plan.

REQUIREMENTS:
1. Suggest 2-3 mini-projects that:
   - Use ONLY free tools and services (NO paid tools, NO paid subscriptions)
   - Build on existing GitHub skills shown above
   - Are completable within 30 days
   - Add clear portfolio value

2. Rewrite 3-5 CV bullet points:
   - Based on actual GitHub projects and languages
   - Use strong action verbs and quantifiable results
   - Highlight technical skills relevant to job market

3. Recommend 3-5 learning resources:
   - MUST be 100% FREE — no paid courses, no paywalled content
   - Relevant to the candidate's current skill gaps
   - Mix of courses, tutorials, documentation, and articles

4. Align with JSO Pillars (${JSO_PILLARS.join(', ')}):
   - Map at least one recommendation to a JSO pillar
   - Explain how it supports that pillar's values

CRITICAL CONSTRAINTS:
- ALL resources MUST be free. Set isFree: true only when genuinely free.
- Do NOT recommend paid platforms (Udemy paid courses, Pluralsight, LinkedIn Learning paid, etc.)
- Free options include: freeCodeCamp, The Odin Project, MDN, official docs, YouTube, Coursera audit, edX audit, GitHub Learning Lab

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences, no extra text:
{
  "summary": "Brief 2-3 sentence overview of the plan",
  "miniProjects": [
    {
      "title": "Project name",
      "description": "What to build and why it adds portfolio value",
      "estimatedDays": 10,
      "freeTools": ["Tool1", "Tool2"],
      "learningOutcomes": ["Outcome1", "Outcome2"],
      "difficulty": "Intermediate"
    }
  ],
  "cvRewrites": [
    {
      "original": "Worked on web projects",
      "improved": "Developed 5 full-stack web applications using React and Node.js, serving 1000+ users",
      "rationale": "More specific and quantifiable",
      "githubProjectReference": "project-name or null"
    }
  ],
  "learningResources": [
    {
      "title": "Resource name",
      "type": "Course",
      "url": "https://...",
      "provider": "Provider name",
      "estimatedHours": 10,
      "isFree": true
    }
  ],
  "jsoAlignment": [
    {
      "pillar": "Community",
      "recommendation": "Contribute to open source",
      "explanation": "Why this aligns with the Community pillar"
    }
  ]
}`;
}

/**
 * Parses and validates the raw Gemini response string into an ImprovementPlan.
 * Extracts JSON from markdown code blocks if present.
 * Validates structure and enforces the free-resources invariant.
 * Requirements: 4.1, 8.4, 13.2, 13.3
 */
export function parseGeminiResponse(response: string): ImprovementPlan {
  // Strip markdown code fences if present
  let jsonStr = response.trim();
  const fenceMatch =
    jsonStr.match(/```json\s*([\s\S]*?)\s*```/) ||
    jsonStr.match(/```\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Gemini returned malformed JSON that could not be parsed');
  }

  // Validate required top-level fields
  if (typeof parsed.summary !== 'string' || parsed.summary.trim() === '') {
    throw new Error('Invalid plan structure: missing or empty summary');
  }

  if (!Array.isArray(parsed.miniProjects) || parsed.miniProjects.length === 0) {
    throw new Error('Invalid plan structure: miniProjects must be a non-empty array');
  }

  if (!Array.isArray(parsed.cvRewrites) || parsed.cvRewrites.length === 0) {
    throw new Error('Invalid plan structure: cvRewrites must be a non-empty array');
  }

  if (!Array.isArray(parsed.learningResources) || parsed.learningResources.length === 0) {
    throw new Error('Invalid plan structure: learningResources must be a non-empty array');
  }

  if (!Array.isArray(parsed.jsoAlignment) || parsed.jsoAlignment.length === 0) {
    throw new Error('Invalid plan structure: jsoAlignment must be a non-empty array');
  }

  // Enforce mini-project count (2-3)
  if (parsed.miniProjects.length < 2 || parsed.miniProjects.length > 3) {
    throw new Error(
      `Invalid plan structure: expected 2-3 miniProjects, got ${parsed.miniProjects.length}`
    );
  }

  // Enforce free-resources invariant — all learning resources must be free
  const paidResources = (parsed.learningResources as LearningResource[]).filter(
    (r) => r.isFree !== true
  );
  if (paidResources.length > 0) {
    throw new Error(
      `Plan contains ${paidResources.length} non-free resource(s): ${paidResources
        .map((r) => r.title)
        .join(', ')}`
    );
  }

  return {
    summary: parsed.summary as string,
    jobSearchScore: 0, // caller sets this after parsing
    miniProjects: parsed.miniProjects as MiniProject[],
    cvRewrites: parsed.cvRewrites as CVRewrite[],
    learningResources: parsed.learningResources as LearningResource[],
    jsoAlignment: parsed.jsoAlignment as JSOAlignment[],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a personalized improvement plan via the Gemini API.
 * Completes within 10 seconds (caller should wrap with withTimeout).
 * Requirements: 4.1, 4.5, 4.6
 */
export async function generatePlan(input: AnalysisInput): Promise<ImprovementPlan> {
  const model = getGenAI().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = buildPrompt(input);

  let responseText: string;
  try {
    const result = await model.generateContent(prompt);
    responseText = result.response.text();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API request failed: ${message}`);
  }

  const plan = parseGeminiResponse(responseText);

  // Attach the job search score to the plan
  plan.jobSearchScore = input.jobSearchScore;

  return plan;
}
