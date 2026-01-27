# API Endpoint Implementation Plan: GET /api/sessions

## 1. Przegląd punktu końcowego

**Cel:** Pobranie paginowanej listy wszystkich sesji Q&A z możliwością sortowania.

**Funkcjonalność:**
- Publiczny dostęp (bez wymaganego uwierzytelniania)
- Paginacja wyników z konfigurowalnymi parametrami
- Sortowanie po różnych polach (data utworzenia, data sesji, nazwa)
- Zwrócenie metadanych paginacji (całkowita liczba, liczba stron)

**Poziom dostępu:** Public (każdy może wywołać ten endpoint)

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/sessions
```

### Parametry

#### Query Parameters (wszystkie opcjonalne):

| Parametr | Typ | Default | Walidacja | Opis |
|----------|-----|---------|-----------|------|
| `page` | number | 1 | >= 1 | Numer strony do pobrania |
| `limit` | number | 20 | 1-100 | Liczba elementów na stronę |
| `sortBy` | string | "createdAt" | enum: "createdAt", "sessionDate", "name" | Pole do sortowania |
| `sortOrder` | string | "desc" | enum: "asc", "desc" | Kierunek sortowania |

#### Przykłady URL:
```
GET /api/sessions
GET /api/sessions?page=2&limit=50
GET /api/sessions?sortBy=sessionDate&sortOrder=asc
GET /api/sessions?page=1&limit=10&sortBy=name&sortOrder=asc
```

### Request Body
Brak (metoda GET)

### Request Headers
Brak wymaganych nagłówków (endpoint publiczny)

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

```typescript
// Pojedyncza sesja w odpowiedzi
export interface SessionDTO {
  id: string;
  name: string;
  speaker: string;
  description: string | null;
  sessionDate: string | null;
  uniqueUrlSlug: string;
  createdAt: string;
}

// Struktura odpowiedzi
export interface SessionListResponseDTO {
  data: SessionDTO[];
  pagination: PaginationDTO;
}

// Metadata paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Obsługa błędów
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Nowe typy do utworzenia:

#### Schemat walidacji query parameters (Zod)
Lokalizacja: `src/lib/schemas/session.schema.ts`

```typescript
import { z } from "zod";

// Dozwolone pola sortowania
const sortableFields = ["createdAt", "sessionDate", "name"] as const;

// Dozwolone kierunki sortowania
const sortOrders = ["asc", "desc"] as const;

// Schemat walidacji query parameters dla GET /api/sessions
export const getSessionsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, { message: "Page must be greater than or equal to 1" }),
  
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, { 
      message: "Limit must be between 1 and 100" 
    }),
  
  sortBy: z
    .enum(sortableFields)
    .optional()
    .default("createdAt"),
  
  sortOrder: z
    .enum(sortOrders)
    .optional()
    .default("desc"),
});

export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces: 200 OK

**Content-Type:** `application/json`

**Struktura:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
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

**Uwagi:**
- `data` może być pustą tablicą `[]` jeśli nie ma sesji
- Wszystkie pola w `SessionDTO` muszą być obecne
- `description` i `sessionDate` mogą być `null`
- Daty w formacie ISO 8601 (UTC)

### Błąd: 400 Bad Request

**Przyczyny:**
- Nieprawidłowe parametry query (np. limit > 100, page < 1)
- Nieprawidłowy format parametrów (np. page = "abc")
- Niedozwolone wartości dla sortBy lub sortOrder

**Przykład odpowiedzi:**
```json
{
  "error": "Validation failed",
  "details": {
    "limit": "Limit must be between 1 and 100",
    "sortBy": "Invalid enum value. Expected 'createdAt' | 'sessionDate' | 'name'"
  }
}
```

### Błąd: 500 Internal Server Error

**Przyczyny:**
- Błąd połączenia z bazą danych
- Nieoczekiwany błąd serwera
- Błąd transformacji danych

**Przykład odpowiedzi:**
```json
{
  "error": "Internal server error"
}
```

**Uwaga:** Nie ujawniamy szczegółów wewnętrznych błędów użytkownikowi końcowemu.

## 5. Przepływ danych

### Diagram przepływu:

```
Client Request
    ↓
[1] Astro API Route (/api/sessions/index.ts)
    ↓
[2] Walidacja parametrów query (Zod schema)
    ↓ (jeśli błąd)
    ↓ → [Return 400 Bad Request]
    ↓
[3] Pobranie Supabase client z locals
    ↓
[4] Sessions Service (getAllSessions)
    ↓
[5] Supabase Query z paginacją i sortowaniem
    ├── COUNT query (total records)
    └── SELECT query (data)
    ↓
[6] Transformacja snake_case → camelCase
    ↓
[7] Konstrukcja response z pagination metadata
    ↓
[8] Return 200 OK z SessionListResponseDTO
    ↓
Client Response
```

### Szczegółowy opis kroków:

#### [1] Astro API Route
- Endpoint: `src/pages/api/sessions/index.ts`
- Wyeksportuj `GET` handler typu `APIRoute`
- Użyj `export const prerender = false` dla SSR

#### [2] Walidacja parametrów query
- Wyciągnij parametry z `request.url`
- Parsuj używając `getSessionsQuerySchema`
- Obsłuż błędy walidacji Zod

#### [3] Pobranie Supabase client
- Użyj `locals.supabase` (nie importuj bezpośrednio)
- Type: `SupabaseClient` z `src/db/supabase.client.ts`

#### [4] Sessions Service
- Wywołaj `getAllSessions(supabase, queryParams)`
- Service zwraca obiekt z `{ data, total }`

#### [5] Supabase Query
- **COUNT query:** Pobierz całkowitą liczbę rekordów
- **SELECT query:** Pobierz dane z paginacją
  - Mapowanie pól sortowania (camelCase → snake_case)
  - Zastosuj `.order()` dla sortowania
  - Zastosuj `.range()` dla paginacji

#### [6] Transformacja danych
- Konwersja snake_case na camelCase:
  - `session_date` → `sessionDate`
  - `unique_url_slug` → `uniqueUrlSlug`
  - `created_at` → `createdAt`

#### [7] Konstrukcja response
- Oblicz `totalPages = Math.ceil(total / limit)`
- Stwórz obiekt `PaginationDTO`
- Połącz z danymi w `SessionListResponseDTO`

#### [8] Return response
- Status: 200
- Content-Type: application/json
- Body: JSON.stringify(responseDTO)

### Interakcje z bazą danych:

```sql
-- COUNT query (dla pagination.total)
SELECT COUNT(*) FROM sessions;

-- Data query (dla pagination.data)
SELECT 
  id, 
  name, 
  speaker, 
  description, 
  session_date, 
  unique_url_slug, 
  created_at
FROM sessions
ORDER BY {sortBy} {sortOrder}
LIMIT {limit}
OFFSET {(page - 1) * limit};
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja
- **Brak uwierzytelniania** - endpoint jest publiczny zgodnie ze specyfikacją
- **Brak autoryzacji** - każdy może przeglądać listę sesji
- Uwaga: Zmiana z pierwotnego planu API (był "moderator only"), teraz jest publiczny

### Ochrona przed atakami

#### 1. SQL Injection
- **Ryzyko:** Niskie
- **Ochrona:** Supabase ORM używa prepared statements
- **Działanie:** Nigdy nie interpoluj parametrów bezpośrednio do query

#### 2. Denial of Service (DoS)
- **Ryzyko:** Średnie (duże zapytania)
- **Ochrona:** 
  - Maksymalny limit = 100 rekordów na stronę
  - Walidacja parametrów przed wykonaniem query
- **Rozważenie:** W przyszłości: rate limiting na poziomie middleware

#### 3. Injection przez parametry sortowania
- **Ryzyko:** Średnie
- **Ochrona:** Enum validation dla `sortBy` - tylko dozwolone pola
- **Zabronione:** Dynamiczne nazwy kolumn bez walidacji

#### 4. Information Disclosure
- **Ryzyko:** Niskie
- **Ochrona:**
  - Wszystkie pola w `SessionDTO` są publiczne zgodnie z założeniami
  - Nie ujawniaj szczegółów błędów serwera (500)
  - Loguj błędy po stronie serwera, ale nie zwracaj ich klientowi

### Walidacja danych wejściowych

| Parametr | Walidacja | Cel bezpieczeństwa |
|----------|-----------|-------------------|
| `page` | >= 1, integer | Zapobieganie nieprawidłowym offsetom |
| `limit` | 1-100, integer | Zapobieganie DoS przez duże zapytania |
| `sortBy` | enum | Zapobieganie SQL injection |
| `sortOrder` | enum | Zapobieganie SQL injection |

### Nagłówki odpowiedzi (zalecane)

```typescript
{
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
}
```

## 7. Obsługa błędów

### Klasyfikacja błędów

#### 1. Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Parametr `page` < 1 lub nie jest liczbą
- Parametr `limit` < 1 lub > 100 lub nie jest liczbą
- Parametr `sortBy` zawiera niedozwoloną wartość
- Parametr `sortOrder` zawiera niedozwoloną wartość

**Przykład obsługi:**
```typescript
try {
  validated = getSessionsQuerySchema.parse(queryParams);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorResponse: ErrorResponseDTO = {
      error: "Validation failed",
      details: Object.fromEntries(
        error.errors.map((e) => [e.path.join("."), e.message])
      ),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  throw error;
}
```

#### 2. Błędy bazy danych (500 Internal Server Error)

**Scenariusze:**
- Utrata połączenia z Supabase
- Timeout zapytania
- Błędna konfiguracja klienta

**Przykład obsługi:**
```typescript
try {
  const result = await getAllSessions(supabase, validated);
  // ... proces response
} catch (error) {
  console.error("Database error in GET /api/sessions:", error);
  
  const errorResponse: ErrorResponseDTO = {
    error: "Internal server error",
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Uwaga:** Nigdy nie ujawniaj szczegółów błędu bazy danych w odpowiedzi API.

#### 3. Nieoczekiwane błędy (500 Internal Server Error)

**Scenariusze:**
- Błędy transformacji danych
- Błędy runtime JavaScript
- Out of memory

**Obsługa:**
- Catch-all try-catch na najwyższym poziomie
- Logowanie do console.error
- Zwracanie generycznego komunikatu

### Logging strategia

```typescript
// ✅ Dobre - loguj szczegóły po stronie serwera
console.error("GET /api/sessions failed:", {
  error: error.message,
  stack: error.stack,
  params: validated,
  timestamp: new Date().toISOString(),
});

// ❌ Złe - nie ujawniaj szczegółów w response
return new Response(JSON.stringify({
  error: error.message, // <- może zawierać wrażliwe informacje
  stack: error.stack     // <- NIGDY nie rób tego
}), { status: 500 });
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. COUNT(*) query dla dużej tabeli
- **Problem:** COUNT na dużych tabelach może być wolny
- **Mitygacja (MVP):** Akceptowalne dla MVP
- **Przyszłość:** Rozważyć cache lub approximate count

#### 2. Brak indeksów na kolumnach sortowania
- **Problem:** Sortowanie bez indeksów może być wolne
- **Mitygacja:** Upewnij się, że istnieją indeksy:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date);
  CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
  ```

#### 3. Duże limity paginacji
- **Problem:** Limit 100 może zwrócić dużo danych
- **Mitygacja:** Już zastosowana - max limit = 100
- **Zalecenie:** Dokumentacja powinna sugerować limit 20-50

#### 4. N+1 query problem
- **Problem:** Nie dotyczy - nie ma relacji do załadowania
- **Stan:** Brak problemu w tym endpointcie

### Strategie optymalizacji

#### Aktualne (MVP):
1. **Limit maksymalny:** 100 rekordów
2. **Paginacja:** LIMIT/OFFSET
3. **Selectywne pola:** Tylko potrzebne kolumny

#### Przyszłość (post-MVP):
1. **Cursor-based pagination:** Szybsze niż OFFSET dla dużych tabel
2. **Response caching:** Cache na poziomie CDN lub Redis
3. **Partial indexes:** Jeśli często filtrujemy po status
4. **Database connection pooling:** Jeśli mamy problemy z połączeniami

### Benchmarki (szacowane)

| Liczba sesji | Czas odpowiedzi (p95) |
|--------------|----------------------|
| < 100 | < 50ms |
| 100-1000 | < 100ms |
| 1000-10000 | < 200ms |
| > 10000 | < 500ms |

**Uwaga:** To są szacunki - należy zmierzyć w produkcji.

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji
**Plik:** `src/lib/schemas/session.schema.ts`

**Zadania:**
- [ ] Utwórz plik ze schematem Zod
- [ ] Zdefiniuj `getSessionsQuerySchema` z walidacją:
  - `page`: string → number, >= 1, default 1
  - `limit`: string → number, 1-100, default 20
  - `sortBy`: enum ["createdAt", "sessionDate", "name"], default "createdAt"
  - `sortOrder`: enum ["asc", "desc"], default "desc"
- [ ] Wyeksportuj typ `GetSessionsQuery`

**Weryfikacja:**
- Schema parsuje poprawne wartości
- Schema odrzuca nieprawidłowe wartości
- Defaults działają poprawnie

---

### Krok 2: Rozszerzenie Sessions Service
**Plik:** `src/lib/services/sessions.service.ts`

**Zadania:**
- [ ] Dodaj funkcję `getAllSessions(supabase, queryParams)`
- [ ] Implementacja:
  - Mapuj `sortBy` z camelCase na snake_case:
    - "createdAt" → "created_at"
    - "sessionDate" → "session_date"
    - "name" → "name"
  - Wykonaj COUNT query dla total
  - Wykonaj SELECT query z:
    - `.order(sortBySnakeCase, { ascending: sortOrder === "asc" })`
    - `.range(from, to)` gdzie:
      - `from = (page - 1) * limit`
      - `to = from + limit - 1`
  - Obsłuż błędy Supabase
  - Transformuj wyniki (snake_case → camelCase)
- [ ] Return type: `Promise<{ data: SessionDTO[], total: number }>`

**Przykład kodu:**
```typescript
export async function getAllSessions(
  supabase: SupabaseClient,
  queryParams: GetSessionsQuery
): Promise<{ data: SessionDTO[]; total: number }> {
  const { page, limit, sortBy, sortOrder } = queryParams;

  // Mapowanie pól sortowania
  const sortByMap = {
    createdAt: "created_at",
    sessionDate: "session_date",
    name: "name",
  } as const;

  const sortByColumn = sortByMap[sortBy];
  const ascending = sortOrder === "asc";

  // COUNT query
  const { count, error: countError } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  const total = count ?? 0;

  // Data query
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("sessions")
    .select("id, name, speaker, description, session_date, unique_url_slug, created_at")
    .order(sortByColumn, { ascending })
    .range(from, to);

  if (error) throw error;

  // Transformacja do SessionDTO (snake_case → camelCase)
  const sessionDTOs: SessionDTO[] = (data ?? []).map((session) => ({
    id: session.id,
    name: session.name,
    speaker: session.speaker,
    description: session.description,
    sessionDate: session.session_date,
    uniqueUrlSlug: session.unique_url_slug,
    createdAt: session.created_at,
  }));

  return { data: sessionDTOs, total };
}
```

**Weryfikacja:**
- Service zwraca poprawny format danych
- Paginacja działa poprawnie
- Sortowanie działa dla wszystkich pól
- Transformacja snake_case → camelCase jest poprawna

---

### Krok 3: Utworzenie API Route
**Plik:** `src/pages/api/sessions/index.ts`

**Zadania:**
- [ ] Utwórz plik z endpointem
- [ ] Dodaj `export const prerender = false`
- [ ] Implementuj `GET` handler typu `APIRoute`
- [ ] Walidacja query parameters:
  - Wyciągnij z `new URL(request.url).searchParams`
  - Parse z `getSessionsQuerySchema`
  - Obsłuż błędy Zod → 400 response
- [ ] Wywołaj `getAllSessions(locals.supabase, validated)`
- [ ] Skonstruuj `SessionListResponseDTO`:
  - `data` z wyniku service
  - `pagination` z obliczonym `totalPages`
- [ ] Obsłuż błędy:
  - Walidacja → 400
  - Database/Service → 500
  - Unexpected → 500
- [ ] Return Response z JSON i odpowiednimi nagłówkami

**Przykład kodu:**
```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { getSessionsQuerySchema } from "@/lib/schemas/session.schema";
import { getAllSessions } from "@/lib/services/sessions.service";
import type { ErrorResponseDTO, SessionListResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/sessions
 * Public endpoint to retrieve all sessions with pagination and sorting
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    };

    let validated;
    try {
      validated = getSessionsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Validation failed",
          details: Object.fromEntries(
            error.errors.map((e) => [e.path.join("."), e.message])
          ),
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Get sessions from service
    const { data, total } = await getAllSessions(locals.supabase, validated);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);

    // Construct response
    const response: SessionListResponseDTO = {
      data,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/sessions failed:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Weryfikacja:**
- Endpoint zwraca 200 dla poprawnych requestów
- Endpoint zwraca 400 dla nieprawidłowych parametrów
- Endpoint zwraca 500 dla błędów serwera
- Response ma poprawną strukturę JSON

---

### Krok 4: Testy manualne
**Narzędzie:** cURL, Postman, lub przeglądarka

**Przypadki testowe:**

1. **Podstawowe wywołanie (defaults):**
   ```bash
   curl http://localhost:4321/api/sessions
   ```
   Oczekiwane: 200, page=1, limit=20, sortBy=createdAt, sortOrder=desc

2. **Custom pagination:**
   ```bash
   curl "http://localhost:4321/api/sessions?page=2&limit=10"
   ```
   Oczekiwane: 200, page=2, limit=10

3. **Sortowanie po nazwie (ascending):**
   ```bash
   curl "http://localhost:4321/api/sessions?sortBy=name&sortOrder=asc"
   ```
   Oczekiwane: 200, sortowanie alfabetyczne

4. **Sortowanie po dacie sesji:**
   ```bash
   curl "http://localhost:4321/api/sessions?sortBy=sessionDate&sortOrder=desc"
   ```
   Oczekiwane: 200, najnowsze sesje pierwsze

5. **Błąd: limit > 100:**
   ```bash
   curl "http://localhost:4321/api/sessions?limit=150"
   ```
   Oczekiwane: 400, error message o limicie

6. **Błąd: page < 1:**
   ```bash
   curl "http://localhost:4321/api/sessions?page=0"
   ```
   Oczekiwane: 400, error message o page

7. **Błąd: nieprawidłowy sortBy:**
   ```bash
   curl "http://localhost:4321/api/sessions?sortBy=invalid"
   ```
   Oczekiwane: 400, error message o enum

8. **Błąd: nieprawidłowy sortOrder:**
   ```bash
   curl "http://localhost:4321/api/sessions?sortOrder=random"
   ```
   Oczekiwane: 400, error message o enum

9. **Pusta baza danych:**
   - Setup: Usuń wszystkie sesje
   - Request: `curl http://localhost:4321/api/sessions`
   - Oczekiwane: 200, data=[], total=0, totalPages=0

10. **Matematyka paginacji:**
    - Setup: 45 sesji w bazie
    - Request: `curl "http://localhost:4321/api/sessions?limit=20"`
    - Oczekiwane: 200, total=45, totalPages=3

**Checklist:**
- [ ] Wszystkie testy podstawowe przechodzą
- [ ] Wszystkie testy błędów zwracają odpowiednie kody
- [ ] Response JSON jest poprawny
- [ ] Paginacja działa matematycznie poprawnie
- [ ] Sortowanie działa dla wszystkich pól i kierunków

---

### Krok 5: Testy jednostkowe (opcjonalnie)
**Plik:** `src/lib/services/__tests__/sessions.service.test.ts`

**Zadania:**
- [ ] Test `getAllSessions` z różnymi parametrami
- [ ] Test sortowania
- [ ] Test paginacji
- [ ] Test transformacji snake_case → camelCase
- [ ] Mock Supabase client
- [ ] Test obsługi błędów

**Plik:** `src/pages/api/sessions/__tests__/index.test.ts`

**Zadania:**
- [ ] Test walidacji query parameters
- [ ] Test konstrukcji response
- [ ] Test obsługi błędów 400 i 500
- [ ] Mock service layer

**Uwaga:** Dla MVP testy opcjonalne, ale zalecane przed produkcją.

---

### Krok 6: Indeksy bazy danych (performance)
**Plik:** `supabase/migrations/[timestamp]_add_sessions_indexes.sql`

**Zadania:**
- [ ] Utwórz migrację z indeksami:
  ```sql
  -- Index dla sortowania po created_at
  CREATE INDEX IF NOT EXISTS idx_sessions_created_at 
  ON sessions(created_at DESC);

  -- Index dla sortowania po session_date
  CREATE INDEX IF NOT EXISTS idx_sessions_session_date 
  ON sessions(session_date DESC NULLS LAST);

  -- Index dla sortowania po name
  CREATE INDEX IF NOT EXISTS idx_sessions_name 
  ON sessions(name);
  ```
- [ ] Zastosuj migrację w Supabase

**Weryfikacja:**
- Indeksy są widoczne w schemacie bazy
- EXPLAIN ANALYZE pokazuje użycie indeksów

---

### Krok 7: Dokumentacja
**Plik:** `README.md` lub dokumentacja API

**Zadania:**
- [ ] Dodaj przykłady użycia endpointu
- [ ] Udokumentuj parametry query
- [ ] Dodaj przykłady cURL
- [ ] Opisz response structure
- [ ] Wymień możliwe błędy

---

### Krok 8: Code review checklist

**Backend:**
- [ ] Schema walidacji pokrywa wszystkie przypadki
- [ ] Service nie zwraca surowych błędów Supabase
- [ ] Transformacja danych jest kompletna
- [ ] Brak hardcoded wartości
- [ ] Używamy `locals.supabase` zamiast import
- [ ] Używamy typu `SupabaseClient` z właściwego miejsca

**API Route:**
- [ ] `export const prerender = false` jest obecny
- [ ] Wszystkie błędy są obsługiwane
- [ ] Nie ujawniamy szczegółów błędów serwera
- [ ] Response ma poprawne Content-Type
- [ ] Logujemy błędy do console.error

**Typy:**
- [ ] Używamy istniejących typów z `src/types.ts`
- [ ] Brak duplikacji typów
- [ ] Wszystkie typy są eksportowane

**Bezpieczeństwo:**
- [ ] Walidacja wszystkich inputs
- [ ] Limit max 100 jest enforced
- [ ] Brak SQL injection możliwości
- [ ] Nie logujemy wrażliwych danych

**Performance:**
- [ ] Indeksy są utworzone
- [ ] Nie ładujemy niepotrzebnych danych
- [ ] Paginacja jest wydajna

**Testy:**
- [ ] Przetestowano wszystkie przypadki manualne
- [ ] Edge cases są pokryte

---

## 10. Podsumowanie

### Co zostanie zaimplementowane:
1. Schema walidacji Zod dla query parameters
2. Service function `getAllSessions` z paginacją i sortowaniem
3. API endpoint `GET /api/sessions`
4. Indeksy bazy danych dla wydajności
5. Obsługa błędów 400 i 500
6. Dokumentacja i testy manualne

### Szacowany czas implementacji:
- Krok 1 (Schema): 15 min
- Krok 2 (Service): 30 min
- Krok 3 (API Route): 30 min
- Krok 4 (Testy manualne): 30 min
- Krok 5 (Testy jednostkowe): 60 min (opcjonalne)
- Krok 6 (Indeksy): 10 min
- Krok 7 (Dokumentacja): 20 min

**Łącznie:** ~2-3 godziny (bez testów jednostkowych ~1.5-2h)

### Zależności:
- Supabase client już skonfigurowany ✅
- Type definitions już istnieją ✅
- Middleware dla locals.supabase już istnieje ✅
- Struktura projektu już utworzona ✅

### Risk factors:
- **Niskie ryzyko:** Implementacja straightforward, podobna do istniejących endpoints
- **Uwaga:** Upewnij się, że indeksy są utworzone przed testami performance
