'use client';

import { useState } from 'react';
import type {
  ImprovementPlan,
  MiniProject,
  CVRewrite,
  LearningResource,
  JSOAlignment,
} from '@/lib/types';

interface PlanDisplayProps {
  plan: ImprovementPlan;
  jobSearchScore: number;
  onExport: () => void;
}

// Score colour thresholds
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-50 border-green-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Developing';
  return 'Needs Work';
}

// JSO pillar badge colours
const PILLAR_COLORS: Record<JSOAlignment['pillar'], string> = {
  Governance: 'bg-blue-100 text-blue-800',
  Workers: 'bg-purple-100 text-purple-800',
  Community: 'bg-green-100 text-green-800',
  Environment: 'bg-teal-100 text-teal-800',
  Customers: 'bg-orange-100 text-orange-800',
  Sustainability: 'bg-emerald-100 text-emerald-800',
};

const DIFFICULTY_COLORS: Record<MiniProject['difficulty'], string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
};

const RESOURCE_TYPE_COLORS: Record<LearningResource['type'], string> = {
  Course: 'bg-blue-100 text-blue-700',
  Tutorial: 'bg-purple-100 text-purple-700',
  Documentation: 'bg-gray-100 text-gray-700',
  Article: 'bg-yellow-100 text-yellow-700',
  Video: 'bg-red-100 text-red-700',
};

// Collapsible section wrapper
function Section({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const contentId = `${id}-content`;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-jso-primary transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-jso-dark">
          {title}
          <span className="text-xs font-normal bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {count}
          </span>
        </span>
        <span aria-hidden="true" className="text-gray-400 text-sm">
          {open ? '▼' : '▶'}
        </span>
      </button>

      <div
        id={contentId}
        role="region"
        aria-label={title}
        hidden={!open}
        className="divide-y divide-gray-100"
      >
        {children}
      </div>
    </div>
  );
}

// Mini-project card
function MiniProjectCard({ project }: { project: MiniProject }) {
  return (
    <div className="px-5 py-4 bg-white space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <h4 className="font-medium text-jso-dark flex-1">{project.title}</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[project.difficulty]}`}>
          {project.difficulty}
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          ~{project.estimatedDays} day{project.estimatedDays !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-sm text-gray-600">{project.description}</p>

      {project.freeTools.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Free tools</p>
          <div className="flex flex-wrap gap-1.5">
            {project.freeTools.map((tool, i) => (
              <span key={i} className="text-xs bg-jso-light text-jso-dark px-2 py-0.5 rounded">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {project.learningOutcomes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Learning outcomes</p>
          <ul className="space-y-0.5">
            {project.learningOutcomes.map((outcome, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span aria-hidden="true" className="text-jso-secondary mt-0.5">✓</span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// CV rewrite card
function CVRewriteCard({ rewrite }: { rewrite: CVRewrite }) {
  return (
    <div className="px-5 py-4 bg-white space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-xs font-semibold text-red-600 mb-1.5">Before</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rewrite.original}</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-100 p-3">
          <p className="text-xs font-semibold text-green-600 mb-1.5">After</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rewrite.improved}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">{rewrite.rationale}</p>

      {rewrite.githubProjectReference && (
        <p className="text-xs text-jso-primary">
          <span className="font-medium">GitHub reference:</span> {rewrite.githubProjectReference}
        </p>
      )}
    </div>
  );
}

// Learning resource card
function LearningResourceCard({ resource }: { resource: LearningResource }) {
  return (
    <div className="px-5 py-3 bg-white flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-jso-primary hover:underline focus:outline-none
            focus:ring-2 focus:ring-jso-primary rounded"
          aria-label={`${resource.title} — opens in new tab`}
        >
          {resource.title}
        </a>
        <p className="text-xs text-gray-500 mt-0.5">
          {resource.provider} · ~{resource.estimatedHours}h
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESOURCE_TYPE_COLORS[resource.type]}`}>
          {resource.type}
        </span>
        {resource.isFree && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Free
          </span>
        )}
      </div>
    </div>
  );
}

// JSO alignment card
function JSOAlignmentCard({ alignment }: { alignment: JSOAlignment }) {
  return (
    <div className="px-5 py-4 bg-white space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PILLAR_COLORS[alignment.pillar]}`}>
          {alignment.pillar}
        </span>
      </div>
      <p className="text-sm font-medium text-jso-dark">{alignment.recommendation}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{alignment.explanation}</p>
    </div>
  );
}

// Main PlanDisplay component
export default function PlanDisplay({ plan, jobSearchScore, onExport }: PlanDisplayProps) {
  const scoreColor = getScoreColor(jobSearchScore);
  const scoreBg = getScoreBg(jobSearchScore);
  const scoreLabel = getScoreLabel(jobSearchScore);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" aria-label="Improvement plan results">

      {/* Job Search Score */}
      <div
        className={`rounded-2xl border-2 p-6 text-center ${scoreBg}`}
        role="region"
        aria-label="Job search score"
      >
        <p className="text-sm font-medium text-gray-500 mb-1">Job Search Score</p>
        <p className={`text-7xl font-extrabold tabular-nums ${scoreColor}`} aria-live="polite">
          {jobSearchScore}
        </p>
        <p className={`text-lg font-semibold mt-1 ${scoreColor}`}>{scoreLabel}</p>
        {plan.summary && (
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            {plan.summary}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Generated {new Date(plan.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExport}
          aria-label="Export improvement plan"
          className="flex items-center gap-2 rounded-lg bg-jso-accent px-5 py-2.5 text-sm font-semibold
            text-white hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-jso-accent
            focus:ring-offset-2 transition-colors"
        >
          <span aria-hidden="true">⬇</span>
          Export Plan
        </button>
      </div>

      {/* Mini Projects */}
      {plan.miniProjects.length > 0 && (
        <Section id="mini-projects" title="Mini Projects" count={plan.miniProjects.length}>
          {plan.miniProjects.map((project, i) => (
            <MiniProjectCard key={i} project={project} />
          ))}
        </Section>
      )}

      {/* CV Rewrites */}
      {plan.cvRewrites.length > 0 && (
        <Section id="cv-rewrites" title="CV Rewrites" count={plan.cvRewrites.length}>
          {plan.cvRewrites.map((rewrite, i) => (
            <CVRewriteCard key={i} rewrite={rewrite} />
          ))}
        </Section>
      )}

      {/* Learning Resources */}
      {plan.learningResources.length > 0 && (
        <Section id="learning-resources" title="Learning Resources" count={plan.learningResources.length}>
          {plan.learningResources.map((resource, i) => (
            <LearningResourceCard key={i} resource={resource} />
          ))}
        </Section>
      )}

      {/* JSO Pillar Alignments */}
      {plan.jsoAlignment.length > 0 && (
        <Section id="jso-alignment" title="JSO Pillar Alignments" count={plan.jsoAlignment.length}>
          {plan.jsoAlignment.map((alignment, i) => (
            <JSOAlignmentCard key={i} alignment={alignment} />
          ))}
        </Section>
      )}
    </div>
  );
}
