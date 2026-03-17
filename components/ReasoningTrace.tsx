'use client';

import { useState } from 'react';
import type { ReasoningTrace, ReasoningStep } from '@/lib/types';

interface ReasoningTraceProps {
  trace: ReasoningTrace;
  collapsible?: boolean;
}

// Format a data value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// Single step card with expand/collapse for supporting data
function StepCard({ step }: { step: ReasoningStep }) {
  const [expanded, setExpanded] = useState(false);
  const hasData = Object.keys(step.data).length > 0;
  const dataId = `step-data-${step.stepNumber}`;

  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden"
      role="listitem"
    >
      {/* Step header */}
      <div className="flex items-start gap-3 px-5 py-4 bg-white">
        {/* Step number badge */}
        <span
          aria-label={`Step ${step.stepNumber}`}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-jso-primary text-white text-xs
            font-bold flex items-center justify-center mt-0.5"
        >
          {step.stepNumber}
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-semibold text-jso-dark text-sm">{step.title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>

          {/* Toggle supporting data */}
          {hasData && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              aria-expanded={expanded}
              aria-controls={dataId}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-jso-primary
                hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-jso-primary
                focus:ring-offset-1 rounded transition-colors"
            >
              <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
              {expanded ? 'Hide' : 'Show'} supporting data
            </button>
          )}
        </div>
      </div>

      {/* Supporting data panel */}
      {hasData && expanded && (
        <div
          id={dataId}
          role="region"
          aria-label={`Supporting data for step ${step.stepNumber}: ${step.title}`}
          className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3"
        >
          {Object.entries(step.data).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {key}
              </p>
              <pre
                className="text-xs text-jso-dark bg-white border border-gray-200 rounded-lg
                  px-3 py-2 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed"
                aria-label={`${key} value`}
              >
                <code>{formatValue(value)}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main ReasoningTrace component
export default function ReasoningTrace({ trace, collapsible = true }: ReasoningTraceProps) {
  const [open, setOpen] = useState(!collapsible);
  const contentId = 'reasoning-trace-content';

  return (
    <section
      className="w-full border border-gray-200 rounded-2xl overflow-hidden"
      aria-label="AI reasoning trace"
    >
      {/* Header */}
      <div className="bg-jso-light border-b border-gray-200">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            aria-expanded={open}
            aria-controls={contentId}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100
              focus:outline-none focus:ring-2 focus:ring-inset focus:ring-jso-primary transition-colors"
          >
            <TraceHeader stepCount={trace.steps.length} generatedAt={trace.generatedAt} />
            <span aria-hidden="true" className="text-gray-400 text-sm ml-4 flex-shrink-0">
              {open ? '▼' : '▶'}
            </span>
          </button>
        ) : (
          <div className="px-5 py-4">
            <TraceHeader stepCount={trace.steps.length} generatedAt={trace.generatedAt} />
          </div>
        )}
      </div>

      {/* Steps list */}
      {(!collapsible || open) && (
        <div
          id={contentId}
          role="list"
          aria-label={`Reasoning steps (${trace.steps.length} total)`}
          className="divide-y divide-gray-100 bg-white p-4 space-y-3"
        >
          {trace.steps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No reasoning steps available.</p>
          ) : (
            trace.steps.map(step => (
              <StepCard key={step.stepNumber} step={step} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

// Extracted header content (shared between button and div variants)
function TraceHeader({ stepCount, generatedAt }: { stepCount: number; generatedAt: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <span aria-hidden="true" className="text-jso-primary text-lg">🔍</span>
      <div>
        <p className="font-semibold text-jso-dark text-sm">AI Reasoning Trace</p>
        <p className="text-xs text-gray-500">
          {stepCount} step{stepCount !== 1 ? 's' : ''} ·{' '}
          {new Date(generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
