-- ============================================================================
-- Migration: Drop All RLS Policies
-- Created: 2026-01-26 13:00:00 UTC
-- Description: Disables all Row Level Security policies for sessions,
--              questions, and invites tables
-- ============================================================================

-- ============================================================================
-- 1. DROP POLICIES FOR SESSIONS TABLE
-- ============================================================================

drop policy if exists "anon_select_sessions" on sessions;
drop policy if exists "authenticated_select_sessions" on sessions;
drop policy if exists "authenticated_insert_sessions" on sessions;
drop policy if exists "authenticated_update_sessions" on sessions;
drop policy if exists "authenticated_delete_sessions" on sessions;

-- ============================================================================
-- 2. DROP POLICIES FOR QUESTIONS TABLE
-- ============================================================================

drop policy if exists "anon_select_questions" on questions;
drop policy if exists "anon_insert_questions" on questions;
drop policy if exists "authenticated_select_questions" on questions;
drop policy if exists "authenticated_insert_questions" on questions;
drop policy if exists "authenticated_update_questions" on questions;
drop policy if exists "authenticated_delete_questions" on questions;

-- ============================================================================
-- 3. DROP POLICIES FOR INVITES TABLE
-- ============================================================================

drop policy if exists "authenticated_select_invites" on invites;
drop policy if exists "authenticated_insert_invites" on invites;
drop policy if exists "authenticated_update_invites" on invites;
drop policy if exists "authenticated_delete_invites" on invites;

-- ============================================================================
-- 4. DISABLE ROW LEVEL SECURITY
-- ============================================================================

alter table sessions disable row level security;
alter table questions disable row level security;
alter table invites disable row level security;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Note: RLS has been completely disabled on all tables
--       All access is now controlled only by table-level GRANT permissions
-- ============================================================================
