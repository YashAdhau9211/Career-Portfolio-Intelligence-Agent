import { ValidationResult } from '../types';

/**
 * Input Validator Service
 * Validates user input for CV score and GitHub username
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * Validates CV score is within valid range (0-100)
 * @param score - The CV score to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validateCVScore(score: number): ValidationResult {
  const errors: string[] = [];

  if (typeof score !== 'number' || isNaN(score)) {
    errors.push('CV score must be a valid number');
  } else if (score < 0 || score > 100) {
    errors.push('CV score must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates GitHub username format
 * Rules: non-empty, alphanumeric with hyphens, max 39 characters
 * @param username - The GitHub username to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validateGitHubUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push('GitHub username cannot be empty');
  } else {
    // GitHub username rules: alphanumeric and hyphens only, max 39 chars
    const validUsernamePattern = /^[a-zA-Z0-9-]+$/;
    
    if (username.length > 39) {
      errors.push('GitHub username cannot exceed 39 characters');
    }
    
    if (!validUsernamePattern.test(username)) {
      errors.push('GitHub username can only contain alphanumeric characters and hyphens');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates all user input (CV score and GitHub username)
 * @param cvScore - The CV score to validate
 * @param githubUsername - The GitHub username to validate
 * @returns ValidationResult with valid flag and combined error messages
 */
export function validateAll(cvScore: number, githubUsername: string): ValidationResult {
  const cvValidation = validateCVScore(cvScore);
  const usernameValidation = validateGitHubUsername(githubUsername);

  const allErrors = [...cvValidation.errors, ...usernameValidation.errors];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
