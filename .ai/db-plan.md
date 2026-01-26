# Schemat Bazy Danych PostgreSQL - GeeCON Q&A

## 1. Tabele

### 1.1 sessions
Przechowuje informacje o sesjach Q&A dla poszczególnych prelekcji.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator sesji |
| name | TEXT | NOT NULL | Nazwa prelekcji |
| speaker | TEXT | NOT NULL | Imię i nazwisko prelegenta |
| description | TEXT | NULL | Opcjonalny opis sesji |
| session_date | TIMESTAMPTZ | NULL | Data i godzina prelekcji |
| unique_url_slug | TEXT | UNIQUE, NOT NULL | Losowy, unikalny identyfikator URL sesji |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data i czas utworzenia sesji |

\`\`\`sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    speaker TEXT NOT NULL,
    description TEXT,
    session_date TIMESTAMPTZ,
    unique_url_slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

### 1.2 questions
Przechowuje pytania zadane przez uczestników podczas sesji Q&A.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator pytania |
| session_id | UUID | NOT NULL, FOREIGN KEY REFERENCES sessions(id) ON DELETE CASCADE | ID sesji, do której należy pytanie |
| content | TEXT | NOT NULL, CHECK (char_length(content) >= 5 AND char_length(content) <= 500) | Treść pytania (5-500 znaków) |
| author_name | TEXT | NOT NULL, DEFAULT 'Anonymous' | Imię autora pytania lub "Anonymous" |
| is_answered | BOOLEAN | NOT NULL, DEFAULT FALSE | Flaga oznaczająca, czy pytanie zostało odpowiedziane |
| upvote_count | INTEGER | NOT NULL, DEFAULT 0, CHECK (upvote_count >= 0) | Liczba głosów pozytywnych na pytanie |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data i czas dodania pytania |

\`\`\`sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) >= 5 AND char_length(content) <= 500),
    author_name TEXT NOT NULL DEFAULT 'Anonymous',
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    upvote_count INTEGER NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT questions_session_id_fkey 
        FOREIGN KEY (session_id) 
        REFERENCES sessions(id) 
        ON DELETE CASCADE
);
\`\`\`

### 1.3 invites
Przechowuje jednorazowe zaproszenia dla nowych moderatorów.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator zaproszenia |
| token | TEXT | UNIQUE, NOT NULL | Jednorazowy token zaproszenia |
| created_by_moderator_id | UUID | NULL, FOREIGN KEY REFERENCES auth.users(id) | ID moderatora, który utworzył zaproszenie |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT (now() + interval '72 hours') | Data i czas wygaśnięcia zaproszenia |
| status | invite_status | NOT NULL, DEFAULT 'active' | Status zaproszenia (active, used, expired) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data i czas utworzenia zaproszenia |

\`\`\`sql
-- Typ ENUM dla statusu zaproszeń
CREATE TYPE invite_status AS ENUM ('active', 'used', 'expired');

CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    created_by_moderator_id UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
    status invite_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

### 1.4 auth.users
Wbudowana tabela Supabase wykorzystywana do uwierzytelniania moderatorów. Pierwszy administrator dodawany ręcznie w bazie danych.

## 2. Relacje między tabelami

### 2.1 sessions → questions (1:N)
- Jedna sesja może mieć wiele pytań
- Każde pytanie należy do dokładnie jednej sesji
- Kaskadowe usuwanie: usunięcie sesji usuwa wszystkie powiązane pytania
- Klucz obcy: `questions.session_id` → `sessions.id`

### 2.2 auth.users → invites (1:N)
- Jeden moderator może utworzyć wiele zaproszeń
- Każde zaproszenie może być utworzone przez jednego moderatora (lub być NULL)
- Klucz obcy: `invites.created_by_moderator_id` → `auth.users.id`

## 3. Indeksy

### 3.1 Indeks sortowania pytań
Optymalizuje wydajność sortowania pytań według liczby głosów (malejąco) i daty utworzenia (rosnąco).

\`\`\`sql
CREATE INDEX idx_questions_sorting 
ON questions (upvote_count DESC, created_at ASC);
\`\`\`

### 3.2 Indeks na session_id w tabeli questions
Poprawia wydajność zapytań filtrujących pytania według sesji.

\`\`\`sql
CREATE INDEX idx_questions_session_id 
ON questions (session_id);
\`\`\`

### 3.3 Indeks na unique_url_slug w tabeli sessions
Przyspiesza wyszukiwanie sesji po unikalnym URL (dodatkowy indeks pomimo UNIQUE constraint dla optymalizacji).

\`\`\`sql
CREATE INDEX idx_sessions_unique_url_slug 
ON sessions (unique_url_slug);
\`\`\`

### 3.4 Indeks na status i expires_at w tabeli invites
Optymalizuje zapytania sprawdzające aktywne zaproszenia.

\`\`\`sql
CREATE INDEX idx_invites_status_expires 
ON invites (status, expires_at);
\`\`\`

## 4. Uprawnienia na poziomie tabel

### 4.1 Rola `anon` (anonimowi użytkownicy)
Użytkownicy nieuwierzytelnieni (uczestnicy konferencji) mają ograniczone uprawnienia:

\`\`\`sql
-- Sesje: tylko odczyt
GRANT SELECT ON sessions TO anon;

-- Pytania: odczyt i dodawanie
GRANT SELECT, INSERT ON questions TO anon;

-- Brak dostępu do zaproszeń
REVOKE ALL ON invites FROM anon;
\`\`\`

### 4.2 Rola `authenticated` (moderatorzy)
Uwierzytelnieni użytkownicy (moderatorzy) mają pełne uprawnienia do zarządzania:

\`\`\`sql
-- Sesje: pełne uprawnienia
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;

-- Pytania: pełne uprawnienia
GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;

-- Zaproszenia: pełne uprawnienia
GRANT SELECT, INSERT, UPDATE, DELETE ON invites TO authenticated;
\`\`\`

## 5. Dodatkowe uwagi i decyzje projektowe

### 5.1 Brak osobnej tabeli upvotes
W MVP liczba głosów jest przechowywana jako kolumna `upvote_count` w tabeli `questions`. Nie ma mechanizmu zapobiegającego wielokrotnemu głosowaniu przez anonimowych użytkowników w wersji MVP.

### 5.2 Fizyczne usuwanie pytań
Operacja usunięcia pytania przez moderatora skutkuje fizycznym usunięciem rekordu z bazy danych (`DELETE`), a nie miękkim usunięciem (soft delete).

### 5.3 Aktualizacja w czasie rzeczywistym
W MVP lista pytań będzie odświeżana poprzez polling co 5 sekund zamiast wykorzystania Supabase Realtime.

### 5.4 Generowanie unique_url_slug
Unikalny identyfikator sesji będzie losową wartością liczbową. Aplikacja powinna zapewnić unikalność przed zapisem do bazy danych.

### 5.5 Brak RLS w MVP
Row Level Security (RLS) nie jest implementowane w MVP. Bezpieczeństwo opiera się na uprawnieniach na poziomie tabel dla ról Supabase `anon` i `authenticated`.

### 5.6 Pierwszy administrator
Pierwszy administrator musi być dodany ręcznie do tabeli `auth.users` w bazie danych Supabase.

### 5.7 Normalizacja
Schemat jest znormalizowany do 3NF. Jedynym przypadkiem celowej denormalizacji jest przechowywanie `upvote_count` bezpośrednio w tabeli `questions` dla uproszczenia i wydajności w MVP.

### 5.8 Rozszerzalność
Schemat został zaprojektowany z myślą o możliwym rozwoju:
- Można dodać tabelę `upvotes` do śledzenia indywidualnych głosów
- Można dodać kolumny dla dodatkowych metadanych (np. IP użytkownika)
- Można wprowadzić RLS dla bardziej granularnej kontroli dostępu
- Można dodać tabelę `moderator_sessions` dla wielu moderatorów na sesję