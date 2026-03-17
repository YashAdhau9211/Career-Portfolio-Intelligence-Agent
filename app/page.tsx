'use client';

import { useState, useEffect, useCallback } from 'react';
import InputForm from '@/components/InputForm';
import PlanDisplay from '@/components/PlanDisplay';
import ReasoningTrace from '@/components/ReasoningTrace';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingIndicator from '@/components/LoadingIndicator';
import type { ImprovementPlan, ReasoningTrace as ReasoningTraceType, CachedPlan } from '@/lib/types';

// Requirements: 1.5, 6.1, 6.2, 15.2, 16.1, 16.2, 19.1

interface DashboardState {
  cvScore: number | null;
  githubUsername: string;
  jobSearchScore: number | null;
  improvementPlan: ImprovementPlan | null;
  reasoningTrace: ReasoningTraceType | null;
  loading: boolean;
  error: string | null;
}

const PLAN_KEY_PREFIX = 'cpia_plan_';

const INITIAL_STATE: DashboardState = {
  cvScore: null,
  githubUsername: '',
  jobSearchScore: null,
  improvementPlan: null,
  reasoningTrace: null,
  loading: false,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  // Load cached plan from localStorage on mount (Requirement 6.1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Scan for any cached plan
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(PLAN_KEY_PREFIX)) continue;

        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        const cached: CachedPlan = JSON.parse(raw);
        if (new Date() > new Date(cached.expiresAt)) {
          window.localStorage.removeItem(key);
          continue;
        }

        const username = key.slice(PLAN_KEY_PREFIX.length);
        setState(prev => ({
          ...prev,
          githubUsername: username,
          improvementPlan: cached.plan,
          reasoningTrace: cached.reasoningTrace,
          jobSearchScore: cached.jobSearchScore,
        }));
        break;
      }
    } catch {
      // Silently ignore cache read errors
    }
  }, []);

  // Submit handler — checks localStorage cache first, then calls /api/analyze
  // Requirements: 1.5, 6.1, 6.2, 15.2, 15.5, 16.1
  const handleSubmit = useCallback(async (cvScore: number, githubUsername: string) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      cvScore,
      githubUsername,
    }));

    // Check localStorage cache before hitting the API (Requirement 15.5)
    try {
      const cacheKey = `${PLAN_KEY_PREFIX}${githubUsername}`;
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
      if (raw) {
        const cached: CachedPlan = JSON.parse(raw);
        if (new Date() <= new Date(cached.expiresAt)) {
          setState(prev => ({
            ...prev,
            loading: false,
            jobSearchScore: cached.jobSearchScore,
            improvementPlan: cached.plan,
            reasoningTrace: cached.reasoningTrace,
          }));
          return;
        }
        // Expired — remove it
        window.localStorage.removeItem(cacheKey);
      }
    } catch {
      // Cache miss — proceed to API call
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvScore, githubUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error ?? 'An unexpected error occurred. Please try again.',
        }));
        return;
      }

      const { jobSearchScore, improvementPlan, reasoningTrace } = data;

      // Save to localStorage (Requirement 6.2)
      try {
        const cached: CachedPlan = {
          plan: improvementPlan,
          reasoningTrace,
          jobSearchScore,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        window.localStorage.setItem(
          `${PLAN_KEY_PREFIX}${githubUsername}`,
          JSON.stringify(cached),
        );
      } catch {
        // Silently ignore cache write errors
      }

      setState(prev => ({
        ...prev,
        loading: false,
        jobSearchScore,
        improvementPlan,
        reasoningTrace,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error. Please check your connection and try again.',
      }));
    }
  }, []);

  // Demo handler — populates sample data (Requirement 16.2)
  const handleDemoClick = useCallback(() => {
    handleSubmit(75, 'torvalds');
  }, [handleSubmit]);

  // Export handler — calls /api/export (Requirement 19.1)
  const handleExport = useCallback(async () => {
    if (!state.improvementPlan || state.jobSearchScore === null) return;

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: state.improvementPlan,
          jobSearchScore: state.jobSearchScore,
          timestamp: state.improvementPlan.generatedAt,
        }),
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'improvement-plan.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently ignore export errors
    }
  }, [state.improvementPlan, state.jobSearchScore]);

  // Retry handler — clears error and allows resubmission (Requirement 16.1)
  const handleRetry = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const showResults = !state.loading && !state.error && state.improvementPlan && state.jobSearchScore !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Dashboard Introduction */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-jso-secondary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-jso-dark mb-2">
              Welcome to Your Career Intelligence Dashboard
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Get personalized 30-day improvement plans by analyzing your CV score and GitHub profile.
              All recommendations use free tools and resources aligned with JSO values.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-4 flex items-center">
              <span className="w-8 h-8 bg-jso-primary text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
              Enter Your Information
            </h3>
            <InputForm
              onSubmit={handleSubmit}
              loading={state.loading}
              onDemoClick={handleDemoClick}
            />
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* JSO Pillars */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-3">JSO Pillars</h3>
            <div className="space-y-2">
              {['Governance', 'Workers', 'Community', 'Environment', 'Customers', 'Sustainability'].map((pillar) => (
                <div key={pillar} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-jso-accent rounded-full"></div>
                  <span className="text-sm text-gray-700">{pillar}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              All recommendations align with these organizational values
            </p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-3">What You&apos;ll Get</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                '2-3 mini-projects with free tools',
                'CV bullet point rewrites',
                'Free learning resources',
                'AI reasoning transparency',
              ].map((item) => (
                <li key={item} className="flex items-start">
                  <svg className="w-5 h-5 text-jso-secondary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="mt-6">
        {state.loading && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <LoadingIndicator message="Analysing your career portfolio… this may take a few seconds." />
          </div>
        )}

        {!state.loading && state.error && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex justify-center">
            <ErrorDisplay error={state.error} onRetry={handleRetry} />
          </div>
        )}

        {showResults && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <PlanDisplay
                plan={state.improvementPlan!}
                jobSearchScore={state.jobSearchScore!}
                onExport={handleExport}
              />
            </div>

            {state.reasoningTrace && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <ReasoningTrace trace={state.reasoningTrace} collapsible />
              </div>
            )}
          </div>
        )}

        {!state.loading && !state.error && !state.improvementPlan && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Improvement Plan Will Appear Here</h3>
              <p className="text-sm text-gray-500">
                Enter your information above and click &quot;Analyse Portfolio&quot; to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
