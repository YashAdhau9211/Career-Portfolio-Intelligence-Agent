import { AnalysisInput, ImprovementPlan, ReasoningTrace, ReasoningStep } from '../types';

/**
 * Reasoning Tracer Service
 * Generates step-by-step reasoning traces explaining how the improvement plan was produced.
 * Requirements: 5.1, 5.2, 5.3
 */

/**
 * Interprets a CV score into a human-readable tier.
 */
function interpretCVScore(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Below Average';
  return 'Needs Significant Improvement';
}

/**
 * Interprets a job search score into a readiness label.
 */
function interpretJobSearchScore(score: number): string {
  if (score >= 80) return 'Job-Ready';
  if (score >= 60) return 'Competitive';
  if (score >= 40) return 'Developing';
  return 'Early Stage';
}

/**
 * Step 1 — Input Analysis
 * Summarises the raw CV score and GitHub profile data.
 * Requirements: 5.2
 */
function buildInputAnalysisStep(input: AnalysisInput): ReasoningStep {
  const { cvScore, githubUsername, githubProfile } = input;

  const topLanguages = Object.entries(githubProfile.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang, pct]) => ({ language: lang, percentage: Math.round(pct) }));

  return {
    stepNumber: 1,
    title: 'Input Analysis',
    description:
      `Analysed CV score of ${cvScore}/100 (${interpretCVScore(cvScore)}) and GitHub profile ` +
      `for @${githubUsername} with ${githubProfile.publicRepos} public repositories. ` +
      `Account is ${githubProfile.accountAge} days old with ${githubProfile.totalCommits} total commits.`,
    data: {
      cvScore,
      cvTier: interpretCVScore(cvScore),
      githubUsername,
      publicRepos: githubProfile.publicRepos,
      followers: githubProfile.followers,
      following: githubProfile.following,
      totalCommits: githubProfile.totalCommits,
      accountAgeDays: githubProfile.accountAge,
      recentActivity: githubProfile.recentActivity,
      activityScore: githubProfile.activityScore,
      topLanguages,
      repositoryCount: githubProfile.repositories.length,
    },
  };
}

/**
 * Step 2 — Score Calculation
 * Shows the weighted breakdown of the job search score.
 * Requirements: 5.2, 5.3
 */
function buildScoreCalculationStep(input: AnalysisInput): ReasoningStep {
  const { cvScore, githubProfile, jobSearchScore } = input;

  const cvComponent = Math.round(cvScore * 0.6);
  const githubComponent = Math.round(githubProfile.activityScore * 0.4);

  // Explain each sub-factor of the GitHub activity score
  const repos = githubProfile.publicRepos;
  let repoScoreNote: string;
  if (repos <= 0) repoScoreNote = 'No repositories (0 pts)';
  else if (repos <= 10) repoScoreNote = `${repos} repos → low range (0–30 pts)`;
  else if (repos <= 50) repoScoreNote = `${repos} repos → mid range (30–60 pts)`;
  else repoScoreNote = `${repos} repos → high range (60–100 pts)`;

  const languageCount = Object.keys(githubProfile.languages).length;
  const languageDiversityNote =
    languageCount >= 3
      ? `${languageCount} languages → full diversity score`
      : `${languageCount} language(s) → partial diversity score`;

  return {
    stepNumber: 2,
    title: 'Score Calculation',
    description:
      `Job Search Score of ${jobSearchScore}/100 calculated as: ` +
      `CV contribution (${cvScore} × 0.6 = ${cvComponent}) + ` +
      `GitHub contribution (${githubProfile.activityScore} × 0.4 = ${githubComponent}). ` +
      `Readiness level: ${interpretJobSearchScore(jobSearchScore)}.`,
    data: {
      formula: 'Job_Search_Score = (CV_Score × 0.6) + (GitHub_Activity_Score × 0.4)',
      cvScore,
      cvWeight: 0.6,
      cvComponent,
      githubActivityScore: githubProfile.activityScore,
      githubWeight: 0.4,
      githubComponent,
      jobSearchScore,
      readinessLevel: interpretJobSearchScore(jobSearchScore),
      githubSubFactors: {
        repositories: repoScoreNote,
        commits: `${githubProfile.totalCommits} total commits (weight 30%)`,
        languageDiversity: languageDiversityNote,
        accountAge: `${githubProfile.accountAge} days (capped at 1825, weight 10%)`,
        followers: `${githubProfile.followers} followers (capped at 1000, weight 10%)`,
        recentActivity: `${githubProfile.recentActivity ? 'Active' : 'Inactive'} in last 30 days (weight 10%)`,
      },
    },
  };
}

/**
 * Step 3 — Recommendation Logic
 * Explains why each mini-project was suggested.
 * Requirements: 5.3
 */
function buildRecommendationLogicStep(
  input: AnalysisInput,
  plan: ImprovementPlan
): ReasoningStep {
  const { cvScore, githubProfile, jobSearchScore } = input;

  const projectRationales = plan.miniProjects.map((project, idx) => ({
    projectNumber: idx + 1,
    title: project.title,
    difficulty: project.difficulty,
    estimatedDays: project.estimatedDays,
    freeTools: project.freeTools,
    rationale: `Selected to address skill gaps identified from ${
      Object.keys(githubProfile.languages).length
    } detected language(s) and a job search score of ${jobSearchScore}/100. ` +
      `Difficulty set to "${project.difficulty}" based on CV score of ${cvScore}/100.`,
    learningOutcomes: project.learningOutcomes,
  }));

  const topLanguages = Object.keys(githubProfile.languages).slice(0, 3);
  const skillGapNote =
    cvScore < 70
      ? 'CV score below 70 — projects target foundational portfolio strengthening'
      : 'CV score 70+ — projects target advanced portfolio differentiation';

  return {
    stepNumber: 3,
    title: 'Recommendation Logic',
    description:
      `${plan.miniProjects.length} mini-project(s) recommended based on detected skills ` +
      `(${topLanguages.join(', ') || 'none detected'}) and a job search score of ${jobSearchScore}/100. ` +
      skillGapNote + '.',
    data: {
      projectCount: plan.miniProjects.length,
      detectedLanguages: Object.keys(githubProfile.languages),
      jobSearchScore,
      cvScore,
      skillGapNote,
      projectRationales,
      cvRewriteCount: plan.cvRewrites.length,
      cvRewriteRationale:
        'CV rewrites derived from actual GitHub repositories and languages to ensure authenticity and relevance.',
    },
  };
}

/**
 * Step 4 — JSO Alignment
 * Maps recommendations to JSO pillars.
 * Requirements: 5.3
 */
function buildJSOAlignmentStep(plan: ImprovementPlan): ReasoningStep {
  const pillarsAddressed = plan.jsoAlignment.map((a) => a.pillar);
  const uniquePillars = [...new Set(pillarsAddressed)];

  const alignmentDetails = plan.jsoAlignment.map((alignment) => ({
    pillar: alignment.pillar,
    recommendation: alignment.recommendation,
    explanation: alignment.explanation,
  }));

  return {
    stepNumber: 4,
    title: 'JSO Alignment',
    description:
      `Recommendations mapped to ${uniquePillars.length} JSO pillar(s): ${uniquePillars.join(', ')}. ` +
      `Each recommendation was evaluated against the six JSO pillars ` +
      `(Governance, Workers, Community, Environment, Customers, Sustainability) ` +
      `to ensure alignment with organisational values.`,
    data: {
      jsoPillars: [
        'Governance',
        'Workers',
        'Community',
        'Environment',
        'Customers',
        'Sustainability',
      ],
      pillarsAddressed: uniquePillars,
      pillarsNotAddressed: [
        'Governance',
        'Workers',
        'Community',
        'Environment',
        'Customers',
        'Sustainability',
      ].filter((p) => !uniquePillars.includes(p as any)),
      alignmentDetails,
      alignmentCount: plan.jsoAlignment.length,
    },
  };
}

/**
 * Step 5 — Resource Selection
 * Explains the criteria used to choose learning resources.
 * Requirements: 5.3
 */
function buildResourceSelectionStep(
  input: AnalysisInput,
  plan: ImprovementPlan
): ReasoningStep {
  const { cvScore, githubProfile, jobSearchScore } = input;

  const resourceSummary = plan.learningResources.map((r) => ({
    title: r.title,
    type: r.type,
    provider: r.provider,
    estimatedHours: r.estimatedHours,
    isFree: r.isFree,
    selectionCriteria: `Chosen as a free ${r.type.toLowerCase()} resource relevant to detected skill gaps.`,
  }));

  const totalHours = plan.learningResources.reduce((sum, r) => sum + r.estimatedHours, 0);
  const allFree = plan.learningResources.every((r) => r.isFree);
  const resourceTypes = [...new Set(plan.learningResources.map((r) => r.type))];

  const intensityNote =
    jobSearchScore < 50
      ? 'Higher resource count selected due to lower job search score — more foundational learning needed'
      : 'Targeted resources selected to complement existing strong profile';

  return {
    stepNumber: 5,
    title: 'Resource Selection',
    description:
      `${plan.learningResources.length} free learning resource(s) selected (${totalHours} estimated hours total). ` +
      `All resources verified as free (isFree: ${allFree}). ` +
      `Resource types: ${resourceTypes.join(', ')}. ` +
      intensityNote + '.',
    data: {
      resourceCount: plan.learningResources.length,
      totalEstimatedHours: totalHours,
      allResourcesFree: allFree,
      resourceTypes,
      selectionCriteria: [
        'Must be 100% free — no paid subscriptions or paywalled content',
        'Relevant to detected GitHub languages and skill gaps',
        'Appropriate difficulty level based on CV score and job search score',
        'Mix of resource types (courses, tutorials, documentation, articles)',
        'Reputable providers (freeCodeCamp, MDN, official docs, YouTube, Coursera audit, etc.)',
      ],
      detectedSkillContext: {
        cvScore,
        jobSearchScore,
        languageCount: Object.keys(githubProfile.languages).length,
        topLanguages: Object.keys(githubProfile.languages).slice(0, 3),
        recentActivity: githubProfile.recentActivity,
      },
      intensityNote,
      resourceSummary,
    },
  };
}

/**
 * Generates a full reasoning trace for the given analysis input and improvement plan.
 * Produces 5 numbered steps covering input analysis, score calculation,
 * recommendation logic, JSO alignment, and resource selection.
 * Requirements: 5.1, 5.2, 5.3
 */
export function generateTrace(
  input: AnalysisInput,
  plan: ImprovementPlan
): ReasoningTrace {
  const steps: ReasoningStep[] = [
    buildInputAnalysisStep(input),
    buildScoreCalculationStep(input),
    buildRecommendationLogicStep(input, plan),
    buildJSOAlignmentStep(plan),
    buildResourceSelectionStep(input, plan),
  ];

  return {
    steps,
    generatedAt: new Date().toISOString(),
  };
}
