<conversation_summary>
<decisions>
1. Strona główna dla niezalogowanych użytkowników będzie zawierać pole do wpisania/wklejenia kodu (slug) sesji, które po zatwierdzeniu przekieruje na stronę sesji lub wyświetli błąd.
2. Formularz zadawania pytania po wysłaniu zablokuje przycisk, wyświetli wskaźnik ładowania, a po sukcesie wyczyści pole i pokaże powiadomienie "toast". Błędy walidacji będą wyświetlane pod polem tekstowym.
3. Lista pytań będzie odświeżana co 5 sekund przez ponowne pobranie wszystkich pytań z API (`polling`), bez implementacji buforowania po stronie klienta w MVP.
4. Wszystkie pozostałe 18 rekomendacji dotyczących przepływów użytkownika, wyglądu interfejsu, obsługi błędów, komponentów, responsywności, zarządzania stanem, dostępności i funkcji moderatora zostały zaakceptowane.
</decisions>
<matched_recommendations>
1. **Strona główna:** Prosty interfejs z polem na kod sesji i przekierowaniem.
2. **Formularz pytania:** Blokada przycisku, wskaźnik ładowania, powiadomienia "toast" i obsługa błędów walidacji.
3. **Odświeżanie listy pytań:** Regularne odpytywanie API (polling) co 5 sekund.
4. **Głosowanie (Upvote):** Zmiana wyglądu przycisku po oddaniu głosu i zapisywanie stanu w `localStorage`.
5. **Przepływ rejestracji moderatora:** Walidacja tokenu, formularz rejestracji i automatyczne zalogowanie po pomyślnej rejestracji.
6. **Panel moderatora:** Zagnieżdżona nawigacja do zarządzania sesjami i zaproszeniami; osobne widoki dla listy sesji, tworzenia nowej i zarządzania pytaniami.
7. **Obsługa błędów API:** Globalna obsługa błędów (401, 404, 400, 500) z odpowiednimi reakcjami interfejsu (przekierowania, dedykowane strony, komunikaty).
8. **Biblioteka komponentów:** Wykorzystanie `Shadcn/ui` dla kluczowych elementów: `Input`, `Button`, `Toast`, `AlertDialog`, `Card`, `Table`, `Badge`, `Switch`.
9. **Responsywność:** Podejście "mobile-first" z wykorzystaniem responsywnych klas Tailwind CSS.
10. **Zarządzanie stanem uwierzytelnienia:** Przechowywanie tokenów JWT w `localStorage`, użycie React Context lub globalnego magazynu (Zustand/Jotai) do zarządzania stanem zalogowania i automatyczne odświeżanie tokenów.
11. **Widok pustej listy:** Wyświetlanie zachęcających do interakcji komunikatów, gdy lista pytań lub sesji jest pusta.
12. **Dostępność (ARIA):** Użycie atrybutów `aria-label`, `aria-pressed`, `aria-checked` i `aria-live` w celu poprawy dostępności interaktywnych elementów.
</matched_recommendations>
<ui_architecture_planning_summary>
### a. Główne wymagania dotyczące architektury UI
Architektura UI dla MVP aplikacji GeeCON Q&A zostanie zbudowana w oparciu o stack technologiczny składający się z Astro, React i Tailwind CSS, z wykorzystaniem biblioteki komponentów Shadcn/ui. Interfejs będzie podzielony na dwie główne części: publiczną dla uczestników i chronioną hasłem dla moderatorów. Kluczowe założenia to prostota, responsywność (mobile-first) i zapewnienie informacji zwrotnej dla użytkownika w czasie zbliżonym do rzeczywistego.

### b. Kluczowe widoki, ekrany i przepływy użytkownika

**Uczestnik:**
1.  **Strona Główna (`/`):** Prosty widok z jednym polem do wprowadzenia kodu (slug) sesji. Po wpisaniu kodu następuje przekierowanie do `/session/[slug]` lub wyświetlenie błędu.
2.  **Widok Sesji (`/session/[slug]`):**
    *   Wyświetla informacje o sesji (nazwa, prelegent).
    *   Zawiera listę pytań posortowaną wg liczby głosów. Lista odświeża się co 5 sekund.
    *   Umożliwia oddanie głosu (upvote) na pytanie. Przycisk zmienia stan po kliknięciu, a informacja jest zapisywana w `localStorage`.
    *   Zawiera formularz do zadawania nowych pytań z walidacją i informacją zwrotną (wskaźnik ładowania, powiadomienia "toast").
    *   W przypadku braku pytań wyświetla zachętę do interakcji.
    *   W przypadku nieistniejącej sesji (błąd 404) wyświetla dedykowaną stronę błędu z linkiem do strony głównej.

**Moderator:**
1.  **Strona Logowania (`/login`):** Formularz logowania (email, hasło) z linkiem do odzyskiwania hasła.
2.  **Strona Rejestracji (`/register?token=...`):** Dostępna tylko przez link z zaproszeniem. Waliduje token, a następnie wyświetla formularz rejestracji. Po sukcesie automatycznie loguje i przekierowuje do panelu.
3.  **Panel Moderatora (widoki zagnieżdżone pod `/moderator`):**
    *   **Główny widok/Lista Sesji (`/moderator/sessions`):** Wyświetla listę wszystkich utworzonych sesji w formie tabeli. Zawiera przycisk do tworzenia nowej sesji.
    *   **Tworzenie Sesji (`/moderator/sessions/new`):** Formularz do wprowadzania danych nowej sesji. Po utworzeniu wyświetla podsumowanie z wygenerowanym unikalnym linkiem i przyciskiem do jego kopiowania.
    *   **Zarządzanie Pytaniami (`/moderator/sessions/[id]`):** Widok szczegółowy sesji z listą pytań. Każde pytanie ma opcje "Oznacz jako odpowiedziane" (przełącznik) i "Usuń" (z modalem potwierdzającym).
    *   **Zarządzanie Zaproszeniami (`/moderator/invites`):** Tabela z listą wygenerowanych zaproszeń, ich statusami i datami ważności. Zawiera przycisk do generowania nowych zaproszeń.

### c. Strategia integracji z API i zarządzania stanem
*   **Komunikacja z API:** Wszystkie interakcje z danymi będą odbywać się poprzez endpointy REST API zdefiniowane w `api-plan.md`.
*   **Zarządzanie stanem uwierzytelnienia:** Stan zalogowania moderatora będzie zarządzany globalnie (React Context lub Zustand/Jotai). Tokeny JWT (access i refresh) z Supabase Auth będą przechowywane w `localStorage`, a logika odświeżania tokenów zostanie zaimplementowana po stronie klienta.
*   **Zarządzanie stanem aplikacji:** Do zarządzania stanem formularzy i lokalnym stanem komponentów zostaną użyte haki React (`useState`, `useEffect`). Globalny stan będzie ograniczony do minimum (głównie informacje o zalogowanym użytkowniku).
*   **Pobieranie danych:** Dane będą pobierane za pomocą zapytań `fetch`. Dla listy pytań zostanie zaimplementowany mechanizm `polling` (odpytywanie co 5 sekund). Stany ładowania będą obsługiwane przez wyświetlanie komponentów "skeleton loader".

### d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa
*   **Responsywność:** Interfejs zostanie zaprojektowany zgodnie z podejściem "mobile-first" i będzie w pełni responsywny dzięki Tailwind CSS.
*   **Dostępność:** Zostaną zastosowane podstawowe praktyki dostępności, w tym semantyczny HTML i atrybuty ARIA (`aria-label`, `aria-live`, `aria-checked`) dla kluczowych elementów interaktywnych, aby zapewnić kompatybilność z czytnikami ekranu.
*   **Bezpieczeństwo:** Dostęp do panelu moderatora będzie chroniony przez uwierzytelnianie oparte na JWT. Wszystkie żądania do chronionych endpointów API będą zawierały token dostępowy w nagłówku `Authorization`. Rejestracja nowych moderatorów jest ograniczona tylko do osób posiadających ważny, jednorazowy token.

</ui_architecture_planning_summary>
<unresolved_issues>
Brak zidentyfikowanych nierozwiązanych kwestii. Wszystkie przedstawione rekomendacje zostały zaakceptowane, a plan UI jest spójny i gotowy do dalszych prac projektowych i implementacyjnych.
</unresolved_issues>
</conversation_summary>
