// Core Type Definitions for Career Portfolio Intelligence Agent
// Requirements: 1.1, 1.2, 2.1, 4.1, 5.1, 7.1, 9.1

// ============================================================================
// User Input Types
// ============================================================================

/**
 * User input data for career portfolio analysis
 * Requirements: 1.1, 1.2
 */
export interface UserInput {
  cvScore: number;        // 0-100
  githubUsername: string; // GitHub username
}

// ============================================================================
// GitHub Profile Types
// ============================================================================

/**
 * GitHub repository information
 * Requirements: 3.1, 3.2
 */
export interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  url: string;
}

/**
 * Language statistics from GitHub repositories
 * Key: language name, Value: percentage
 * Requirements: 3.2
 */
export interface LanguageStats {
  [language: string]: number;
}

/**
 * Complete GitHub profile data
 * Requirements: 3.1, 3.2
 */
export interface GitHubProfile {
  username: string;
  publicRepos: number;
  followers: number;
  following: number;
  repositories: Repository[];
  languages: LanguageStats;
  totalCommits: number;
  accountAge: number;      // days since account creation
  recentActivity: boolean; // activity in last 30 days
  activityScore: number;   // calculated 0-100
}

// ============================================================================
// Job Search Score Types
// ============================================================================

/**
 * Job search score calculation result
 * Requirements: 2.1
 */
export interface JobSearchScore {
  total: number;           // 0-100
  cvComponent: number;     // CV score contribution
  githubComponent: number; // GitHub activity contribution
  breakdown: {
    cvScore: number;
    githubActivityScore: number;
    weights: {
      cv: number;        // 0.6
      github: number;    // 0.4
    };
  };
}

// ============================================================================
// Improvement Plan Types
// ============================================================================

/**
 * Mini-project recommendation
 * Requirements: 4.2, 8.1
 */
export interface MiniProject {
  title: string;
  description: string;
  estimatedDays: number;
  freeTools: string[];     // List of free tools/services
  learningOutcomes: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

/**
 * CV bullet point rewrite recommendation
 * Requirements: 4.3
 */
export interface CVRewrite {
  original: string;
  improved: string;
  rationale: string;
  githubProjectReference: string | null;
}

/**
 * Learning resource recommendation
 * Requirements: 4.4, 8.2
 */
export interface LearningResource {
  title: string;
  type: 'Course' | 'Tutorial' | 'Documentation' | 'Article' | 'Video';
  url: string;
  provider: string;
  estimatedHours: number;
  isFree: boolean;         // Must always be true
}

/**
 * JSO pillar alignment
 * Requirements: 4.7
 */
export interface JSOAlignment {
  pillar: 'Governance' | 'Workers' | 'Community' | 'Environment' | 'Customers' | 'Sustainability';
  recommendation: string;
  explanation: string;
}

/**
 * Complete improvement plan
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7
 */
export interface ImprovementPlan {
  summary: string;
  jobSearchScore: number;
  miniProjects: MiniProject[];
  cvRewrites: CVRewrite[];
  learningResources: LearningResource[];
  jsoAlignment: JSOAlignment[];
  generatedAt: string;
}

// ============================================================================
// Reasoning Trace Types
// ============================================================================

/**
 * Single step in reasoning trace
 * Requirements: 5.2
 */
export interface ReasoningStep {
  stepNumber: number;
  title: string;
  description: string;
  data: Record<string, any>; // Supporting data for this step
}

/**
 * Complete reasoning trace
 * Requirements: 5.1, 5.2
 */
export interface ReasoningTrace {
  steps: ReasoningStep[];
  generatedAt: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Audit log entry for ethical oversight
 * Requirements: 7.1, 7.2
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  inputHash: string;        // Hashed CV score + GitHub username
  cvScore: number;
  jobSearchScore: number;
  planGenerated: boolean;
  biasCheckPassed: boolean;
  biasWarnings: string[];
  responseTimeMs: number;
  errorCode: string | null;
}

// ============================================================================
// Bias Check Types
// ============================================================================

/**
 * Bias check result
 * Requirements: 9.1
 */
export interface BiasCheckResult {
  passed: boolean;
  warnings: string[];
  suggestions: string[];
  checks: {
    languageDiversity: boolean;
    resourceAccessibility: boolean;
    skillLevelAppropriate: boolean;
    timeCommitmentRealistic: boolean;
    costVerified: boolean;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Input validation result
 * Requirements: 1.3, 1.4
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Successful analysis response
 * Requirements: 2.1, 4.1, 5.1
 */
export interface AnalysisResponse {
  jobSearchScore: number;
  improvementPlan: ImprovementPlan;
  reasoningTrace: ReasoningTrace;
  timestamp: string;
}

/**
 * Error response
 * Requirements: 12.1, 12.2, 12.3
 */
export interface ErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR' | 'GITHUB_ERROR' | 'GEMINI_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR';
  details?: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * Analysis metrics for tracking
 * Requirements: 20.1, 20.2
 */
export interface AnalysisMetrics {
  timestamp: string;
  responseTimeMs: number;
  success: boolean;
  errorType: string | null;
  cvScore: number;
  jobSearchScore: number;
  githubLanguages: string[];
}

/**
 * Aggregated metrics summary
 * Requirements: 20.3, 20.4, 20.5, 20.6
 */
export interface MetricsSummary {
  totalAnalyses: number;
  averageResponseTime: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  topLanguages: Array<{ language: string; count: number }>;
  averageCVScore: number;
  averageJobSearchScore: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cached improvement plan
 * Requirements: 6.1, 6.2
 */
export interface CachedPlan {
  plan: ImprovementPlan;
  reasoningTrace: ReasoningTrace;
  jobSearchScore: number;
  cachedAt: string;
  expiresAt: string;
}

/**
 * Cached GitHub profile
 * Requirements: 15.5
 */
export interface CachedGitHubProfile {
  profile: GitHubProfile;
  cachedAt: string;
  expiresAt: string;
}

/**
 * Session data
 * Requirements: 6.1
 */
export interface SessionData {
  lastCVScore: number | null;
  lastGitHubUsername: string | null;
  sessionStarted: string;
}

// ============================================================================
// Internal Service Types
// ============================================================================

/**
 * Analysis input for internal services
 */
export interface AnalysisInput {
  cvScore: number;
  githubUsername: string;
  githubProfile: GitHubProfile;
  jobSearchScore: number;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  cvScore?: number;
  githubUsername?: string;
  userAgent?: string;
  endpoint?: string;
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  timestamp: string;
  errorType: string;
  message: string;
  stack?: string;
  context: ErrorContext;
}
