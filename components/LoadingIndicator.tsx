'use client';

interface LoadingIndicatorProps {
  message: string;
}

export default function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-10"
      role="status"
      aria-label="Loading"
    >
      {/* Animated spinner */}
      <svg
        className="animate-spin h-10 w-10 text-jso-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>

      {/* Progress message with ARIA live region */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-sm font-medium text-jso-dark text-center"
      >
        {message}
      </p>
    </div>
  );
}
