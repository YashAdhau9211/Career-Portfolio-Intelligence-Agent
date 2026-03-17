import { createHash } from 'crypto';
import { AuditLogEntry, ErrorLogEntry } from '../types';
import { supabase } from '../config/supabase';

/**
 * Audit Logger Service
 * Logs analysis events and errors to Supabase for ethical oversight.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 9.3
 */

/**
 * Hashes sensitive input data (CV score + GitHub username) using SHA-256.
 * Ensures PII is not stored in plain text in the audit log.
 * Requirements: 7.3
 */
export function hashInputData(cvScore: number, githubUsername: string): string {
  return createHash('sha256')
    .update(`${cvScore}:${githubUsername.toLowerCase()}`)
    .digest('hex');
}

/**
 * Logs an analysis event to the Supabase audit_logs table.
 * Errors during insertion are logged to console and do NOT propagate to the caller.
 * Requirements: 7.1, 7.2, 7.4, 9.3
 */
export async function logAnalysis(entry: AuditLogEntry): Promise<void> {
  if (!supabase) {
    console.warn('[AuditLogger] Supabase client is not configured. Skipping audit log.');
    return;
  }

  try {
    const { error } = await supabase.from('audit_logs').insert({
      id: entry.id,
      timestamp: entry.timestamp,
      input_hash: entry.inputHash,
      cv_score: entry.cvScore,
      job_search_score: entry.jobSearchScore,
      plan_generated: entry.planGenerated,
      bias_check_passed: entry.biasCheckPassed,
      bias_warnings: entry.biasWarnings,
      response_time_ms: entry.responseTimeMs,
      error_code: entry.errorCode,
    });

    if (error) {
      console.error('[AuditLogger] Failed to insert audit log entry:', error.message);
    }
  } catch (err) {
    console.error('[AuditLogger] Unexpected error during audit log insertion:', err);
  }
}

/**
 * Logs an error event to the Supabase audit_logs table with error details.
 * Errors during insertion are logged to console and do NOT propagate to the caller.
 * Requirements: 7.1, 7.4
 */
export async function logError(error: ErrorLogEntry): Promise<void> {
  if (!supabase) {
    console.warn('[AuditLogger] Supabase client is not configured. Skipping error log.');
    return;
  }

  try {
    const { error: insertError } = await supabase.from('audit_logs').insert({
      id: crypto.randomUUID(),
      timestamp: error.timestamp,
      input_hash: error.context.cvScore !== undefined && error.context.githubUsername !== undefined
        ? hashInputData(error.context.cvScore, error.context.githubUsername)
        : null,
      cv_score: error.context.cvScore ?? 0,
      job_search_score: 0,
      plan_generated: false,
      bias_check_passed: false,
      bias_warnings: [],
      response_time_ms: 0,
      error_code: error.errorType,
    });

    if (insertError) {
      console.error('[AuditLogger] Failed to insert error log entry:', insertError.message);
    }
  } catch (err) {
    console.error('[AuditLogger] Unexpected error during error log insertion:', err);
  }
}
