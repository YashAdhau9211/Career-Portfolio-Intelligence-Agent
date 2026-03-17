import { BiasCheckResult, ImprovementPlan, MiniProject, LearningResource } from '../types';

/**
 * Bias Checker Service
 * Analyzes improvement plans for potential bias in recommendations.
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

// Languages considered "mainstream" — over-representation triggers a warning
const MAINSTREAM_LANGUAGES = new Set([
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby',
]);

// Providers/platforms known to have regional restrictions
const REGION_LOCKED_PROVIDERS = [
  'coursera', 'edx', 'udemy', 'pluralsight', 'linkedin learning',
  'skillshare', 'domestika',
];

// Max realistic daily hours for a working professional
const MAX_REALISTIC_DAILY_HOURS = 4;

// Max total days across all mini-projects (30-day plan)
const MAX_PLAN_DAYS = 30;

/**
 * Detects over-representation of mainstream programming languages in mini-projects.
 * Returns warning strings for each detected issue.
 * Requirements: 9.5
 */
export function detectLanguageBias(projects: MiniProject[]): string[] {
  if (projects.length === 0) return [];

  const warnings: string[] = [];

  // Collect all tool/language mentions from project descriptions and freeTools
  const allText = projects
    .flatMap((p) => [p.description, p.title, ...p.freeTools, ...p.learningOutcomes])
    .join(' ')
    .toLowerCase();

  const mainstreamMentions = [...MAINSTREAM_LANGUAGES].filter((lang) =>
    allText.includes(lang)
  );

  // Flag if every project only mentions mainstream languages with no diversity
  const hasNonMainstream = projects.some((p) => {
    const text = [p.description, p.title, ...p.freeTools].join(' ').toLowerCase();
    return [...MAINSTREAM_LANGUAGES].every((lang) => !text.includes(lang));
  });

  if (mainstreamMentions.length > 0 && !hasNonMainstream) {
    warnings.push(
      `All mini-projects focus on mainstream languages (${mainstreamMentions.join(', ')}). ` +
        'Consider including projects that use emerging or domain-specific technologies.'
    );
  }

  // Flag if all projects have the same difficulty
  const difficulties = projects.map((p) => p.difficulty);
  const uniqueDifficulties = new Set(difficulties);
  if (uniqueDifficulties.size === 1 && projects.length > 1) {
    warnings.push(
      `All mini-projects have the same difficulty level (${difficulties[0]}). ` +
        'Consider varying difficulty to accommodate different skill levels.'
    );
  }

  return warnings;
}

/**
 * Detects learning resources that may be region-locked or inaccessible globally.
 * Returns warning strings for each detected issue.
 * Requirements: 9.2, 9.5
 */
export function detectResourceAccessibilityBias(resources: LearningResource[]): string[] {
  if (resources.length === 0) return [];

  const warnings: string[] = [];

  const regionLockedResources = resources.filter((r) => {
    const providerLower = r.provider.toLowerCase();
    const urlLower = r.url.toLowerCase();
    return REGION_LOCKED_PROVIDERS.some(
      (p) => providerLower.includes(p) || urlLower.includes(p.replace(' ', ''))
    );
  });

  if (regionLockedResources.length > 0) {
    warnings.push(
      `${regionLockedResources.length} resource(s) may have regional restrictions: ` +
        `${regionLockedResources.map((r) => r.title).join(', ')}. ` +
        'Ensure alternatives are available for users in all regions.'
    );
  }

  // Check for resources without accessible URLs
  const missingUrls = resources.filter((r) => !r.url || !r.url.startsWith('http'));
  if (missingUrls.length > 0) {
    warnings.push(
      `${missingUrls.length} resource(s) have missing or invalid URLs, which may limit accessibility.`
    );
  }

  return warnings;
}

/**
 * Checks whether skill level assumptions are appropriate across mini-projects.
 * Returns warnings if assumptions seem unreasonable.
 * Requirements: 9.5
 */
function checkSkillLevelAssumptions(projects: MiniProject[]): { passed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Flag if all projects are Advanced with no beginner-friendly options
  const allAdvanced = projects.every((p) => p.difficulty === 'Advanced');
  if (allAdvanced && projects.length > 0) {
    warnings.push(
      'All mini-projects are marked as Advanced difficulty. ' +
        'This may exclude users who are early in their career. Consider adding Beginner or Intermediate options.'
    );
  }

  // Flag projects with no learning outcomes (assumes prior knowledge)
  const noOutcomes = projects.filter((p) => p.learningOutcomes.length === 0);
  if (noOutcomes.length > 0) {
    warnings.push(
      `${noOutcomes.length} mini-project(s) have no learning outcomes defined, ` +
        'which may assume prior knowledge without guidance.'
    );
  }

  return { passed: warnings.length === 0, warnings };
}

/**
 * Checks whether time commitments across the plan are realistic.
 * Requirements: 9.5
 */
function checkTimeCommitmentRealism(
  projects: MiniProject[],
  resources: LearningResource[]
): { passed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check total project days don't exceed the 30-day plan window
  const totalProjectDays = projects.reduce((sum, p) => sum + p.estimatedDays, 0);
  if (totalProjectDays > MAX_PLAN_DAYS) {
    warnings.push(
      `Total estimated project days (${totalProjectDays}) exceeds the 30-day plan window. ` +
        'This may be unrealistic for users with full-time commitments.'
    );
  }

  // Check total learning hours don't imply excessive daily commitment
  const totalLearningHours = resources.reduce((sum, r) => sum + r.estimatedHours, 0);
  const remainingDays = Math.max(1, MAX_PLAN_DAYS - totalProjectDays);
  const dailyHoursRequired = totalLearningHours / remainingDays;

  if (dailyHoursRequired > MAX_REALISTIC_DAILY_HOURS) {
    warnings.push(
      `Learning resources require ~${dailyHoursRequired.toFixed(1)} hours/day alongside projects. ` +
        'This may not be realistic for working professionals. Consider reducing resource count or hours.'
    );
  }

  return { passed: warnings.length === 0, warnings };
}

/**
 * Verifies that all learning resources are marked as free.
 * Requirements: 9.1, 9.5
 */
function checkCostVerification(resources: LearningResource[]): { passed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const paidResources = resources.filter((r) => r.isFree !== true);
  if (paidResources.length > 0) {
    warnings.push(
      `${paidResources.length} resource(s) are not marked as free: ` +
        `${paidResources.map((r) => r.title).join(', ')}. ` +
        'All resources must be freely accessible to avoid financial barriers.'
    );
  }

  return { passed: warnings.length === 0, warnings };
}

/**
 * Runs all bias checks on an improvement plan and returns a BiasCheckResult.
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */
export function checkPlan(plan: ImprovementPlan): BiasCheckResult {
  const allWarnings: string[] = [];
  const allSuggestions: string[] = [];

  // Language diversity check
  const languageWarnings = detectLanguageBias(plan.miniProjects);
  const languageDiversity = languageWarnings.length === 0;
  allWarnings.push(...languageWarnings);
  if (!languageDiversity) {
    allSuggestions.push(
      'Include at least one project using a non-mainstream language or technology stack.'
    );
  }

  // Resource accessibility check
  const accessibilityWarnings = detectResourceAccessibilityBias(plan.learningResources);
  const resourceAccessibility = accessibilityWarnings.length === 0;
  allWarnings.push(...accessibilityWarnings);
  if (!resourceAccessibility) {
    allSuggestions.push(
      'Replace region-locked resources with globally accessible alternatives (e.g., MDN, freeCodeCamp, official docs).'
    );
  }

  // Skill level assumptions check
  const skillCheck = checkSkillLevelAssumptions(plan.miniProjects);
  allWarnings.push(...skillCheck.warnings);
  if (!skillCheck.passed) {
    allSuggestions.push(
      'Provide a mix of difficulty levels to accommodate users at different career stages.'
    );
  }

  // Time commitment realism check
  const timeCheck = checkTimeCommitmentRealism(plan.miniProjects, plan.learningResources);
  allWarnings.push(...timeCheck.warnings);
  if (!timeCheck.passed) {
    allSuggestions.push(
      'Reduce total time commitment to fit within a realistic 30-day schedule for working professionals.'
    );
  }

  // Cost verification check
  const costCheck = checkCostVerification(plan.learningResources);
  allWarnings.push(...costCheck.warnings);
  if (!costCheck.passed) {
    allSuggestions.push(
      'Ensure all resources are genuinely free and replace any paid resources with free alternatives.'
    );
  }

  const passed = allWarnings.length === 0;

  return {
    passed,
    warnings: allWarnings,
    suggestions: allSuggestions,
    checks: {
      languageDiversity,
      resourceAccessibility,
      skillLevelAppropriate: skillCheck.passed,
      timeCommitmentRealistic: timeCheck.passed,
      costVerified: costCheck.passed,
    },
  };
}
