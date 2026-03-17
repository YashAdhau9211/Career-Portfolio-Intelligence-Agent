/**
 * Supabase Client Configuration
 * Requirements: 10.3
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

/**
 * Configured Supabase client instance.
 * Returns null if environment variables are not set (e.g. during local dev without Supabase).
 * Throws a descriptive error if only one of the two required variables is missing.
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl && !supabaseServiceKey) {
    // Both missing — Supabase not configured yet, return null gracefully
    console.warn(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are not set. ' +
        'Supabase features will be disabled. See .env.example for setup instructions.'
    );
    return null;
  }

  if (!supabaseUrl) {
    throw new Error(
      '[Supabase] Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
        'Set it in .env.local (see .env.example).'
    );
  }

  if (!supabaseServiceKey) {
    throw new Error(
      '[Supabase] Missing required environment variable: SUPABASE_SERVICE_KEY. ' +
        'Set it in .env.local (see .env.example).'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export const supabase = createSupabaseClient();
