'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full max-w-md mx-auto rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-4"
    >
      {/* Error icon */}
      <div aria-hidden="true" className="flex justify-center">
        <span className="text-4xl">⚠️</span>
      </div>

      {/* Heading */}
      <h2 className="text-base font-semibold text-red-700">Something went wrong</h2>

      {/* User-friendly error message */}
      <p className="text-sm text-red-600 leading-relaxed">{error}</p>

      {/* Retry button */}
      <button
        type="button"
        onClick={onRetry}
        aria-label="Retry the analysis"
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm
          font-semibold text-white hover:bg-red-700
          focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
          transition-colors"
      >
        <span aria-hidden="true">↺</span>
        Try Again
      </button>
    </div>
  );
}
