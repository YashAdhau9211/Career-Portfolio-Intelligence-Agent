'use client';

import { useState, useCallback } from 'react';
import { validateCVScore, validateGitHubUsername } from '@/lib/services/inputValidator';

interface InputFormProps {
  onSubmit: (cvScore: number, githubUsername: string) => Promise<void>;
  loading: boolean;
  onDemoClick: () => void;
}

interface FormErrors {
  cvScore: string[];
  githubUsername: string[];
}

export default function InputForm({ onSubmit, loading, onDemoClick }: InputFormProps) {
  const [cvScoreRaw, setCvScoreRaw] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [errors, setErrors] = useState<FormErrors>({ cvScore: [], githubUsername: [] });
  const [touched, setTouched] = useState({ cvScore: false, githubUsername: false });

  const validateCVField = useCallback((value: string) => {
    if (!value) return ['CV score is required'];
    const num = Number(value);
    if (isNaN(num)) return ['CV score must be a valid number'];
    return validateCVScore(num).errors;
  }, []);

  const validateUsernameField = useCallback((value: string) => {
    return validateGitHubUsername(value).errors;
  }, []);

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCvScoreRaw(val);
    if (touched.cvScore) {
      setErrors(prev => ({ ...prev, cvScore: validateCVField(val) }));
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGithubUsername(val);
    if (touched.githubUsername) {
      setErrors(prev => ({ ...prev, githubUsername: validateUsernameField(val) }));
    }
  };

  const handleCVBlur = () => {
    setTouched(prev => ({ ...prev, cvScore: true }));
    setErrors(prev => ({ ...prev, cvScore: validateCVField(cvScoreRaw) }));
  };

  const handleUsernameBlur = () => {
    setTouched(prev => ({ ...prev, githubUsername: true }));
    setErrors(prev => ({ ...prev, githubUsername: validateUsernameField(githubUsername) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cvErrors = validateCVField(cvScoreRaw);
    const usernameErrors = validateUsernameField(githubUsername);

    setTouched({ cvScore: true, githubUsername: true });
    setErrors({ cvScore: cvErrors, githubUsername: usernameErrors });

    if (cvErrors.length > 0 || usernameErrors.length > 0) return;

    await onSubmit(Number(cvScoreRaw), githubUsername.trim());
  };

  const cvHasError = touched.cvScore && errors.cvScore.length > 0;
  const usernameHasError = touched.githubUsername && errors.githubUsername.length > 0;
  const isFormValid =
    cvScoreRaw !== '' &&
    githubUsername !== '' &&
    errors.cvScore.length === 0 &&
    errors.githubUsername.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Career portfolio analysis form"
      className="w-full max-w-md mx-auto space-y-5"
    >
      {/* CV Score Field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="cv-score"
          className="text-sm font-medium text-jso-dark"
        >
          CV Score
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </label>
        <input
          id="cv-score"
          type="number"
          min={0}
          max={100}
          value={cvScoreRaw}
          onChange={handleCVChange}
          onBlur={handleCVBlur}
          disabled={loading}
          placeholder="Enter a score between 0 and 100"
          aria-required="true"
          aria-invalid={cvHasError}
          aria-describedby={cvHasError ? 'cv-score-error' : undefined}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-jso-dark placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-jso-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${cvHasError
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-jso-primary'
            }`}
        />
        {cvHasError && (
          <ul
            id="cv-score-error"
            role="alert"
            aria-live="polite"
            className="mt-1 space-y-0.5"
          >
            {errors.cvScore.map((err, i) => (
              <li key={i} className="text-xs text-red-600 flex items-center gap-1">
                <span aria-hidden="true">⚠</span>
                {err}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* GitHub Username Field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="github-username"
          className="text-sm font-medium text-jso-dark"
        >
          GitHub Username
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </label>
        <input
          id="github-username"
          type="text"
          value={githubUsername}
          onChange={handleUsernameChange}
          onBlur={handleUsernameBlur}
          disabled={loading}
          placeholder="e.g. octocat"
          maxLength={39}
          aria-required="true"
          aria-invalid={usernameHasError}
          aria-describedby={
            usernameHasError ? 'github-username-error' : 'github-username-hint'
          }
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-jso-dark placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-jso-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${usernameHasError
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-jso-primary'
            }`}
        />
        <p id="github-username-hint" className="text-xs text-gray-500">
          Alphanumeric characters and hyphens only, max 39 characters
        </p>
        {usernameHasError && (
          <ul
            id="github-username-error"
            role="alert"
            aria-live="polite"
            className="mt-0.5 space-y-0.5"
          >
            {errors.githubUsername.map((err, i) => (
              <li key={i} className="text-xs text-red-600 flex items-center gap-1">
                <span aria-hidden="true">⚠</span>
                {err}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !isFormValid}
          aria-label={loading ? 'Analysing your portfolio, please wait' : 'Analyse my career portfolio'}
          aria-busy={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-jso-primary
            px-5 py-2.5 text-sm font-semibold text-white
            hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-jso-primary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
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
              Analysing…
            </>
          ) : (
            'Analyse Portfolio'
          )}
        </button>

        <button
          type="button"
          onClick={onDemoClick}
          disabled={loading}
          aria-label="Try demo with sample data"
          className="flex-1 rounded-lg border border-jso-secondary px-5 py-2.5 text-sm font-semibold
            text-jso-secondary hover:bg-jso-secondary hover:text-white
            focus:outline-none focus:ring-2 focus:ring-jso-secondary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Try Demo
        </button>
      </div>
    </form>
  );
}
