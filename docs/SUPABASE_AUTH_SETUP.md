# Konfiguracja Supabase Auth

## Kroki konfiguracyjne

### 1. Konfiguracja zmiennych środowiskowych

Upewnij się, że plik `.env` zawiera poprawne dane Supabase:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Konfiguracja Supabase Auth w Dashboard

1. Przejdź do swojego projektu w [Supabase Dashboard](https://app.supabase.com)
2. Nawiguj do **Authentication** > **Providers**
3. Włącz **Email** provider
4. W sekcji **Email Auth**:
   - **Wyłącz** "Confirm email" (aplikacja używa systemu invite-only)
   - Ustaw "Minimum password length" na 8
5. W sekcji **Email Templates** skonfiguruj:
   - **Reset Password**: Ustaw redirect URL na `https://your-domain.com/auth/reset-password`

### 3. Pierwszy administrator

Pierwszy administrator musi być dodany ręcznie w Supabase Dashboard:

1. Przejdź do **Authentication** > **Users**
2. Kliknij "Add user"
3. Wybierz "Create new user"
4. Wprowadź email i hasło
5. Kliknij "Create user"

### 4. System zaproszeń

#### Generowanie tokena zaproszenia

Zaproszenia są przechowywane w tabeli `invites`. Aby zaprosić nowego moderatora:

1. Wygeneruj unikalny token (np. UUID)
2. Dodaj rekord do tabeli `invites`:

```sql
INSERT INTO invites (token, expires_at, status)
VALUES (
  'your-unique-token-here',
  NOW() + INTERVAL '72 hours',
  'active'
);
```

3. Wyślij link zaproszeniowy do nowego moderatora:
```
https://your-domain.com/auth/register?token=your-unique-token-here&email=moderator@example.com
```

#### Sprawdzanie statusu zaproszeń

```sql
SELECT token, expires_at, status, created_at
FROM invites
ORDER BY created_at DESC;
```

#### Wygaszanie przeterminowanych zaproszeń

```sql
UPDATE invites
SET status = 'expired'
WHERE expires_at < NOW() AND status = 'active';
```

## Flow autentykacji

### Rejestracja (przez zaproszenie)

1. Moderator otrzymuje link z tokenem
2. System weryfikuje token w tabeli `invites`
3. Jeśli token jest aktywny i ważny, wyświetla formularz rejestracji
4. Po rejestracji token jest oznaczany jako `used`
5. Użytkownik jest automatycznie zalogowany i przekierowany do `/moderator/sessions`

### Logowanie

1. Użytkownik klika "Zaloguj" w prawym górnym rogu
2. Wyświetla się modal z formularzem logowania
3. Po zalogowaniu strona jest odświeżana, aby zaktualizować stan sesji
4. Użytkownik ma dostęp do chronionych stron `/moderator/*`

### Resetowanie hasła

1. Użytkownik klika "Forgot password?" w formularzu logowania
2. Wprowadza swój email
3. Supabase wysyła email z linkiem do resetu
4. Po kliknięciu linku użytkownik jest kierowany na `/auth/reset-password`
5. Wprowadza nowe hasło
6. Jest przekierowywany na stronę główną

### Wylogowanie

1. Zalogowany użytkownik klika "Wyloguj" w prawym górnym rogu
2. Sesja jest usuwana z Supabase
3. Strona jest odświeżana
4. Użytkownik traci dostęp do chronionych stron

## Ochrona tras

Middleware automatycznie chroni następujące trasy:

- `/moderator/*` - wymaga zalogowania
- Wszystkie inne trasy są publiczne

Jeśli niezalogowany użytkownik próbuje uzyskać dostęp do `/moderator/*`, jest przekierowywany na `/`.

## Struktura plików

```
src/
├── db/
│   └── supabase.client.ts          # Klient Supabase z SSR
├── middleware/
│   └── index.ts                    # Middleware autentykacji
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── login.ts            # Endpoint logowania
│   │       ├── logout.ts           # Endpoint wylogowania
│   │       ├── register.ts         # Endpoint rejestracji
│   │       ├── forgot-password.ts  # Endpoint zapomnienia hasła
│   │       └── reset-password.ts   # Endpoint resetu hasła
│   ├── auth/
│   │   ├── register.astro          # Strona rejestracji
│   │   └── reset-password.astro    # Strona resetu hasła
│   └── moderator/
│       └── sessions.astro          # Chroniona strona moderatora
├── components/
│   ├── AuthActions.tsx             # Przyciski logowania/wylogowania
│   └── auth/
│       ├── AuthModal.tsx           # Modal autentykacji
│       ├── LoginForm.tsx           # Formularz logowania
│       ├── RegisterForm.tsx        # Formularz rejestracji
│       ├── ForgotPasswordForm.tsx  # Formularz zapomnienia hasła
│       └── ResetPasswordForm.tsx   # Formularz resetu hasła
└── lib/
    └── schemas/
        └── auth.schema.ts          # Schematy walidacji Zod
```

## Troubleshooting

### Błąd: "Invalid login credentials"

- Sprawdź, czy użytkownik istnieje w Supabase Dashboard
- Upewnij się, że hasło spełnia wymagania (min. 8 znaków)

### Błąd: "Nieprawidłowy lub nieaktywny token zaproszenia"

- Sprawdź, czy token istnieje w tabeli `invites`
- Sprawdź status tokena (powinien być `active`)
- Sprawdź datę wygaśnięcia

### Użytkownik nie może zalogować się po rejestracji

- Sprawdź, czy w Supabase Dashboard opcja "Confirm email" jest wyłączona
- Sprawdź logi w Supabase Dashboard

### Przekierowanie po zalogowaniu nie działa

- Upewnij się, że middleware jest poprawnie skonfigurowany
- Sprawdź, czy `Astro.locals.user` jest ustawiony
