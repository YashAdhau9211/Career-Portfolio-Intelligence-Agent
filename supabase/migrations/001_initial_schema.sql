-- Career Portfolio Intelligence Agent - Initial Database Schema
-- Requirements: 7.1, 7.2, 7.4, 20.1, 20.2, 20.4, 16.5

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Audit Logs Table
-- Stores anonymized audit entries for each analysis
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_hash TEXT NOT NULL,
  cv_score INTEGER CHECK (cv_score >= 0 AND cv_score <= 100),
  job_search_score INTEGER CHECK (job_search_score >= 0 AND job_search_score <= 100),
  plan_generated BOOLEAN NOT NULL DEFAULT false,
  bias_check_passed BOOLEAN NOT NULL DEFAULT false,
  bias_warnings JSONB,
  response_time_ms INTEGER,
  error_code TEXT
);

-- ============================================
-- Metrics Table
-- Stores performance and usage metrics
-- ============================================
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  cv_score INTEGER CHECK (cv_score >= 0 AND cv_score <= 100),
  job_search_score INTEGER CHECK (job_search_score >= 0 AND job_search_score <= 100),
  github_languages JSONB
);

-- ============================================
-- Demo Results Table
-- Stores showcase/demo analysis results
-- ============================================
CREATE TABLE demo_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cv_score INTEGER NOT NULL,
  github_username TEXT NOT NULL,
  improvement_plan JSONB NOT NULL,
  reasoning_trace JSONB NOT NULL
);

-- ============================================
-- Indexes
-- ============================================

-- Fast time-based queries for audit logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Fast time-based queries for metrics
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);

-- Partial index for error code lookups (only indexes non-null values)
CREATE INDEX idx_audit_logs_error_code ON audit_logs(error_code) WHERE error_code IS NOT NULL;
