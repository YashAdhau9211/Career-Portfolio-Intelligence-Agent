/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 * Requirements: 18.5, 10.2, 10.3
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all required environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables for AI functionality
  if (!process.env.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY is required for AI plan generation');
  }

  // Required variables for data persistence
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required for data persistence');
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    errors.push('SUPABASE_SERVICE_KEY is required for data persistence');
  }

  // Optional but recommended variables
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('NEXT_PUBLIC_APP_URL is not set, using default');
  }

  // Validate format of Supabase URL if provided
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (!url.hostname.includes('supabase.co')) {
        warnings.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }
  }

  // Validate Gemini API key format (basic check)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length < 20) {
    warnings.push('GEMINI_API_KEY appears to be invalid (too short)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment variables and throws if invalid
 * Use this in server-side code to fail fast on startup
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironmentVariables();

  if (result.warnings.length > 0) {
    console.warn('Environment variable warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (!result.valid) {
    console.error('Environment variable validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error(
      'Missing required environment variables. Please check .env.local and .env.example'
    );
  }

  console.log('✓ Environment variables validated successfully');
}

/**
 * Gets environment variable with fallback
 * @param key Environment variable key
 * @param fallback Fallback value if not set
 * @returns Environment variable value or fallback
 */
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || fallback!;
}
