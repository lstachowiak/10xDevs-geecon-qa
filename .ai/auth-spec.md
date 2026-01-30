# Specyfikacja Techniczna: Moduł Autentykacji Moderatorów

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Zmiany w `src/layouts/Layout.astro`

Główny layout aplikacji będzie odpowiedzialny za warunkowe renderowanie interfejsu w zależności od statusu zalogowania moderatora.

-   **Logika:** W sekcji `<script>` layoutu, na serwerze, nastąpi sprawdzenie sesji użytkownika przy użyciu `Astro.locals.supabase.auth.getSession()`. Informacja o sesji (lub jej braku) zostanie przekazana do komponentu nagłówka.
-   **Nowe komponenty:**
    -   Wprowadzony zostanie nowy komponent `src/components/AuthActions.tsx` (React, client-side), który będzie renderował przyciski "Sign In" lub "Sign Out".
-   **Modyfikacja `src/components/SessionHeader.tsx`:**
    -   Komponent ten zostanie rozszerzony o przyjmowanie informacji o stanie zalogowania.
    -   W prawym górnym rogu, obok tytułu, wyświetli komponent `AuthActions.tsx`.
        -   **Tryb non-auth:** Wyświetli przycisk "Sign In", który otworzy modal z formularzem logowania.
        -   **Tryb auth:** Wyświetli przycisk "Sign Out", który wywoła endpoint wylogowujący.

### 1.2. Nowe komponenty i strony autentykacji

Wszystkie formularze związane z autentykacją będą komponentami React, aby zapewnić dynamiczną walidację po stronie klienta i interakcję bez przeładowywania strony.

-   **Komponent `src/components/auth/AuthModal.tsx` (React):**
    -   Główny komponent modalny (wykorzystujący `alert-dialog` z Shadcn/ui) do obsługi logowania, rejestracji i odzyskiwania hasła.
    -   Będzie zarządzał stanem, który z formularzy jest aktualnie widoczny (`login`, `register`, `forgot-password`).
    -   Będzie renderował odpowiednie formularze i obsługiwał przełączanie między nimi (np. link "Forgot password?" w formularzu logowania).

-   **Komponent `src/components/auth/LoginForm.tsx` (React):**
    -   Zawiera pola `email` i `password`.
    -   Wykorzysta `zod` i `react-hook-form` do walidacji po stronie klienta (format emaila, wymagane hasło).
    -   Po submisji wywoła `POST /api/auth/login`.
    -   Obsłuży błędy z API (np. "Invalid login credentials") i wyświetli je użytkownikowi.
    -   Po pomyślnym zalogowaniu odświeży stronę, aby zaktualizować stan sesji w `Layout.astro`.

-   **Komponent `src/components/auth/RegisterForm.tsx` (React):**
    -   Dostępny tylko przez unikalny link zaproszeniowy.
    -   Zawiera pola `email` (tylko do odczytu, pobrany z tokena), `password` i `confirmPassword`.
    -   Walidacja `zod` i `react-hook-form` (zgodność haseł, siła hasła).
    -   Po submisji wywoła `POST /api/auth/register` z tokenem zaproszenia.
    -   Po pomyślnej rejestracji przekieruje na stronę logowania lub zaloguje automatycznie.

-   **Komponent `src/components/auth/ForgotPasswordForm.tsx` (React):**
    -   Zawiera pole `email`.
    -   Po submisji wywoła `POST /api/auth/forgot-password`.
    -   Wyświetli komunikat o powodzeniu (np. "If an account with this email exists, a password reset link has been sent.").

-   **Nowe strony Astro:**
    -   `src/pages/auth/register.astro`: Strona, na którą kieruje link zaproszeniowy. Zweryfikuje token po stronie serwera i wyrenderuje `RegisterForm.tsx` z przekazanym tokenem i adresem email.
    -   `src/pages/auth/reset-password.astro`: Strona, na którą kieruje link z maila do resetu hasła. Zweryfikuje token i wyrenderuje formularz zmiany hasła.
    -   `src/pages/auth/callback.astro`: Endpoint do obsługi callbacku z Supabase po potwierdzeniu rejestracji lub resecie hasła.

## 2. LOGIKA BACKENDOWA

### 2.1. Middleware (`src/middleware/index.ts`)

Middleware będzie centralnym punktem zarządzania sesją i ochroną tras.

-   **Inicjalizacja Supabase:** Stworzy serwerowego klienta Supabase i umieści go w `Astro.locals.supabase`.
-   **Zarządzanie sesją:** Na każde żądanie pobierze sesję z ciasteczek (`Astro.cookies`) i umieści ją w `Astro.locals.session`.
-   **Ochrona tras:** Sprawdzi, czy żądanie dotyczy ścieżki `/moderator/*`. Jeśli tak, a `Astro.locals.session` jest `null`, przekieruje użytkownika na stronę główną (`/`).

### 2.2. Endpointy API (`src/pages/api/auth/`)

Wszystkie endpointy będą używać `export const prerender = false;`.

-   **`POST /api/auth/login.ts`:**
    -   Walidacja (Zod): `email`, `password`.
    -   Wywołanie `supabase.auth.signInWithPassword()`.
    -   Obsługa błędów: Zwraca `401 Unauthorized` przy błędnych danych.
    -   Sukces: Zwraca `200 OK` z danymi sesji.

-   **`POST /api/auth/logout.ts`:**
    -   Wywołanie `supabase.auth.signOut()`.
    -   Sukces: Zwraca `200 OK`.

-   **`POST /api/auth/register.ts`:**
    -   Walidacja (Zod): `token`, `password`.
    -   Weryfikacja tokena zaproszeniowego w bazie danych (sprawdzenie, czy istnieje i nie wygasł).
    -   Wywołanie `supabase.auth.signUp()` z emailem (pobranym na podstawie tokena) i hasłem.
    -   Po udanej rejestracji, token zaproszeniowy jest oznaczany jako wykorzystany.
    -   Obsługa błędów: `400 Bad Request` dla nieprawidłowego tokena, `500` dla błędów Supabase.

-   **`POST /api/auth/forgot-password.ts`:**
    -   Walidacja (Zod): `email`.
    -   Wywołanie `supabase.auth.resetPasswordForEmail()`.
    -   Zawsze zwraca `200 OK`, aby nie ujawniać, czy dany email istnieje w systemie.

-   **`POST /api/auth/reset-password.ts`:**
    -   Walidacja (Zod): `token`, `newPassword`.
    -   Wywołanie `supabase.auth.updateUser()` z nowym hasłem. Token jest automatycznie obsługiwany przez Supabase.
    -   Sukces: Zwraca `200 OK`.

### 2.3. Modele danych i schematy

-   **Nowa tabela `invitations` w Supabase:**
    -   `id` (uuid, primary key)
    -   `token` (text, unique, indexed)
    -   `email` (text)
    -   `expires_at` (timestamp with time zone)
    -   `used_at` (timestamp with time zone, nullable)
    -   `created_at` (timestamp with time zone)
-   **Nowe schematy Zod w `src/lib/schemas/auth.schema.ts`:**
    -   `LoginSchema`
    -   `RegisterSchema`
    -   `ForgotPasswordSchema`
    -   `ResetPasswordSchema`

## 3. SYSTEM AUTENTYKACJI (SUPABASE + ASTRO)

-   **Konfiguracja Supabase Auth:**
    -   W panelu Supabase należy włączyć autentykację email/hasło.
    -   Należy skonfigurować szablony mailowe dla potwierdzenia rejestracji i resetu hasła.
    -   **Ważne:** Należy wyłączyć opcję "Enable email confirmations" w ustawieniach Supabase Auth, ponieważ rejestracja jest oparta o zaufane zaproszenia, co eliminuje potrzebę weryfikacji mailowej.
-   **Integracja z Astro:**
    -   Zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_ANON_KEY` będą używane do inicjalizacji klienta Supabase.
    -   Klient serwerowy, tworzony w middleware, będzie używał `createServerClient` z `@supabase/ssr`, przekazując mu `Astro.cookies` do odczytu i zapisu.
    -   Klient po stronie frontendu (w komponentach React) będzie używał `createBrowserClient` z `@supabase/ssr`.
-   **Renderowanie stron:**
    -   Strony w katalogu `/moderator` będą renderowane po stronie serwera (`output: 'server'`), co jest wymagane do dynamicznej ochrony tras w oparciu o sesję użytkownika. Należy to skonfigurować w `astro.config.mjs` dla odpowiednich ścieżek. Pozostałe strony mogą pozostać statyczne (`output: 'static'`) lub hybrydowe.
