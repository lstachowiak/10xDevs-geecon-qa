# API Endpoint Implementation Plan: POST /api/sessions/:slug/questions

## 1. Przegląd punktu końcowego

Endpoint umożliwia publiczne dodawanie pytań do sesji Q&A. Użytkownicy mogą przesłać pytanie wraz z opcjonalnym imieniem autora. Endpoint nie wymaga uwierzytelniania, co pozwala na swobodne zadawanie pytań przez uczestników konferencji bez konieczności logowania.

**Kluczowe funkcjonalności:**
- Tworzenie nowego pytania dla konkretnej sesji
- Automatyczne ustawienie domyślnego imienia "Anonymous" jeśli nie podano
- Walidacja treści pytania (5-500 znaków)
- Weryfikacja istnienia sesji przed dodaniem pytania

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
/api/sessions/:slug/questions
```

### Parametry

**Path Parameters:**
- `slug` (string, required) - Unikalny identyfikator URL sesji (pole `unique_url_slug` w tabeli `sessions`)

**Request Headers:**
- `Content-Type: application/json`

**Request Body:**
```typescript
{
  content: string;        // Required, 5-500 characters
  authorName?: string;    // Optional, defaults to "Anonymous"
}
```

**Przykład żądania:**
```json
{
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith"
}
```

**Przykład minimalnego żądania:**
```json
{
  "content": "Could you explain this concept?"
}
```

## 3. Wykorzystywane typy

### Command Model (Request)
```typescript
// Z src/types.ts
interface CreateQuestionCommand {
  content: string;
  authorName?: string;
}
```

### DTO (Response)
```typescript
// Z src/types.ts
interface QuestionDTO {
  id: string;
  sessionId: string;
  content: string;
  authorName: string;
  isAnswered: boolean;
  upvoteCount: number;
  createdAt: string;
}
```

### Error Response
```typescript
// Z src/types.ts
interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Database Types
```typescript
// Z src/db/database.types.ts
Tables<'questions'> // dla operacji INSERT
Tables<'sessions'>  // dla weryfikacji istnienia sesji
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "660e8400-e29b-41d4-a716-446655440001",
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith",
  "isAnswered": false,
  "upvoteCount": 0,
  "createdAt": "2026-01-27T10:30:00Z"
}
```

### Błąd walidacji (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": {
    "content": "Content must be between 5 and 500 characters"
  }
}
```

### Sesja nie znaleziona (404 Not Found)
```json
{
  "error": "Session not found"
}
```

### Błąd serwera (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### 5.1. Diagram przepływu

```
Client Request
    ↓
1. Astro API Route Handler (/api/sessions/[slug]/questions.ts)
    ↓
2. Walidacja Request Body (Zod)
    ↓ (jeśli błąd → 400)
3. Sessions Service - getSessionBySlug()
    ↓
4. Supabase Query (SELECT sessions WHERE unique_url_slug = ?)
    ↓ (jeśli nie znaleziono → 404)
5. Questions Service - createQuestion()
    ↓
6. Supabase Insert (INSERT INTO questions)
    ↓
7. Transformacja database entity → QuestionDTO (snake_case → camelCase)
    ↓
8. Response 201 Created
    ↓
Client Response
```

### 5.2. Szczegółowy przepływ

**Krok 1: Przyjęcie żądania**
- Astro route handler w `src/pages/api/sessions/[slug]/questions.ts`
- Wyciągnięcie `slug` z `Astro.params`
- Parsowanie JSON body

**Krok 2: Walidacja danych wejściowych**
- Użycie Zod schema do walidacji `CreateQuestionCommand`
- Sprawdzenie długości `content` (5-500 znaków)
- Ustawienie domyślnej wartości "Anonymous" dla `authorName` jeśli brak

**Krok 3: Weryfikacja istnienia sesji**
- Wywołanie `sessionsService.getSessionBySlug(supabase, slug)`
- Query do Supabase: `SELECT id FROM sessions WHERE unique_url_slug = slug`
- Jeśli brak wyników → return 404

**Krok 4: Utworzenie pytania**
- Wywołanie `questionsService.createQuestion(supabase, sessionId, command)`
- Supabase INSERT z:
  - `session_id` (z kroku 3)
  - `content` (z request body)
  - `author_name` (z request body lub "Anonymous")
  - Domyślne wartości dla `is_answered`, `upvote_count` ustawione przez bazę danych

**Krok 5: Transformacja odpowiedzi**
- Konwersja snake_case database fields → camelCase DTO fields
- Formatowanie `created_at` do ISO 8601 string

**Krok 6: Zwrócenie odpowiedzi**
- Status 201 Created
- Body: QuestionDTO

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie i Autoryzacja
- **Brak uwierzytelniania**: Endpoint jest publiczny
- **Ryzyko**: Możliwość spamowania pytań
- **Rekomendacja**: Rozważyć implementację rate limiting w przyszłości

### 6.2. Walidacja danych wejściowych

**Obowiązkowa walidacja:**
- `content`: min 5, max 500 znaków (zgodnie z CHECK constraint w bazie)
- `authorName`: max 255 znaków (zalecane, choć brak w specyfikacji)
- Typ danych: string dla obu pól

**Zod Schema:**
```typescript
const createQuestionSchema = z.object({
  content: z.string()
    .min(5, 'Content must be at least 5 characters long')
    .max(500, 'Content must not exceed 500 characters'),
  authorName: z.string()
    .max(255, 'Author name must not exceed 255 characters')
    .optional()
    .default('Anonymous')
});
```

### 6.3. Sanityzacja danych
- **XSS Prevention**: Supabase automatycznie escapuje dane w queries
- **SQL Injection**: Chronione przez Supabase parametryzowane queries
- **Dodatkowa warstwa**: Frontend powinien sanityzować dane przed wyświetleniem

### 6.4. CORS
- Endpoint publiczny wymaga odpowiedniej konfiguracji CORS w Astro middleware
- Należy określić dozwolone origins jeśli frontend jest na innej domenie

### 6.5. Rate Limiting
- **Brak w obecnej specyfikacji**
- **Rekomendacja**: Implementacja w middleware (np. max 10 pytań/minutę z jednego IP)
- **Cel**: Ochrona przed spamem i DoS attacks

### 6.6. Content Security
- Maksymalna długość 500 znaków chroni przed zbyt dużymi payload
- Weryfikacja `unique_url_slug` zapobiega SQL injection (używamy prepared statements)

## 7. Obsługa błędów

### 7.1. Tabela błędów

| Kod | Scenariusz | Response | Logowanie |
|-----|------------|----------|-----------|
| 400 | Brak `content` w body | `{ error: "Validation failed", details: { content: "Required" } }` | Warning |
| 400 | `content` < 5 znaków | `{ error: "Validation failed", details: { content: "Content must be at least 5 characters long" } }` | Warning |
| 400 | `content` > 500 znaków | `{ error: "Validation failed", details: { content: "Content must not exceed 500 characters" } }` | Warning |
| 400 | Nieprawidłowy JSON | `{ error: "Invalid request body" }` | Warning |
| 400 | Nieprawidłowy typ danych | `{ error: "Validation failed", details: { ... } }` | Warning |
| 404 | Sesja nie istnieje | `{ error: "Session not found" }` | Info |
| 500 | Błąd bazy danych | `{ error: "Internal server error" }` | Error (z pełnym stack trace) |
| 500 | Nieoczekiwany błąd | `{ error: "Internal server error" }` | Error (z pełnym stack trace) |

### 7.2. Implementacja obsługi błędów

**Try-Catch struktura:**
```typescript
try {
  // 1. Walidacja Zod
  // 2. Weryfikacja sesji
  // 3. Utworzenie pytania
  // 4. Return 201
} catch (error) {
  if (error instanceof z.ZodError) {
    // 400 - Validation failed
  } else if (error.message === 'Session not found') {
    // 404
  } else {
    // 500 - log full error, return generic message
  }
}
```

**Logging strategia:**
- Development: Pełne szczegóły błędów w konsoli
- Production: Ogólne komunikaty dla klienta, szczegóły w server logs
- Nie ujawniać wewnętrznych szczegółów implementacji w response

### 7.3. Guard Clauses

Zgodnie z coding practices, używać early returns:

```typescript
// 1. Walidacja request body
const validation = createQuestionSchema.safeParse(body);
if (!validation.success) {
  return new Response(JSON.stringify({
    error: 'Validation failed',
    details: formatZodErrors(validation.error)
  }), { status: 400 });
}

// 2. Weryfikacja sesji
const session = await sessionsService.getSessionBySlug(supabase, slug);
if (!session) {
  return new Response(JSON.stringify({
    error: 'Session not found'
  }), { status: 404 });
}

// 3. Happy path - utworzenie pytania
const question = await questionsService.createQuestion(
  supabase,
  session.id,
  validation.data
);

return new Response(JSON.stringify(question), {
  status: 201,
  headers: { 'Content-Type': 'application/json' }
});
```

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

**Database Queries:**
- 2 query do bazy danych (SELECT session, INSERT question)
- Potencjalne opóźnienie przy dużym ruchu

**Network Latency:**
- Komunikacja z Supabase (external service)
- RTT może wpłynąć na response time

**JSON Parsing:**
- Parsing request body - minimalny overhead dla małych payloads

### 8.2. Strategie optymalizacji

**Database:**
- **Index na `unique_url_slug`**: UNIQUE constraint już tworzy index automatycznie
- **Connection pooling**: Supabase client obsługuje to automatycznie
- **Prepared statements**: Używane domyślnie przez Supabase

**Caching:**
- Nie zalecane dla tego endpointu (POST operation, zawsze tworzy nowe dane)
- Można cache'ować wynik sprawdzenia sesji jeśli wiele pytań dodawanych jednocześnie (edge case)

**Response Time Target:**
- < 200ms dla 95% requestów
- < 500ms dla 99% requestów

**Monitoring:**
- Śledzenie czasu odpowiedzi endpointu
- Monitoring liczby błędów 500
- Tracking liczby pytań per sesja (dla wykrywania spamu)

### 8.3. Scalability

**Horizontal Scaling:**
- Endpoint jest stateless, łatwo skalować horizontalnie
- Supabase obsługuje connection pooling i load balancing

**Database Constraints:**
- Foreign key do `sessions` zapewnia data integrity
- CASCADE DELETE zabezpiecza przed orphaned records

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Services
**Plik: `src/lib/services/sessions.service.ts`**
```typescript
export async function getSessionBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('unique_url_slug', slug)
    .single();
  
  if (error || !data) return null;
  return data;
}
```

**Plik: `src/lib/services/questions.service.ts`**
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateQuestionCommand, QuestionDTO } from '@/types';

export async function createQuestion(
  supabase: SupabaseClient,
  sessionId: string,
  command: CreateQuestionCommand
): Promise<QuestionDTO> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      session_id: sessionId,
      content: command.content,
      author_name: command.authorName || 'Anonymous'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    sessionId: data.session_id,
    content: data.content,
    authorName: data.author_name,
    isAnswered: data.is_answered,
    upvoteCount: data.upvote_count,
    createdAt: data.created_at
  };
}
```

### Krok 2: Utworzenie Zod Schema
**Plik: `src/lib/schemas/question.schema.ts`** (nowy plik)
```typescript
import { z } from 'zod';

export const createQuestionSchema = z.object({
  content: z.string()
    .min(5, 'Content must be at least 5 characters long')
    .max(500, 'Content must not exceed 500 characters'),
  authorName: z.string()
    .max(255, 'Author name must not exceed 255 characters')
    .optional()
    .default('Anonymous')
});
```

### Krok 3: Utworzenie Astro API Route
**Plik: `src/pages/api/sessions/[slug]/questions.ts`**
```typescript
import type { APIRoute } from 'astro';
import { createQuestionSchema } from '@/lib/schemas/question.schema';
import { getSessionBySlug } from '@/lib/services/sessions.service';
import { createQuestion } from '@/lib/services/questions.service';
import type { ErrorResponseDTO, QuestionDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate input
    const validation = createQuestionSchema.safeParse(body);
    if (!validation.success) {
      const details: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          details[err.path[0].toString()] = err.message;
        }
      });

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 4. Verify session exists
    const slug = params.slug;
    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Session slug is required' } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await getSessionBySlug(supabase, slug);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' } as ErrorResponseDTO),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create question
    const question = await createQuestion(
      supabase,
      session.id,
      validation.data
    );

    // 6. Return success response
    return new Response(
      JSON.stringify(question as QuestionDTO),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Log error (in production, use proper logging service)
    console.error('Error creating question:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 4: Aktualizacja Middleware (jeśli potrzebne)
**Plik: `src/middleware/index.ts`**
- Upewnić się, że Supabase client jest dostępny w `locals`
- Dodać obsługę CORS jeśli frontend na innej domenie
- Rozważyć dodanie rate limiting middleware

### Krok 5: Testy
**Unit testy dla services:**
- `sessions.service.ts`: getSessionBySlug()
- `questions.service.ts`: createQuestion()

**Integration testy dla endpoint:**
- POST z poprawnymi danymi → 201
- POST bez content → 400
- POST z za krótkim content → 400
- POST z za długim content → 400
- POST do nieistniejącej sesji → 404
- POST z nieprawidłowym JSON → 400

**Przykładowe test cases:**
```typescript
// Test 1: Success case
POST /api/sessions/valid-slug/questions
Body: { content: "Valid question?", authorName: "John" }
Expected: 201 + QuestionDTO

// Test 2: Missing content
POST /api/sessions/valid-slug/questions
Body: { authorName: "John" }
Expected: 400 + validation error

// Test 3: Content too short
POST /api/sessions/valid-slug/questions
Body: { content: "Hi?" }
Expected: 400 + validation error

// Test 4: Session not found
POST /api/sessions/invalid-slug/questions
Body: { content: "Valid question?" }
Expected: 404

// Test 5: Default author name
POST /api/sessions/valid-slug/questions
Body: { content: "Valid question?" }
Expected: 201 + QuestionDTO with authorName="Anonymous"
```

### Krok 6: Dokumentacja
- Dodać endpoint do API documentation
- Udokumentować error codes i responses
- Przykłady użycia z curl/fetch

### Krok 7: Monitoring i Logging
- Skonfigurować monitoring czasu odpowiedzi
- Tracking błędów 500
- Alert przy wysokiej liczbie błędów
- Dashboard z metrykami: liczba pytań/minutę, błędy, latency

### Krok 8: Deploy
- Code review
- Merge do main branch
- Deploy do staging environment
- Testy E2E na staging
- Deploy do production
- Monitoring przez pierwsze 24h

## 10. Checklist przed deploy

- [ ] Services utworzone i przetestowane
- [ ] Zod schema poprawnie waliduje wszystkie edge cases
- [ ] API route handler obsługuje wszystkie error cases
- [ ] Middleware zapewnia dostęp do Supabase client
- [ ] Unit testy napisane i przechodzą
- [ ] Integration testy napisane i przechodzą
- [ ] Error handling zgodny z specyfikacją
- [ ] Logging skonfigurowane
- [ ] CORS skonfigurowane (jeśli potrzebne)
- [ ] Dokumentacja zaktualizowana
- [ ] Code review przeprowadzony
- [ ] Testy na staging środowisku przeszły
- [ ] Monitoring setup gotowy
