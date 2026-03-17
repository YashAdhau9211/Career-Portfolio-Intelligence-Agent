/**
 * Timeout Utility
 * Provides a wrapper function to add timeout functionality to promises
 * Requirements: 3.5, 4.5, 15.4
 */

/**
 * Error thrown when a promise times out
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve/reject
 * within the specified duration, it will be rejected with a TimeoutError.
 * 
 * @param promise - The promise to wrap with timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Custom error message for timeout (optional)
 * @returns Promise that resolves/rejects with the original promise or times out
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('https://api.github.com/users/octocat'),
 *   5000,
 *   'GitHub API request timed out'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Creates a timeout wrapper function with a preset timeout duration
 * 
 * @param timeoutMs - Default timeout duration in milliseconds
 * @param errorMessage - Default error message for timeout (optional)
 * @returns Function that wraps promises with the preset timeout
 * 
 * @example
 * ```typescript
 * const withFiveSecondTimeout = createTimeoutWrapper(5000, 'Request timed out');
 * const result = await withFiveSecondTimeout(fetch('https://api.example.com'));
 * ```
 */
export function createTimeoutWrapper(
  timeoutMs: number,
  errorMessage?: string
): <T>(promise: Promise<T>) => Promise<T> {
  return <T>(promise: Promise<T>) => withTimeout(promise, timeoutMs, errorMessage);
}
