# Moduł Autentykacji - Komponenty UI

Ten katalog zawiera komponenty React odpowiedzialne za interfejs użytkownika procesu autentykacji moderatorów.

## Struktura

### Formularze

- **LoginForm.tsx** - Formularz logowania z walidacją email i hasła
- **RegisterForm.tsx** - Formularz rejestracji dla użytkowników z zaproszeniem
- **ForgotPasswordForm.tsx** - Formularz żądania resetu hasła
- **ResetPasswordForm.tsx** - Formularz ustawiania nowego hasła

### Komponenty kontenerowe

- **AuthModal.tsx** - Modal zarządzający widokami logowania i resetowania hasła

## Technologie

- **React Hook Form** - zarządzanie stanem formularzy
- **Zod** - walidacja schematów danych
- **Shadcn/ui** - komponenty UI (Button, Input, Alert Dialog)

## Walidacja

Wszystkie schematy walidacji znajdują się w `src/lib/schemas/auth.schema.ts`:

- `loginSchema` - email + hasło
- `registerSchema` - email + hasło + potwierdzenie hasła (z wymaganiami złożoności)
- `forgotPasswordSchema` - email
- `resetPasswordSchema` - hasło + potwierdzenie hasła (z wymaganiami złożoności)

## Bezpieczeństwo

- **ForgotPasswordForm** zawsze zwraca sukces, aby nie ujawniać, czy email istnieje w systemie
- Hasła wymagają minimum 8 znaków, wielkiej litery, małej litery i cyfry
- Błędy wyświetlane są w sposób przyjazny użytkownikowi, bez ujawniania szczegółów technicznych

## Integracja

Komponenty komunikują się z backendem poprzez endpointy API:

- `POST /api/auth/login` - logowanie
- `POST /api/auth/logout` - wylogowanie
- `POST /api/auth/register` - rejestracja
- `POST /api/auth/forgot-password` - żądanie resetu hasła
- `POST /api/auth/reset-password` - ustawienie nowego hasła

## Użycie

```tsx
import { AuthModal } from "@/components/auth/AuthModal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  );
}
```

## TODO (Backend)

- [ ] Implementacja endpointów API
- [ ] Weryfikacja tokenów zaproszeniowych
- [ ] Integracja z Supabase Auth
- [ ] Obsługa sesji w middleware
- [ ] Ochrona tras dla moderatorów
