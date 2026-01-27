# API Endpoint Implementation Plan: GET /api/sessions/:slug/questions

## 1. Przegląd punktu końcowego

Endpoint publiczny umożliwiający pobranie wszystkich pytań dla konkretnej sesji Q&A. Użytkownicy mogą opcjonalnie filtrować pytania, aby ukryć te, które zostały już odpowiedziane. Pytania są sortowane według liczby głosów (malejąco) oraz daty utworzenia (rosnąco), co pozwala wyświetlać najpopularniejsze i najstarsze pytania na górze listy.

**Główne funkcjonalności:**
- Pobranie pytań dla sesji identyfikowanej przez unikalny slug URL
- Opcjonalne filtrowanie pytań już odpowiedzianych
- Sortowanie według upvoteCount DESC, createdAt ASC
- Publiczny dostęp (bez wymagania uwierzytelnienia)

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/sessions/:slug/questions
```

### Parametry

#### Parametry ścieżki (Path Parameters)
- **slug** (string, wymagany)
  - Unikalny identyfikator URL sesji
  - Format: string (alfanumeryczny z możliwymi znakami specjalnymi)
  - Przykład: `abc123xyz`

#### Parametry zapytania (Query Parameters)
- **includeAnswered** (boolean, opcjonalny)
  - Określa, czy zwracać pytania już odpowiedziane
  - Wartość domyślna: `false`
  - Możliwe wartości: `true`, `false`, `1`, `0`
  - Przykład: `?includeAnswered=true`

### Request Body
Brak (metoda GET)

### Przykładowe wywołanie
```
GET /api/sessions/abc123xyz/questions
GET /api/sessions/abc123xyz/questions?includeAnswered=true
GET /api/sessions/abc123xyz/questions?includeAnswered=false
```

## 3. Wykorzystywane typy

### DTO (Data Transfer Objects)

#### QuestionDTO
```typescript
export interface QuestionDTO {
  id: string;
  sessionId: string;
  content: string;
  authorName: string;
  isAnswered: boolean;
  upvoteCount: number;
  createdAt: string;
}
```

#### QuestionsListResponseDTO
```typescript
export interface QuestionsListResponseDTO {
  data: QuestionDTO[];
}
```

#### ErrorResponseDTO
```typescript
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Typy wewnętrzne

#### GetQuestionsQuery (do utworzenia)
```typescript
interface GetQuestionsQuery {
  includeAnswered: boolean;
}
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (200 OK)

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "sessionId": "uuid-session",
      "content": "What is the difference between REST and GraphQL?",
      "authorName": "Jane Smith",
      "isAnswered": false,
      "upvoteCount": 42,
      "createdAt": "2026-01-26T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "sessionId": "uuid-session",
      "content": "How do you handle authentication in GraphQL?",
      "authorName": "Anonymous",
      "isAnswered": true,
      "upvoteCount": 38,
      "createdAt": "2026-01-26T10:25:00Z"
    }
  ]
}
```

### Odpowiedź błędu (404 Not Found)

**Status:** `404 Not Found`

**Content-Type:** `application/json`

**Body:**
```json
{
  "error": "Session not found"
}
```

### Odpowiedź błędu (400 Bad Request)

**Status:** `400 Bad Request`

**Content-Type:** `application/json`

**Body:**
```json
{
  "error": "Validation failed",
  "details": {
    "includeAnswered": "Must be a boolean value"
  }
}
```

### Odpowiedź błędu (500 Internal Server Error)

**Status:** `500 Internal Server Error`

**Content-Type:** `application/json`

**Body:**
```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### Diagram przepływu
```
1. Żądanie HTTP GET → Astro Endpoint Handler
2. Walidacja parametrów (slug, includeAnswered)
3. Wywołanie sessions.service → getSessionBySlug(slug)
4. Jeśli sesja nie istnieje → Zwróć 404
5. Wywołanie questions.service → getQuestionsBySessionId(sessionId, includeAnswered)
6. Supabase query z sortowaniem i filtrowaniem
7. Transformacja danych z snake_case → camelCase
8. Zwrócenie QuestionsListResponseDTO → 200 OK
```

### Szczegółowy przepływ

#### Krok 1: Walidacja parametrów wejściowych
- Wyciągnięcie `slug` z parametrów ścieżki
- Parsowanie parametru `includeAnswered` z query string
- Walidacja typu boolean dla `includeAnswered`

#### Krok 2: Weryfikacja istnienia sesji
- Wywołanie `getSessionBySlug(supabase, slug)` z sessions.service
- Jeśli zwraca `null` → Zwrócenie błędu 404

#### Krok 3: Pobranie pytań z bazy danych
- Wywołanie nowej funkcji `getQuestionsBySessionId(supabase, sessionId, includeAnswered)`
- Zapytanie do Supabase:
  ```typescript
  let query = supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId);
  
  if (!includeAnswered) {
    query = query.eq('is_answered', false);
  }
  
  const { data, error } = await query
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: true });
  ```

#### Krok 4: Transformacja danych
- Konwersja snake_case (baza danych) → camelCase (API)
- Mapowanie każdego rekordu na QuestionDTO

#### Krok 5: Zwrócenie odpowiedzi
- Utworzenie obiektu QuestionsListResponseDTO
- Ustawienie odpowiednich nagłówków HTTP
- Zwrócenie odpowiedzi JSON

### Interakcje z bazą danych

#### Zapytanie 1: Weryfikacja sesji
```sql
SELECT id 
FROM sessions 
WHERE unique_url_slug = $1 
LIMIT 1;
```

#### Zapytanie 2: Pobranie pytań
```sql
SELECT id, session_id, content, author_name, is_answered, upvote_count, created_at
FROM questions
WHERE session_id = $1
  AND (is_answered = false OR $2 = true)  -- filtrowanie opcjonalne
ORDER BY upvote_count DESC, created_at ASC;
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Brak wymaganego uwierzytelnienia** - endpoint jest publiczny
- Nie wymaga tokenu autoryzacji

### Autoryzacja
- **Brak kontroli dostępu** - każdy może odczytać pytania dla dowolnej sesji
- Dotyczy to publicznego charakteru aplikacji Q&A

### Walidacja danych wejściowych

#### Walidacja parametru `slug`
- **Typ:** string
- **Format:** brak specjalnych wymagań formatowych (obsługiwane przez Supabase query)
- **Zabezpieczenie przed SQL Injection:** Supabase automatycznie używa parametryzowanych zapytań
- **Sanityzacja:** Nie jest wymagana dodatkowa sanityzacja

#### Walidacja parametru `includeAnswered`
- **Typ:** boolean
- **Dozwolone wartości:** `true`, `false`, `"true"`, `"false"`, `1`, `0`, `"1"`, `"0"`
- **Schemat Zod:**
  ```typescript
  const getQuestionsQuerySchema = z.object({
    includeAnswered: z.coerce.boolean().default(false)
  });
  ```

### Ochrona przed atakami

#### SQL Injection
- ✅ Zabezpieczone przez Supabase client (parametryzowane zapytania)
- ✅ Brak surowych zapytań SQL w kodzie aplikacji

#### NoSQL Injection
- ✅ Nie dotyczy (używamy PostgreSQL)

#### XSS (Cross-Site Scripting)
- ✅ Dane zwracane jako JSON, bez renderowania HTML
- ✅ Content-Type: application/json zapobiega interpretacji jako HTML
- ⚠️ Frontend odpowiedzialny za escapowanie przy wyświetlaniu

#### DoS (Denial of Service)
- ⚠️ **Potencjalne zagrożenie:** Brak limitu wyników
- 💡 **Rekomendacja:** Rozważyć wprowadzenie paginacji w przyszłości
- 💡 **Rekomendacja:** Monitorowanie liczby zapytań (rate limiting na poziomie infrastruktury)

#### Excessive Data Exposure
- ✅ Zwracamy tylko niezbędne pola zdefiniowane w QuestionDTO
- ✅ Nie ujawniamy wrażliwych danych systemowych

### Headers bezpieczeństwa

Rekomendowane nagłówki (konfigurowane na poziomie middleware lub reverse proxy):
```
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### CORS (Cross-Origin Resource Sharing)
- Konfiguracja zależna od wymagań frontendu
- Jeśli frontend i API są na różnych domenach, wymagana odpowiednia konfiguracja CORS

## 7. Obsługa błędów

### Tabela błędów

| Kod | Scenariusz | Komunikat | Szczegóły |
|-----|-----------|-----------|-----------|
| 400 | Nieprawidłowy parametr `includeAnswered` | "Validation failed" | `{ "includeAnswered": "Must be a boolean value" }` |
| 404 | Sesja o podanym slug nie istnieje | "Session not found" | - |
| 500 | Błąd połączenia z bazą danych | "Internal server error" | - |
| 500 | Nieoczekiwany błąd podczas przetwarzania | "Internal server error" | - |

### Szczegółowa obsługa błędów

#### 1. Błąd walidacji (400 Bad Request)

**Kiedy występuje:**
- Parametr `includeAnswered` nie jest wartością boolean
- Przykład: `?includeAnswered=maybe`

**Obsługa:**
```typescript
try {
  const validated = getQuestionsQuerySchema.parse(query);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: error.flatten().fieldErrors
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

#### 2. Sesja nie znaleziona (404 Not Found)

**Kiedy występuje:**
- Sesja o podanym `slug` nie istnieje w bazie danych
- Sesja została usunięta

**Obsługa:**
```typescript
const session = await getSessionBySlug(supabase, slug);

if (!session) {
  return new Response(JSON.stringify({
    error: 'Session not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 3. Błąd bazy danych (500 Internal Server Error)

**Kiedy występuje:**
- Supabase zwraca błąd (połączenie, timeout, etc.)
- Błąd podczas wykonywania zapytania SQL

**Obsługa:**
```typescript
try {
  const questions = await getQuestionsBySessionId(supabase, session.id, includeAnswered);
  // ...
} catch (error) {
  console.error('Database error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 4. Nieoczekiwany błąd (500 Internal Server Error)

**Kiedy występuje:**
- Nieobsługiwany wyjątek w kodzie
- Błąd transformacji danych

**Obsługa:**
```typescript
try {
  // ... cała logika endpointu
} catch (error) {
  console.error('Unexpected error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Logowanie błędów

**Błędy krytyczne (logować zawsze):**
- Błędy bazy danych (500)
- Nieoczekiwane wyjątki (500)

**Błędy informacyjne (opcjonalnie):**
- 404 Not Found (może wskazywać na próby dostępu do nieistniejących sesji)
- 400 Bad Request (rzadkie, jeśli frontend poprawnie formatuje zapytania)

**Format logowania:**
```typescript
console.error('[GET /api/sessions/:slug/questions]', {
  slug,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Brak paginacji
- **Problem:** Dla sesji z dużą liczbą pytań (np. 1000+) zwracanie wszystkich rekordów może być wolne
- **Wpływ:** Zwiększony czas odpowiedzi, większe zużycie pamięci, więcej danych transferowanych
- **Mitygacja (przyszłość):** Wprowadzenie paginacji z parametrami `page` i `limit`

#### 2. Brak cache'owania
- **Problem:** Każde żądanie wykonuje zapytanie do bazy danych
- **Wpływ:** Zwiększone obciążenie bazy danych dla popularnych sesji
- **Mitygacja:** 
  - Rozważyć cache na poziomie aplikacji (Redis) dla często odwiedzanych sesji
  - Nagłówki HTTP cache (`Cache-Control`, `ETag`) dla publicznych danych

#### 3. Sortowanie w bazie danych
- **Problem:** Sortowanie po `upvote_count DESC, created_at ASC` może być kosztowne bez indeksu
- **Wpływ:** Wolniejsze zapytania dla dużych tabel
- **Mitygacja:** Utworzenie indeksu kompozytowego

### Strategie optymalizacji

#### 1. Indeksy bazodanowe

**Rekomendowany indeks kompozytowy:**
```sql
CREATE INDEX idx_questions_session_sorting 
ON questions(session_id, upvote_count DESC, created_at ASC);
```

**Dodatkowy indeks dla filtrowania:**
```sql
CREATE INDEX idx_questions_session_answered 
ON questions(session_id, is_answered);
```

**Analiza:**
- Indeks na `(session_id, upvote_count DESC, created_at ASC)` przyspieszy sortowanie
- Indeks na `(session_id, is_answered)` przyspieszy filtrowanie nieodpowiedzianych pytań
- PostgreSQL może użyć któregokolwiek indeksu w zależności od planu wykonania

#### 2. Optymalizacja zapytań Supabase

**Wybór tylko potrzebnych kolumn:**
```typescript
// ✅ Dobrze - wybieramy wszystkie kolumny (potrzebne w QuestionDTO)
.select('*')

// ❌ Unikać - wybieranie więcej niż potrzeba
.select('*, sessions(*)')  // niepotrzebne join
```

**Efektywne filtrowanie:**
```typescript
// ✅ Dobrze - filtrowanie w bazie danych
query = query.eq('is_answered', false);

// ❌ Unikać - filtrowanie w JavaScript
const all = await query;
const filtered = all.filter(q => !q.is_answered);
```

#### 3. Nagłówki HTTP cache

**Dla danych publicznych, które zmieniają się rzadko:**
```typescript
return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, s-maxage=60'
    // Cache przez 30s w przeglądarce, 60s w CDN
  }
});
```

**Analiza:**
- `public` - może być cache'owane przez przeglądarki i CDN
- `max-age=30` - przeglądarka trzyma w cache przez 30 sekund
- `s-maxage=60` - CDN/proxy trzyma w cache przez 60 sekund
- Dla realtime Q&A krótki TTL jest odpowiedni

#### 4. Kompresja odpowiedzi

**Na poziomie serwera (middleware/reverse proxy):**
- Włączenie gzip lub brotli compression
- Zmniejszenie rozmiaru transferowanych danych o 70-80%

#### 5. Monitoring wydajności

**Metryki do monitorowania:**
- Czas odpowiedzi endpointu (P50, P95, P99)
- Liczba zapytań na sesję
- Rozmiar odpowiedzi (liczba pytań)
- Czas wykonania zapytań SQL

**Narzędzia:**
- Supabase Dashboard - statystyki zapytań
- Application Performance Monitoring (APM) - np. Sentry, DataDog
- Logi czasów odpowiedzi

### Benchmark oczekiwań

**Dla sesji z 100 pytaniami:**
- Czas odpowiedzi: < 200ms
- Rozmiar odpowiedzi: ~15-20KB (bez kompresji)

**Dla sesji z 1000 pytaniami:**
- Czas odpowiedzi: < 500ms
- Rozmiar odpowiedzi: ~150-200KB (bez kompresji)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/question.schema.ts`

**Akcja:** Dodać nowy schemat walidacji dla query parameters

```typescript
/**
 * Schema for validating GET /api/sessions/:slug/questions query parameters
 * Enforces:
 * - includeAnswered: boolean, defaults to false
 */
export const getQuestionsQuerySchema = z.object({
  includeAnswered: z.coerce.boolean().default(false)
});
```

**Uzasadnienie:**
- Zgodne z regułą "Use zod for input validation in API routes"
- `z.coerce.boolean()` automatycznie konwertuje string `"true"/"false"` na boolean
- `.default(false)` zapewnia wartość domyślną zgodną ze specyfikacją

### Krok 2: Rozszerzenie serwisu pytań

**Plik:** `src/lib/services/questions.service.ts`

**Akcja:** Dodać funkcję `getQuestionsBySessionId`

```typescript
/**
 * Get all questions for a session with optional filtering
 * @param supabase - Supabase client instance
 * @param sessionId - ID of the session
 * @param includeAnswered - Whether to include answered questions
 * @returns Array of questions as QuestionDTO[]
 * @throws Error if database operation fails
 */
export async function getQuestionsBySessionId(
  supabase: SupabaseClient,
  sessionId: string,
  includeAnswered: boolean = false
): Promise<QuestionDTO[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId);
  
  // Filter out answered questions if includeAnswered is false
  if (!includeAnswered) {
    query = query.eq('is_answered', false);
  }
  
  // Sort by upvote_count DESC, then created_at ASC
  const { data, error } = await query
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  if (!data) return [];
  
  // Transform snake_case database fields to camelCase DTO
  return data.map(question => ({
    id: question.id,
    sessionId: question.session_id,
    content: question.content,
    authorName: question.author_name,
    isAnswered: question.is_answered,
    upvoteCount: question.upvote_count,
    createdAt: question.created_at
  }));
}
```

**Uzasadnienie:**
- Zgodne z regułą "Extract logic into services in `src/lib/services`"
- Separacja logiki biznesowej od kodu endpointu
- Reużywalność funkcji w innych częściach aplikacji
- Jasna transformacja snake_case → camelCase

### Krok 3: Utworzenie pliku endpointu

**Plik:** `src/pages/api/sessions/[slug]/questions.ts`

**Akcja:** Utworzyć nowy plik (jeśli nie istnieje)

**Struktura katalogów:**
```
src/pages/api/sessions/[slug]/
├── questions.ts        <- nowy plik
└── __tests__/
    └── questions.test.ts  <- testy (opcjonalnie)
```

### Krok 4: Implementacja handlera GET

**Plik:** `src/pages/api/sessions/[slug]/questions.ts`

**Akcja:** Zaimplementować pełną logikę endpointu

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

import { getSessionBySlug } from '@/lib/services/sessions.service';
import { getQuestionsBySessionId } from '@/lib/services/questions.service';
import { getQuestionsQuerySchema } from '@/lib/schemas/question.schema';
import type { QuestionsListResponseDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

/**
 * GET /api/sessions/:slug/questions
 * Retrieve all questions for a specific session (public access)
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const { slug } = params;
    
    // Validate slug parameter exists
    if (!slug) {
      const errorResponse: ErrorResponseDTO = {
        error: 'Validation failed',
        details: { slug: 'Session slug is required' }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      includeAnswered: url.searchParams.get('includeAnswered')
    };
    
    let includeAnswered: boolean;
    try {
      const validated = getQuestionsQuerySchema.parse(queryParams);
      includeAnswered = validated.includeAnswered;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: 'Validation failed',
          details: error.flatten().fieldErrors as Record<string, string>
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error; // Re-throw unexpected errors
    }
    
    // Get Supabase client from locals (Astro best practice)
    const supabase = locals.supabase;
    
    // Check if session exists
    const session = await getSessionBySlug(supabase, slug);
    if (!session) {
      const errorResponse: ErrorResponseDTO = {
        error: 'Session not found'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get questions for the session
    const questions = await getQuestionsBySessionId(
      supabase,
      session.id,
      includeAnswered
    );
    
    // Build response
    const response: QuestionsListResponseDTO = {
      data: questions
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60'
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('[GET /api/sessions/:slug/questions] Error:', {
      params: params,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: 'Internal server error'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Uzasadnienie:**
- `export const prerender = false` - zgodnie z regułami Astro dla API routes
- `export const GET` - uppercase format zgodnie z regułami
- `locals.supabase` - używanie supabase z context.locals zamiast importu
- Pełna walidacja i obsługa błędów
- Try-catch dla nieoczekiwanych błędów
- Logowanie błędów do konsoli
- Nagłówki cache dla optymalizacji

### Krok 5: Konfiguracja middleware (jeśli potrzebne)

**Plik:** `src/middleware/index.ts`

**Akcja:** Upewnić się, że middleware dodaje instancję Supabase do `locals`

**Sprawdzić, czy istnieje:**
```typescript
export async function onRequest(context, next) {
  // Tworzenie klienta Supabase i dodanie do locals
  context.locals.supabase = createSupabaseClient();
  return next();
}
```

**Uzasadnienie:**
- Endpoint używa `locals.supabase` zgodnie z best practices
- Middleware musi zapewnić dostępność tego klienta

### Krok 6: Dodanie indeksów bazodanowych (opcjonalne, ale zalecane)

**Plik:** `supabase/migrations/[timestamp]_add_questions_indexes.sql`

**Akcja:** Utworzyć nową migrację z indeksami

```sql
-- Indeks dla sortowania pytań według upvotes i daty
CREATE INDEX IF NOT EXISTS idx_questions_session_sorting 
ON questions(session_id, upvote_count DESC, created_at ASC);

-- Indeks dla filtrowania pytań answered/unanswered
CREATE INDEX IF NOT EXISTS idx_questions_session_answered 
ON questions(session_id, is_answered);
```

**Uzasadnienie:**
- Znacząco przyspiesza zapytania z sortowaniem
- Wspiera filtrowanie po `is_answered`
- Niezbędne dla dobrych performance'ów przy większej liczbie pytań

### Krok 7: Testy jednostkowe (opcjonalne, ale zalecane)

**Plik:** `src/pages/api/sessions/[slug]/__tests__/questions.test.ts`

**Akcja:** Utworzyć testy jednostkowe dla endpointu

**Scenariusze testowe:**
1. ✅ Sukces - zwrócenie pytań dla istniejącej sesji
2. ✅ Sukces - filtrowanie pytań (includeAnswered=false)
3. ✅ Sukces - sortowanie według upvoteCount DESC, createdAt ASC
4. ❌ Błąd - sesja nie istnieje (404)
5. ❌ Błąd - nieprawidłowy parametr includeAnswered (400)
6. ❌ Błąd - brak parametru slug (400)

**Przykładowa struktura testu:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { GET } from '../questions';

describe('GET /api/sessions/:slug/questions', () => {
  it('should return questions for existing session', async () => {
    // Test implementation
  });
  
  it('should return 404 when session does not exist', async () => {
    // Test implementation
  });
  
  // ... more tests
});
```

### Krok 8: Weryfikacja i testowanie manualne

**Akcje:**

1. **Uruchomienie serwera deweloperskiego:**
   ```bash
   npm run dev
   ```

2. **Testowanie różnych scenariuszy:**
   
   ```bash
   # Sukces - podstawowe wywołanie
   curl http://localhost:4321/api/sessions/abc123xyz/questions
   
   # Sukces - z includeAnswered=true
   curl http://localhost:4321/api/sessions/abc123xyz/questions?includeAnswered=true
   
   # Błąd - nieistniejąca sesja
   curl http://localhost:4321/api/sessions/nonexistent/questions
   
   # Błąd - nieprawidłowy includeAnswered
   curl http://localhost:4321/api/sessions/abc123xyz/questions?includeAnswered=maybe
   ```

3. **Weryfikacja odpowiedzi:**
   - Poprawność struktury JSON
   - Poprawność kodów statusu
   - Poprawność sortowania pytań
   - Poprawność filtrowania

4. **Sprawdzenie wydajności:**
   - Pomiar czasu odpowiedzi
   - Weryfikacja wykonywanych zapytań SQL (Supabase Dashboard)

### Krok 9: Dokumentacja

**Plik:** `README.md` lub dedykowany plik dokumentacji API

**Akcja:** Zaktualizować dokumentację o nowy endpoint

**Dodać:**
- Opis endpointu
- Przykłady wywołań
- Kody odpowiedzi
- Informacje o cache'owaniu

### Krok 10: Code review i deployment

**Akcje:**

1. **Commit zmian:**
   ```bash
   git add .
   git commit -m "feat: implement GET /api/sessions/:slug/questions endpoint"
   ```

2. **Code review:**
   - Sprawdzenie zgodności z guidelines
   - Weryfikacja obsługi błędów
   - Review wydajności

3. **Merge i deployment:**
   - Merge do głównej gałęzi
   - Deployment na środowisko produkcyjne
   - Monitoring błędów i wydajności

---

## Podsumowanie

Endpoint `GET /api/sessions/:slug/questions` jest prostym, publicznym endpointem do odczytu danych. Kluczowe aspekty implementacji:

✅ **Bezpieczeństwo:** Publiczny dostęp, walidacja parametrów, zabezpieczenie przed SQL injection

✅ **Wydajność:** Indeksy bazodanowe, HTTP cache, efektywne zapytania Supabase

✅ **Obsługa błędów:** Kompletna obsługa błędów 400, 404, 500 z odpowiednimi komunikatami

✅ **Clean Code:** Separacja logiki w services, walidacja Zod, zgodność z guidelines

✅ **Testowalność:** Wyodrębniona logika biznesowa gotowa do testów jednostkowych

Implementacja tego endpointu powinna zająć ~2-3 godziny doświadczonemu programiście, włączając testy i dokumentację.
