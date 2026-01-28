# API Endpoint Implementation Plan: GET /api/sessions/:slug

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółów pojedynczej sesji Q&A na podstawie jej unikalnego identyfikatora URL (slug). Jest to endpoint publiczny, dostępny bez autentykacji, wykorzystywany przez uczestników do wyświetlenia strony sesji i zadawania pytań.

**Cel:** Umożliwienie publicznego dostępu do informacji o sesji (nazwa, prelegent, opis, data) na podstawie przyjaznego URL.

**Poziom dostępu:** Publiczny (bez wymagania autentykacji)

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sessions/:slug`
- **Parametry:**
  - **Wymagane:**
    - `slug` (path parameter, string) - unikalny identyfikator URL sesji (np. "abc123xyz")
  - **Opcjonalne:** brak
- **Request Body:** brak (metoda GET)
- **Headers:** brak wymaganych nagłówków

**Przykład żądania:**
```
GET /api/sessions/abc123xyz
```

## 3. Wykorzystywane typy

### DTOs (z src/types.ts)

```typescript
// Odpowiedź sukcesu
interface SessionDTO {
  id: string;
  name: string;
  speaker: string;
  description: string | null;
  sessionDate: string | null;
  uniqueUrlSlug: string;
  createdAt: string;
}

// Odpowiedź błędu
interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Typy z bazy danych

```typescript
// Z src/db/database.types.ts (via Supabase)
type SessionEntity = Tables<"sessions">
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Content-Type:** `application/json`

**Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Introduction to GraphQL",
  "speaker": "John Doe",
  "description": "Learn the basics of GraphQL",
  "sessionDate": "2026-05-15T14:00:00Z",
  "uniqueUrlSlug": "abc123xyz",
  "createdAt": "2026-01-26T10:00:00Z"
}
```

### Błędy

#### 404 Not Found
Sesja o podanym slug nie istnieje.

```json
{
  "error": "Session not found"
}
```

#### 400 Bad Request
Nieprawidłowy format parametru slug.

```json
{
  "error": "Validation failed",
  "details": {
    "slug": "Slug is required and must be a non-empty string"
  }
}
```

#### 500 Internal Server Error
Błąd serwera lub bazy danych.

```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

```
1. Klient wysyła GET /api/sessions/:slug
   ↓
2. Astro endpoint handler (/src/pages/api/sessions/[slug].ts)
   ↓
3. Walidacja parametru slug (zod schema)
   ↓
4. Service layer (sessionsService.getSessionBySlug)
   ↓
5. Supabase query (SELECT * FROM sessions WHERE unique_url_slug = ?)
   ↓
6. Transformacja snake_case → camelCase (SessionEntity → SessionDTO)
   ↓
7. Zwrot odpowiedzi JSON (200 lub 404)
```

### Szczegóły interakcji z bazą danych

**Zapytanie Supabase:**
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('unique_url_slug', slug)
  .single();
```

**Transformacja danych:**
- Pole `unique_url_slug` (DB) → `uniqueUrlSlug` (DTO)
- Pole `session_date` (DB) → `sessionDate` (DTO)
- Pole `created_at` (DB) → `createdAt` (DTO)
- Pozostałe pola bez zmian

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja
- **Brak wymagań autentykacji** - endpoint publiczny
- Wszystkie dane sesji są publiczne i mogą być udostępniane

### Walidacja danych wejściowych
- Parametr `slug` musi być walidowany przed użyciem w zapytaniu
- Używamy Zod schema dla type-safe validation
- Supabase automatycznie zabezpiecza przed SQL injection

### Ochrona danych
- Brak wrażliwych danych w odpowiedzi (wszystkie pola są publiczne)
- Nie ujawniamy informacji o strukturze bazy danych w komunikatach błędów

### Rate limiting (do rozważenia w przyszłości)
- Obecnie brak, ale warto rozważyć ochronę przed abuse

## 7. Obsługa błędów

### Tabela błędów

| Scenariusz | Status | Komunikat | Szczegóły |
|------------|--------|-----------|-----------|
| Slug jest pusty lub undefined | 400 | "Validation failed" | `{ slug: "Slug is required and must be a non-empty string" }` |
| Slug ma nieprawidłowy format | 400 | "Validation failed" | `{ slug: "Invalid slug format" }` |
| Sesja nie istnieje | 404 | "Session not found" | brak |
| Błąd połączenia z bazą | 500 | "Internal server error" | brak (loguj szczegóły po stronie serwera) |
| Nieoczekiwany błąd | 500 | "Internal server error" | brak (loguj szczegóły po stronie serwera) |

### Logowanie błędów

```typescript
// Błędy 500 powinny być logowane
console.error('Error fetching session:', error);

// Błędy 400/404 mogą być opcjonalnie logowane dla analityki
console.warn('Session not found:', slug);
```

## 8. Rozważania dotyczące wydajności

### Indeksy bazodanowe
- Kolumna `unique_url_slug` ma constraint UNIQUE, co automatycznie tworzy indeks
- Zapytania SELECT po tym polu będą szybkie (O(log n))

### Caching
- Rozważyć HTTP caching headers:
  - `Cache-Control: public, max-age=60` - dane sesji rzadko się zmieniają
  - `ETag` dla conditional requests (do rozważenia w przyszłości)

### Optymalizacje zapytań
- Używamy `.single()` zamiast `.limit(1)` dla semantycznej jasności
- SELECT tylko potrzebnych kolumn (obecnie wszystkie są potrzebne)

### Potencjalne wąskie gardła
- Brak - pojedyncze zapytanie SELECT z indeksem jest szybkie
- Supabase Connection Pooling automatycznie zarządza połączeniami

## 9. Etapy implementacji

### Krok 1: Przygotowanie schematu walidacji
**Plik:** `src/lib/schemas/session.schema.ts`

Dodaj schemat walidacji dla parametru slug:

```typescript
import { z } from 'zod';

export const getSessionBySlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required and must be a non-empty string')
});
```

### Krok 2: Implementacja funkcji w service
**Plik:** `src/lib/services/sessions.service.ts`

Dodaj funkcję `getSessionBySlug`:

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { SessionDTO } from '../types';

export async function getSessionBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<SessionDTO | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('unique_url_slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  // Transform snake_case to camelCase
  return {
    id: data.id,
    name: data.name,
    speaker: data.speaker,
    description: data.description,
    sessionDate: data.session_date,
    uniqueUrlSlug: data.unique_url_slug,
    createdAt: data.created_at,
  };
}
```

### Krok 3: Utworzenie endpoint handlera
**Plik:** `src/pages/api/sessions/[slug].ts`

Stwórz nowy plik Astro endpoint:

```typescript
import type { APIRoute } from 'astro';
import { getSessionBySlugParamsSchema } from '../../../lib/schemas/session.schema';
import { getSessionBySlug } from '../../../lib/services/sessions.service';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów
    const validation = getSessionBySlugParamsSchema.safeParse(params);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { slug } = validation.data;

    // Pobranie sesji
    const session = await getSessionBySlug(locals.supabase, slug);

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sukces
    return new Response(
      JSON.stringify(session),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 4: Testy jednostkowe service
**Plik:** `src/lib/services/__tests__/sessions.service.test.ts`

Dodaj testy dla funkcji `getSessionBySlug`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getSessionBySlug } from '../sessions.service';

describe('getSessionBySlug', () => {
  it('should return session when found', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-id',
                name: 'Test Session',
                speaker: 'John Doe',
                description: 'Test description',
                session_date: '2026-01-27T10:00:00Z',
                unique_url_slug: 'test-slug',
                created_at: '2026-01-26T10:00:00Z',
              },
              error: null,
            })),
          })),
        })),
      })),
    };

    const result = await getSessionBySlug(mockSupabase as any, 'test-slug');
    
    expect(result).toEqual({
      id: 'test-id',
      name: 'Test Session',
      speaker: 'John Doe',
      description: 'Test description',
      sessionDate: '2026-01-27T10:00:00Z',
      uniqueUrlSlug: 'test-slug',
      createdAt: '2026-01-26T10:00:00Z',
    });
  });

  it('should return null when session not found', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      })),
    };

    const result = await getSessionBySlug(mockSupabase as any, 'non-existent');
    expect(result).toBeNull();
  });

  it('should throw error on database failure', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            })),
          })),
        })),
      })),
    };

    await expect(getSessionBySlug(mockSupabase as any, 'test-slug'))
      .rejects.toThrow();
  });
});
```

### Krok 5: Testy integracyjne endpoint
**Plik:** `src/pages/api/sessions/__tests__/[slug].test.ts`

Stwórz testy integracyjne dla endpointu:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../[slug]';

describe('GET /api/sessions/:slug', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      params: {},
      locals: {
        supabase: {
          from: vi.fn(),
        },
      },
    };
  });

  it('should return 400 when slug is missing', async () => {
    mockContext.params = {};

    const response = await GET(mockContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('should return 404 when session not found', async () => {
    mockContext.params = { slug: 'non-existent' };
    mockContext.locals.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { code: 'PGRST116' },
          })),
        })),
      })),
    });

    const response = await GET(mockContext);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Session not found');
  });

  it('should return 200 with session data when found', async () => {
    mockContext.params = { slug: 'test-slug' };
    mockContext.locals.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              name: 'Test Session',
              speaker: 'John Doe',
              description: 'Test description',
              session_date: '2026-01-27T10:00:00Z',
              unique_url_slug: 'test-slug',
              created_at: '2026-01-26T10:00:00Z',
            },
            error: null,
          })),
        })),
      })),
    });

    const response = await GET(mockContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: 'test-id',
      name: 'Test Session',
      speaker: 'John Doe',
      description: 'Test description',
      sessionDate: '2026-01-27T10:00:00Z',
      uniqueUrlSlug: 'test-slug',
      createdAt: '2026-01-26T10:00:00Z',
    });
  });

  it('should return 500 on database error', async () => {
    mockContext.params = { slug: 'test-slug' };
    mockContext.locals.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' },
          })),
        })),
      })),
    });

    const response = await GET(mockContext);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
```

### Krok 6: Weryfikacja i testowanie
1. Uruchom testy jednostkowe: `npm test src/lib/services/__tests__/sessions.service.test.ts`
2. Uruchom testy integracyjne: `npm test src/pages/api/sessions/__tests__/[slug].test.ts`
3. Uruchom linter: `npm run lint`
4. Testuj endpoint ręcznie:
   ```bash
   # Przypadek sukcesu
   curl http://localhost:4321/api/sessions/abc123xyz
   
   # Przypadek 404
   curl http://localhost:4321/api/sessions/non-existent
   
   # Przypadek 400
   curl http://localhost:4321/api/sessions/
   ```

### Krok 7: Dokumentacja i review
1. Upewnij się, że kod jest zgodny z .cursor/rules
2. Sprawdź czy wszystkie funkcje mają odpowiednie komentarze JSDoc
3. Wykonaj code review przed mergem
4. Zaktualizuj dokumentację API jeśli potrzeba

## 10. Uwagi dodatkowe

### Potencjalne rozszerzenia w przyszłości
- Dodanie cache headers dla optymalizacji
- Implementacja ETags dla conditional requests
- Rozszerzenie o pola związane z autorem sesji (jeśli dodamy relację)
- Dodanie statystyk (liczba pytań, ostatnia aktywność)

### Zależności z innymi endpointami
- Endpoint GET /api/sessions/:slug/questions będzie wykorzystywał tę samą walidację slug
- Możliwość reużycia funkcji `getSessionBySlug` w innych miejscach aplikacji

### Metryki do monitorowania
- Czas odpowiedzi endpointu
- Liczba 404 vs 200 (wskaźnik użycia nieprawidłowych linków)
- Najczęściej pobierane sesje
