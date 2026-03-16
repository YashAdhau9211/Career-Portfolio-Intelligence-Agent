/**
 * Environment Configuration
 * Centralized environment variable access with validation
 * Requirements: 18.5, 10.2, 10.3
 */

import { requireValidEnvironment } from '../utils/validateEnv';

// Validate environment on module load (server-side only)
if (typeof window === 'undefined') {
  requireValidEnvironment();
}

/**
 * Server-side environment variables
 * These are only accessible in API routes and server components
 */
export const serverEnv = {
  geminiApiKey: process.env.GEMINI_API_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

/**
 * Client-side environment variables
 * These are accessible in both client and server
 */
export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

/**
 * Check if running in production
 */
export const isProduction = serverEnv.nodeEnv === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = serverEnv.nodeEnv === 'development';
