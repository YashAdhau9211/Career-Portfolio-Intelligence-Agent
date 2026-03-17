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
  maxOutputTokens: 4096,
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

  return `You are a career advisor for the JSO platform. Generate a concise 30-day improvement plan.

CANDIDATE:
- CV Score: ${cvScore}/100, Job Search Score: ${jobSearchScore}/100
- GitHub: ${githubUsername} | Repos: ${githubProfile.publicRepos} | Languages: ${languageList}
- Commits: ${githubProfile.totalCommits} | Followers: ${githubProfile.followers} | Active recently: ${githubProfile.recentActivity ? 'Yes' : 'No'}

RULES:
- 2-3 mini-projects using ONLY free tools, completable in 30 days
- 3 CV bullet rewrites with action verbs and metrics
- 3 FREE learning resources only (freeCodeCamp, MDN, YouTube, official docs, Coursera/edX audit — NO paid content)
- 1 JSO pillar alignment (${JSO_PILLARS.join(', ')})
- Keep all text fields brief (1-2 sentences max)
- isFree must be true for all resources

Respond with ONLY valid JSON, no markdown, no extra text:
{"summary":"string","miniProjects":[{"title":"string","description":"string","estimatedDays":10,"freeTools":["string"],"learningOutcomes":["string"],"difficulty":"string"}],"cvRewrites":[{"original":"string","improved":"string","rationale":"string","githubProjectReference":null}],"learningResources":[{"title":"string","type":"string","url":"string","provider":"string","estimatedHours":5,"isFree":true}],"jsoAlignment":[{"pillar":"string","recommendation":"string","explanation":"string"}]}`;
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
    model: 'gemini-2.5-flash',
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
