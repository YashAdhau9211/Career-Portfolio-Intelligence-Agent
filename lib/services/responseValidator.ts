/**
 * API Response Validator Service
 * Validates GitHub API and Gemini API responses against expected schemas.
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { ValidationResult } from '../types';

// ============================================================================
// GitHub Response Validation
// ============================================================================

/**
 * Validates a raw GitHub user profile API response object.
 * Checks for required fields and correct types before data processing.
 * Requirements: 13.1, 13.4, 13.5
 */
export function validateGitHubUserResponse(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (data === null || typeof data !== 'object') {
    return { valid: false, errors: ['GitHub user response must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.login !== 'string' || obj.login.trim() === '') {
    errors.push('Missing or invalid field: login (string)');
  }
  if (typeof obj.public_repos !== 'number') {
    errors.push('Missing or invalid field: public_repos (number)');
  }
  if (typeof obj.followers !== 'number') {
    errors.push('Missing or invalid field: followers (number)');
  }
  if (typeof obj.following !== 'number') {
    errors.push('Missing or invalid field: following (number)');
  }
  if (typeof obj.created_at !== 'string' || obj.created_at.trim() === '') {
    errors.push('Missing or invalid field: created_at (string)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a raw GitHub repositories API response array.
 * Each repository item is checked for required fields.
 * Requirements: 13.1, 13.4, 13.5
 */
export function validateGitHubReposResponse(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return { valid: false, errors: ['GitHub repos response must be an array'] };
  }

  for (let i = 0; i < data.length; i++) {
    const repo = data[i];
    if (repo === null || typeof repo !== 'object') {
      errors.push(`Repository at index ${i} must be an object`);
      continue;
    }

    const r = repo as Record<string, unknown>;

    if (typeof r.name !== 'string' || r.name.trim() === '') {
      errors.push(`Repository[${i}]: missing or invalid field: name (string)`);
    }
    if (typeof r.stargazers_count !== 'number') {
      errors.push(`Repository[${i}]: missing or invalid field: stargazers_count (number)`);
    }
    if (typeof r.forks_count !== 'number') {
      errors.push(`Repository[${i}]: missing or invalid field: forks_count (number)`);
    }
    if (typeof r.html_url !== 'string') {
      errors.push(`Repository[${i}]: missing or invalid field: html_url (string)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the complete GitHub API response (user + repos).
 * Convenience wrapper that runs both validators.
 * Requirements: 13.1, 13.4, 13.5
 */
export function validateGitHubResponse(
  userData: unknown,
  reposData: unknown
): ValidationResult {
  const userResult = validateGitHubUserResponse(userData);
  const reposResult = validateGitHubReposResponse(reposData);

  const errors = [...userResult.errors, ...reposResult.errors];
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Gemini Response Validation
// ============================================================================

/**
 * Validates a parsed Gemini improvement plan response object.
 * Checks structure, required fields, types, and the free-resources invariant.
 * Requirements: 13.2, 13.3, 13.4, 13.5
 */
export function validateGeminiResponse(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (data === null || typeof data !== 'object') {
    return { valid: false, errors: ['Gemini response must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  // summary
  if (typeof obj.summary !== 'string' || obj.summary.trim() === '') {
    errors.push('Missing or invalid field: summary (non-empty string)');
  }

  // miniProjects
  if (!Array.isArray(obj.miniProjects)) {
    errors.push('Missing or invalid field: miniProjects (array)');
  } else {
    if (obj.miniProjects.length < 2 || obj.miniProjects.length > 3) {
      errors.push(
        `miniProjects must contain 2-3 items, got ${obj.miniProjects.length}`
      );
    }
    obj.miniProjects.forEach((p: unknown, i: number) => {
      const projectErrors = validateMiniProject(p, i);
      errors.push(...projectErrors);
    });
  }

  // cvRewrites
  if (!Array.isArray(obj.cvRewrites) || obj.cvRewrites.length === 0) {
    errors.push('Missing or invalid field: cvRewrites (non-empty array)');
  } else {
    obj.cvRewrites.forEach((r: unknown, i: number) => {
      const rewriteErrors = validateCVRewrite(r, i);
      errors.push(...rewriteErrors);
    });
  }

  // learningResources
  if (!Array.isArray(obj.learningResources) || obj.learningResources.length === 0) {
    errors.push('Missing or invalid field: learningResources (non-empty array)');
  } else {
    obj.learningResources.forEach((r: unknown, i: number) => {
      const resourceErrors = validateLearningResource(r, i);
      errors.push(...resourceErrors);
    });
  }

  // jsoAlignment
  if (!Array.isArray(obj.jsoAlignment) || obj.jsoAlignment.length === 0) {
    errors.push('Missing or invalid field: jsoAlignment (non-empty array)');
  } else {
    obj.jsoAlignment.forEach((a: unknown, i: number) => {
      const alignmentErrors = validateJSOAlignment(a, i);
      errors.push(...alignmentErrors);
    });
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Field-level validators (internal helpers)
// ============================================================================

const VALID_DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);
const VALID_RESOURCE_TYPES = new Set([
  'Course',
  'Tutorial',
  'Documentation',
  'Article',
  'Video',
]);
const VALID_JSO_PILLARS = new Set([
  'Governance',
  'Workers',
  'Community',
  'Environment',
  'Customers',
  'Sustainability',
]);

function validateMiniProject(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `miniProjects[${index}]`;

  if (data === null || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const p = data as Record<string, unknown>;

  if (typeof p.title !== 'string' || p.title.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: title (non-empty string)`);
  }
  if (typeof p.description !== 'string' || p.description.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: description (non-empty string)`);
  }
  if (typeof p.estimatedDays !== 'number' || p.estimatedDays <= 0) {
    errors.push(`${prefix}: missing or invalid field: estimatedDays (positive number)`);
  }
  if (!Array.isArray(p.freeTools) || p.freeTools.length === 0) {
    errors.push(`${prefix}: missing or invalid field: freeTools (non-empty array)`);
  }
  if (!Array.isArray(p.learningOutcomes) || p.learningOutcomes.length === 0) {
    errors.push(`${prefix}: missing or invalid field: learningOutcomes (non-empty array)`);
  }
  if (!VALID_DIFFICULTIES.has(p.difficulty as string)) {
    errors.push(
      `${prefix}: invalid difficulty "${p.difficulty}", must be Beginner | Intermediate | Advanced`
    );
  }

  return errors;
}

function validateCVRewrite(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `cvRewrites[${index}]`;

  if (data === null || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const r = data as Record<string, unknown>;

  if (typeof r.original !== 'string' || r.original.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: original (non-empty string)`);
  }
  if (typeof r.improved !== 'string' || r.improved.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: improved (non-empty string)`);
  }
  if (typeof r.rationale !== 'string' || r.rationale.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: rationale (non-empty string)`);
  }
  // githubProjectReference may be string or null
  if (r.githubProjectReference !== null && typeof r.githubProjectReference !== 'string') {
    errors.push(`${prefix}: githubProjectReference must be a string or null`);
  }

  return errors;
}

function validateLearningResource(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `learningResources[${index}]`;

  if (data === null || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const r = data as Record<string, unknown>;

  if (typeof r.title !== 'string' || r.title.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: title (non-empty string)`);
  }
  if (!VALID_RESOURCE_TYPES.has(r.type as string)) {
    errors.push(
      `${prefix}: invalid type "${r.type}", must be Course | Tutorial | Documentation | Article | Video`
    );
  }
  if (typeof r.url !== 'string' || !r.url.startsWith('http')) {
    errors.push(`${prefix}: missing or invalid field: url (must start with http)`);
  }
  if (typeof r.provider !== 'string' || r.provider.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: provider (non-empty string)`);
  }
  if (typeof r.estimatedHours !== 'number' || r.estimatedHours <= 0) {
    errors.push(`${prefix}: missing or invalid field: estimatedHours (positive number)`);
  }
  // Free-resources invariant — isFree must be exactly true
  if (r.isFree !== true) {
    errors.push(`${prefix}: isFree must be true (free resources only)`);
  }

  return errors;
}

function validateJSOAlignment(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `jsoAlignment[${index}]`;

  if (data === null || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const a = data as Record<string, unknown>;

  if (!VALID_JSO_PILLARS.has(a.pillar as string)) {
    errors.push(
      `${prefix}: invalid pillar "${a.pillar}", must be one of: ${Array.from(VALID_JSO_PILLARS).join(', ')}`
    );
  }
  if (typeof a.recommendation !== 'string' || a.recommendation.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: recommendation (non-empty string)`);
  }
  if (typeof a.explanation !== 'string' || a.explanation.trim() === '') {
    errors.push(`${prefix}: missing or invalid field: explanation (non-empty string)`);
  }

  return errors;
}
