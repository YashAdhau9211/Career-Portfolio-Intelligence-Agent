/**
 * Input Sanitization Utility
 * Removes SQL injection patterns, XSS patterns, and escapes special characters
 * Requirements: 18.3
 */

/**
 * Sanitizes user input by removing SQL injection patterns, XSS patterns,
 * and escaping special characters
 * @param input - The raw user input string
 * @returns Sanitized string safe for processing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /('|(\\'))/g, // Single quotes and escaped quotes
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi, // OR 1=1, AND 1=1 patterns
  ];

  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, onload=, etc.
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
  ];

  xssPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Escape special HTML characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitizes an object by applying sanitizeInput to all string values
 * @param obj - Object with string values to sanitize
 * @returns New object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}
