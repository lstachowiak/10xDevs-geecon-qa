# REST API Plan

## 1. Resources

The API is organized around the following main resources:

- **Sessions** - Corresponds to `sessions` table - represents Q&A sessions for individual presentations
- **Questions** - Corresponds to `questions` table - questions asked by participants during sessions
- **Invites** - Corresponds to `invites` table - one-time invitation tokens for new moderators
- **Auth** - Uses Supabase `auth.users` table - handles moderator authentication

## 2. Endpoints

### 2.1 Sessions

#### GET /api/sessions/:slug
Retrieve a single session by its unique URL slug (public access).

**Parameters:**
- Path: `slug` (string) - unique URL identifier for the session

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Introduction to GraphQL",
  "speaker": "John Doe",
  "description": "Learn the basics of GraphQL",
  "sessionDate": "2026-05-15T14:00:00Z",
  "uniqueUrlSlug": "abc123xyz",
  "createdAt": "2026-01-26T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Session with given slug does not exist
```json
{
  "error": "Session not found"
}
```

---

#### GET /api/sessions
List all sessions (moderator only - authenticated).

**Query Parameters:**
- `page` (number, optional, default: 1) - page number for pagination
- `limit` (number, optional, default: 20, max: 100) - items per page
- `sortBy` (string, optional, default: "createdAt") - field to sort by (createdAt, sessionDate, name)
- `sortOrder` (string, optional, default: "desc") - sort order (asc, desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Introduction to GraphQL",
      "speaker": "John Doe",
      "description": "Learn the basics of GraphQL",
      "sessionDate": "2026-05-15T14:00:00Z",
      "uniqueUrlSlug": "abc123xyz",
      "createdAt": "2026-01-26T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
```json
{
  "error": "Authentication required"
}
```

---

#### POST /api/sessions
Create a new session (moderator only - authenticated).

**Request Body:**
```json
{
  "name": "Introduction to GraphQL",
  "speaker": "John Doe",
  "description": "Learn the basics of GraphQL",
  "sessionDate": "2026-05-15T14:00:00Z"
}
```

**Validation:**
- `name`: required, string, min 1 character
- `speaker`: required, string, min 1 character
- `description`: optional, string
- `sessionDate`: optional, ISO 8601 datetime string

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Introduction to GraphQL",
  "speaker": "John Doe",
  "description": "Learn the basics of GraphQL",
  "sessionDate": "2026-05-15T14:00:00Z",
  "uniqueUrlSlug": "abc123xyz",
  "createdAt": "2026-01-26T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `400 Bad Request` - Validation error
```json
{
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "speaker": "Speaker is required"
  }
}
```
- `409 Conflict` - Generated slug already exists (retry internally)

---

#### DELETE /api/sessions/:id
Delete a session (moderator only - authenticated). Cascades to delete all associated questions.

**Parameters:**
- Path: `id` (uuid) - session identifier

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Session does not exist
- `403 Forbidden` - User lacks permission to delete this session

---

### 2.2 Questions

#### GET /api/sessions/:slug/questions
Retrieve all questions for a specific session (public access).

**Parameters:**
- Path: `slug` (string) - unique URL identifier for the session

**Query Parameters:**
- `includeAnswered` (boolean, optional, default: false) - whether to include answered questions

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "content": "What is the difference between REST and GraphQL?",
      "authorName": "Jane Smith",
      "isAnswered": false,
      "upvoteCount": 42,
      "createdAt": "2026-01-26T10:30:00Z"
    },
    {
      "id": "uuid",
      "sessionId": "uuid",
      "content": "How do you handle authentication in GraphQL?",
      "authorName": "Anonymous",
      "isAnswered": true,
      "upvoteCount": 38,
      "createdAt": "2026-01-26T10:25:00Z"
    }
  ]
}
```

**Business Logic:**
- Questions are sorted by `upvoteCount DESC, createdAt ASC`
- If `includeAnswered=false`, filter out questions where `isAnswered=true`

**Error Responses:**
- `404 Not Found` - Session with given slug does not exist

---

#### POST /api/sessions/:slug/questions
Submit a new question for a session (public access).

**Parameters:**
- Path: `slug` (string) - unique URL identifier for the session

**Request Body:**
```json
{
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith"
}
```

**Validation:**
- `content`: required, string, min 5 characters, max 500 characters
- `authorName`: optional, string, defaults to "Anonymous" if not provided

**Response (201 Created):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith",
  "isAnswered": false,
  "upvoteCount": 0,
  "createdAt": "2026-01-26T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Session with given slug does not exist
- `400 Bad Request` - Validation error
```json
{
  "error": "Validation failed",
  "details": {
    "content": "Content must be between 5 and 500 characters"
  }
}
```

---

#### POST /api/questions/:id/upvote
Upvote a question (public access).

**Parameters:**
- Path: `id` (uuid) - question identifier

**Response (200 OK):**
```json
{
  "id": "uuid",
  "upvoteCount": 43
}
```

**Business Logic:**
- Increments `upvoteCount` by 1
- In MVP, there's no prevention of multiple upvotes from the same user/device (client-side only)

**Error Responses:**
- `404 Not Found` - Question does not exist

---

#### PATCH /api/questions/:id
Update question properties (moderator only - authenticated).

**Parameters:**
- Path: `id` (uuid) - question identifier

**Request Body:**
```json
{
  "isAnswered": true
}
```

**Validation:**
- `isAnswered`: optional, boolean

**Response (200 OK):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith",
  "isAnswered": true,
  "upvoteCount": 42,
  "createdAt": "2026-01-26T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Question does not exist
- `400 Bad Request` - Invalid request body

---

#### DELETE /api/questions/:id
Delete a question (moderator only - authenticated).

**Parameters:**
- Path: `id` (uuid) - question identifier

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Question does not exist

---

### 2.3 Invites

#### GET /api/invites
List all invites created by the authenticated moderator (moderator only - authenticated).

**Query Parameters:**
- `status` (string, optional) - filter by status (active, used, expired)
- `page` (number, optional, default: 1) - page number for pagination
- `limit` (number, optional, default: 20, max: 100) - items per page

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "token": "abc123def456",
      "createdByModeratorId": "uuid",
      "expiresAt": "2026-01-29T10:00:00Z",
      "status": "active",
      "createdAt": "2026-01-26T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Business Logic:**
- Automatically update status to "expired" if `expiresAt` < now and status is "active"

**Error Responses:**
- `401 Unauthorized` - User is not authenticated

---

#### POST /api/invites
Generate a new invite token (moderator only - authenticated).

**Response (201 Created):**
```json
{
  "id": "uuid",
  "token": "abc123def456",
  "createdByModeratorId": "uuid",
  "expiresAt": "2026-01-29T10:00:00Z",
  "status": "active",
  "createdAt": "2026-01-26T10:00:00Z",
  "inviteUrl": "https://app.example.com/register?token=abc123def456"
}
```

**Business Logic:**
- Generate a cryptographically secure random token (e.g., 32 characters)
- Set `expiresAt` to now + 72 hours
- Set `createdByModeratorId` to the authenticated user's ID
- Return the complete registration URL with the token

**Error Responses:**
- `401 Unauthorized` - User is not authenticated

---

#### GET /api/invites/:token/validate
Validate an invite token (public access).

**Parameters:**
- Path: `token` (string) - invite token

**Response (200 OK):**
```json
{
  "valid": true,
  "expiresAt": "2026-01-29T10:00:00Z"
}
```

**Response (200 OK - Invalid):**
```json
{
  "valid": false,
  "reason": "Token has expired"
}
```

**Business Logic:**
- Check if token exists
- Check if status is "active"
- Check if expiresAt > now
- Return validation result

**Error Responses:**
- None - always returns 200 with validation result

---

### 2.4 Authentication

#### POST /api/auth/register
Register a new moderator using an invite token (public access).

**Request Body:**
```json
{
  "token": "abc123def456",
  "email": "moderator@example.com",
  "password": "SecurePassword123!"
}
```

**Validation:**
- `token`: required, string
- `email`: required, valid email format
- `password`: required, string, min 8 characters

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "moderator@example.com"
  },
  "session": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600
  }
}
```

**Business Logic:**
- Validate invite token (must be active and not expired)
- Create user in Supabase Auth
- Mark invite as "used"
- Return authentication session

**Error Responses:**
- `400 Bad Request` - Validation error or invalid/expired token
```json
{
  "error": "Invalid or expired invite token"
}
```
- `409 Conflict` - Email already registered
```json
{
  "error": "Email already registered"
}
```


## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **JWT (JSON Web Tokens)** provided by Supabase Auth for authentication:

- **Access Tokens**: Short-lived JWT tokens (1 hour expiration) sent in the `Authorization` header as `Bearer <token>`
- **Refresh Tokens**: Long-lived tokens used to obtain new access tokens
- **Session Management**: Handled by Supabase Auth with automatic token refresh

### 3.2 Authorization Rules

#### Public Endpoints (No Authentication Required)
- `GET /api/sessions/:slug` - View session details
- `GET /api/sessions/:slug/questions` - View questions for a session
- `POST /api/sessions/:slug/questions` - Submit a question
- `POST /api/questions/:id/upvote` - Upvote a question
- `GET /api/invites/:token/validate` - Validate invite token
- `POST /api/auth/register` - Register with invite token
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

#### Protected Endpoints (Authentication Required - Moderators Only)
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create a new session
- `DELETE /api/sessions/:id` - Delete a session
- `PATCH /api/questions/:id` - Update question (mark as answered)
- `DELETE /api/questions/:id` - Delete a question
- `GET /api/invites` - List invites
- `POST /api/invites` - Create invite
- `POST /api/auth/logout` - Logout

### 3.3 Implementation Details

**Supabase Auth Integration:**
- Use Supabase client libraries for authentication
- Leverage `context.locals.supabase` in Astro API routes
- Validate JWT tokens on protected endpoints using Supabase Auth helpers
- Use Supabase Row Level Security (RLS) is NOT implemented in MVP per db-plan.md

**Error Handling:**
- All protected endpoints return `401 Unauthorized` if no valid token is provided
- Expired tokens return `401 Unauthorized` with message to refresh
- Invalid tokens return `401 Unauthorized`

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Sessions
- `name`: required, non-empty string
- `speaker`: required, non-empty string
- `description`: optional string
- `sessionDate`: optional, valid ISO 8601 datetime
- `uniqueUrlSlug`: auto-generated, unique, alphanumeric string (8-12 characters)

#### Questions
- `content`: required, 5-500 characters (enforced by database constraint)
- `authorName`: optional, defaults to "Anonymous", string
- `upvoteCount`: must be >= 0 (enforced by database constraint)
- `isAnswered`: boolean, defaults to false

#### Invites
- `token`: auto-generated, unique, cryptographically secure (32+ characters)
- `expiresAt`: auto-set to now() + 72 hours
- `status`: ENUM(active, used, expired), defaults to active

#### Auth
- `email`: required, valid email format, unique
- `password`: required, minimum 8 characters, should contain mix of letters, numbers, and special characters

### 4.2 Business Logic Implementation

#### Question Sorting (US-003)
- Primary sort: `upvoteCount DESC` (highest votes first)
- Secondary sort: `createdAt ASC` (older questions first when upvotes are equal)
- Implemented at database query level using index `idx_questions_sorting`

#### Upvoting (US-004)
- **Server-side**: Simple increment of `upvoteCount` field
- **Client-side**: Prevention of multiple upvotes using localStorage/sessionStorage
  - Store array of upvoted question IDs per session
  - Disable upvote button if question ID exists in local storage
  - Note: This is not secure and can be bypassed, but acceptable for MVP

#### Question Visibility (US-003, US-004)
- Answered questions (where `isAnswered=true`) are filtered out from the main list by default
- Client can optionally request them with `includeAnswered=true` parameter
- Questions update in real-time via polling (every 5 seconds on client)

#### Invite Token Lifecycle (US-009)
1. **Generation**: Moderator creates invite via `POST /api/invites`
   - Generate cryptographically secure random token
   - Set expiration to now + 72 hours
   - Store with status "active"

2. **Validation**: User validates token via `GET /api/invites/:token/validate`
   - Check token exists
   - Check status is "active"
   - Check expiresAt > now

3. **Usage**: User registers via `POST /api/auth/register`
   - Validate token is still active and not expired
   - Create Supabase Auth user
   - Mark invite status as "used"
   - Return authentication session

4. **Expiration**: Background job or on-demand check
   - When listing invites, automatically update status to "expired" for active invites where expiresAt < now

#### Session URL Generation (US-006)
- Generate unique slug using crypto-random alphanumeric string (e.g., nanoid)
- Length: 8-12 characters for balance between security and usability
- Check uniqueness against database before insertion
- Retry generation if collision occurs (unlikely but possible)
- Full URL format: `https://app.example.com/session/{uniqueUrlSlug}`

#### Cascade Deletion
- Deleting a session automatically deletes all associated questions (database cascade)
- Endpoint returns `204 No Content` on success
- Client should confirm deletion with moderator before calling endpoint

### 4.3 Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

**Standard HTTP Status Codes:**
- `200 OK` - Successful GET/PATCH/POST request
- `201 Created` - Successful resource creation
- `204 No Content` - Successful deletion
- `400 Bad Request` - Validation error or malformed request
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Authenticated but lacking permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Resource conflict (e.g., duplicate email, slug collision)
- `500 Internal Server Error` - Server-side error

### 4.5 CORS Configuration

Allow CORS for:
- All origins in development
- Specific domain(s) in production
- Credentials allowed for authenticated requests

---
