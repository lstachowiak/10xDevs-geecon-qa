/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all type definitions for API requests and responses.
 * All DTOs are derived from database entities to ensure type safety and consistency.
 */

import type { Tables, Enums } from "./db/database.types";

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Converts snake_case database field names to camelCase for API responses
 */
type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : S;

type CamelCaseKeys<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K];
};

// =============================================================================
// Database Entity Types (camelCase versions)
// =============================================================================

/**
 * Session entity from database with camelCase field names
 * Source: sessions table
 */
export type SessionEntity = CamelCaseKeys<Tables<"sessions">>;

/**
 * Question entity from database with camelCase field names
 * Source: questions table
 */
export type QuestionEntity = CamelCaseKeys<Tables<"questions">>;

/**
 * Invite entity from database with camelCase field names
 * Source: invites table
 */
export type InviteEntity = CamelCaseKeys<Tables<"invites">>;

/**
 * Invite status enum
 * Source: invite_status enum
 */
export type InviteStatus = Enums<"invite_status">;

// =============================================================================
// Common DTOs
// =============================================================================

/**
 * Pagination metadata for list responses
 * Used in: GET /api/sessions, GET /api/invites
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard error response
 * Used in: All error responses
 */
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}

// =============================================================================
// Session DTOs
// =============================================================================

/**
 * Session data transfer object
 * Used in: GET /api/sessions/:slug, POST /api/sessions response, GET /api/sessions list items
 * Source: SessionEntity
 */
export interface SessionDTO {
  id: string;
  name: string;
  speaker: string;
  description: string | null;
  sessionDate: string | null;
  uniqueUrlSlug: string;
  createdAt: string;
}

/**
 * Command to create a new session
 * Used in: POST /api/sessions request
 * Source: Partial of SessionDTO (only input fields)
 */
export interface CreateSessionCommand {
  name: string;
  speaker: string;
  description?: string;
  sessionDate?: string;
}

/**
 * Response for session list endpoint
 * Used in: GET /api/sessions response
 */
export interface SessionListResponseDTO {
  data: SessionDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// Question DTOs
// =============================================================================

/**
 * Question data transfer object
 * Used in: GET /api/sessions/:slug/questions, POST /api/sessions/:slug/questions response
 * Source: QuestionEntity
 */
export interface QuestionDTO {
  id: string;
  sessionId: string;
  content: string;
  authorName: string;
  isAnswered: boolean;
  upvoteCount: number;
  createdAt: string;
}

/**
 * Command to create a new question
 * Used in: POST /api/sessions/:slug/questions request
 * Source: Subset of QuestionDTO (only user-provided fields)
 */
export interface CreateQuestionCommand {
  content: string;
  authorName?: string;
}

/**
 * Command to update a question
 * Used in: PATCH /api/questions/:id request
 * Source: Partial of QuestionDTO (only updatable fields)
 */
export interface UpdateQuestionCommand {
  isAnswered?: boolean;
}

/**
 * Response for questions list endpoint
 * Used in: GET /api/sessions/:slug/questions response
 */
export interface QuestionsListResponseDTO {
  data: QuestionDTO[];
}

/**
 * Response for upvote endpoint
 * Used in: POST /api/questions/:id/upvote response
 */
export interface UpvoteResponseDTO {
  id: string;
  upvoteCount: number;
}

// =============================================================================
// Invite DTOs
// =============================================================================

/**
 * Invite data transfer object
 * Used in: GET /api/invites list items
 * Source: InviteEntity
 */
export interface InviteDTO {
  id: string;
  token: string;
  createdByModeratorId: string | null;
  expiresAt: string;
  status: InviteStatus;
  createdAt: string;
}

/**
 * Invite with URL for sharing
 * Used in: POST /api/invites response
 * Source: InviteDTO + inviteUrl
 */
export interface InviteWithUrlDTO extends InviteDTO {
  inviteUrl: string;
}

/**
 * Response for invite list endpoint
 * Used in: GET /api/invites response
 */
export interface InviteListResponseDTO {
  data: InviteDTO[];
  pagination: PaginationDTO;
}

/**
 * Response for invite token validation
 * Used in: GET /api/invites/:token/validate response
 */
export interface ValidateInviteResponseDTO {
  valid: boolean;
  expiresAt?: string;
  reason?: string;
}

// =============================================================================
// Authentication DTOs
// =============================================================================

/**
 * Command to register a new moderator
 * Used in: POST /api/auth/register request
 */
export interface RegisterCommand {
  token: string;
  email: string;
  password: string;
}

/**
 * User information in authentication response
 * Used in: POST /api/auth/register response, POST /api/auth/login response
 * Source: Supabase auth.users
 */
export interface AuthUserDTO {
  id: string;
  email: string;
}

/**
 * Session information in authentication response
 * Used in: POST /api/auth/register response, POST /api/auth/login response
 * Source: Supabase session object
 */
export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Response for authentication endpoints
 * Used in: POST /api/auth/register response, POST /api/auth/login response
 */
export interface AuthResponseDTO {
  user: AuthUserDTO;
  session: AuthSessionDTO;
}
