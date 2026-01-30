# Architektura UI dla GeeCON Q&A

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji GeeCON Q&A została zaprojektowana z myślą o prostocie, responsywności (mobile-first) i zapewnieniu płynnego doświadczenia dla dwóch głównych grup użytkowników: uczestników sesji oraz moderatorów. Aplikacja zostanie zbudowana przy użyciu Astro, React i Tailwind CSS, z biblioteką komponentów Shadcn/ui.

Interfejs dzieli się na dwie główne strefy:
*   **Publiczna (dla uczestników):** Umożliwia szybki dostęp do sesji Q&A za pomocą unikalnego kodu, zadawanie pytań i głosowanie na nie. Nie wymaga logowania.
*   **Chroniona (dla moderatorów):** Dostępna po zalogowaniu, oferuje narzędzia do zarządzania sesjami, pytaniami i zaproszeniami dla innych moderatorów.

## 2. Lista widoków

### Widok 1: Strona Główna (dla uczestnika)
- **Nazwa widoku:** Strona Główna
- **Ścieżka widoku:** `/`
- **Główny cel:** Umożliwienie uczestnikowi szybkiego dołączenia do sesji Q&A.
- **Kluczowe informacje do wyświetlenia:**
    - Tytuł aplikacji.
    - Krótka instrukcja dla użytkownika.
- **Kluczowe komponenty widoku:**
    - `Input`: Pole do wprowadzenia kodu (slug) sesji.
    - `Button`: Przycisk do zatwierdzenia kodu i przejścia do sesji.
    - `Toast`: Komponent do wyświetlania powiadomień o błędach (np. nie znaleziono sesji).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Minimalistyczny interfejs skupiony na jednej akcji. Automatyczne przekierowanie po poprawnym wprowadzeniu kodu.
    - **Dostępność:** Pole `Input` i `Button` będą miały odpowiednie etykiety (`aria-label`) dla czytników ekranu.
    - **Bezpieczeństwo:** Walidacja po stronie serwera, aby zapobiec próbom odgadnięcia kodów sesji.

### Widok 2: Widok Sesji (dla uczestnika)
- **Nazwa widoku:** Widok Sesji
- **Ścieżka widoku:** `/session/[slug]`
- **Główny cel:** Wyświetlanie pytań, umożliwienie zadawania nowych i głosowania.
- **Kluczowe informacje do wyświetlenia:**
    - Nazwa sesji i prelegent.
    - Lista pytań posortowana według liczby głosów.
    - Liczba głosów przy każdym pytaniu.
    - Oznaczenie pytań, na które już odpowiedziano.
- **Kluczowe komponenty widoku:**
    - `Card`: Komponent do wyświetlania informacji o sesji.
    - `Textarea`: Pole do wprowadzania treści nowego pytania.
    - `Input`: Opcjonalne pole na imię autora pytania.
    - `Button`: Przyciski do wysyłania pytania i głosowania (upvote).
    - `Toast`: Powiadomienia o pomyślnym dodaniu pytania lub błędach.
    - `Badge`: Etykieta "Answered" przy odpowiedzianych pytaniach.
    - Komponent "pustego stanu" (gdy nie ma jeszcze pytań).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Lista pytań odświeża się automatycznie co 5 sekund (polling). Przycisk "Upvote" zmienia wygląd po kliknięciu, a stan zapisywany jest w `localStorage`, aby zapobiec wielokrotnemu głosowaniu z tego samego urządzenia. Formularz jest blokowany podczas wysyłania pytania.
    - **Dostępność:** Przycisk "Upvote" będzie używał `aria-pressed` do komunikowania stanu. Dynamicznie aktualizowana lista pytań będzie umieszczona w regionie `aria-live`, aby informować użytkowników czytników ekranu o zmianach.
    - **Bezpieczeństwo:** Walidacja danych wejściowych formularza po stronie serwera.

### Widok 3: Logowanie Moderatora
- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie moderatora.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania.
- **Kluczowe komponenty widoku:**
    - `Input`: Pola na email i hasło.
    - `Button`: Przycisk "Zaloguj się".
    - `Toast`: Komunikaty o błędach logowania.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Po pomyślnym zalogowaniu użytkownik jest przekierowywany do panelu moderatora.
    - **Dostępność:** Pola formularza będą poprawnie etykietowane.
    - **Bezpieczeństwo:** Komunikacja z API odbywa się przez HTTPS. Tokeny JWT są bezpiecznie przechowywane w `localStorage`.

### Widok 4: Rejestracja Moderatora
- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register?token=[token]`
- **Główny cel:** Umożliwienie rejestracji nowego moderatora za pomocą tokenu zaproszenia.
- **Kluczowe informacje do wyświetlenia:** Formularz rejestracji.
- **Kluczowe komponenty widoku:**
    - `Input`: Pola na email i hasło.
    - `Button`: Przycisk "Zarejestruj się".
    - `Toast`: Komunikaty o statusie rejestracji lub błędach (np. nieważny token).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Widok dostępny tylko z ważnym tokenem. Po pomyślnej rejestracji moderator jest automatycznie logowany i przekierowywany do panelu.
    - **Dostępność:** Standardowe praktyki dostępności dla formularzy.
    - **Bezpieczeństwo:** Token zaproszenia jest jednorazowy i ma ograniczony czas ważności. Walidacja tokenu odbywa się po stronie serwera przed wyświetleniem formularza.

### Widok 5: Panel Moderatora - Lista Sesji
- **Nazwa widoku:** Lista Sesji
- **Ścieżka widoku:** `/moderator/sessions`
- **Główny cel:** Wyświetlanie i zarządzanie wszystkimi utworzonymi sesjami.
- **Kluczowe informacje do wyświetlenia:** Tabela z listą sesji (nazwa, prelegent, data).
- **Kluczowe komponenty widoku:**
    - `Table`: Tabela z sesjami.
    - `Button`: Przycisk do tworzenia nowej sesji.
    - Linki do widoku zarządzania pytaniami dla każdej sesji.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Przejrzysty widok wszystkich sesji z łatwym dostępem do akcji.
    - **Dostępność:** Tabela będzie miała odpowiednią strukturę i nagłówki dla czytników ekranu.
    - **Bezpieczeństwo:** Dostęp tylko dla uwierzytelnionych moderatorów.

### Widok 6: Panel Moderatora - Tworzenie Sesji
- **Nazwa widoku:** Tworzenie Sesji
- **Ścieżka widoku:** `/moderator/sessions/new`
- **Główny cel:** Tworzenie nowej sesji Q&A.
- **Kluczowe informacje do wyświetlenia:** Formularz do wprowadzenia danych sesji.
- **Kluczowe komponenty widoku:**
    - `Input`: Pola na nazwę sesji, prelegenta, datę.
    - `Textarea`: Opcjonalny opis sesji.
    - `Button`: Przycisk "Utwórz sesję".
    - `Card` z podsumowaniem i unikalnym linkiem do sesji po jej utworzeniu.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Po utworzeniu sesji wyświetlane jest podsumowanie z wygenerowanym linkiem i przyciskiem do jego skopiowania.
    - **Dostępność:** Formularz zgodny z zasadami dostępności.
    - **Bezpieczeństwo:** Walidacja danych wejściowych po stronie serwera.

### Widok 7: Panel Moderatora - Zarządzanie Pytaniami
- **Nazwa widoku:** Zarządzanie Pytaniami
- **Ścieżka widoku:** `/moderator/sessions/[id]`
- **Główny cel:** Moderowanie pytań w czasie rzeczywistym.
- **Kluczowe informacje do wyświetlenia:** Lista pytań z opcjami moderacji.
- **Kluczowe komponenty widoku:**
    - `Table` lub `Card List`: Lista pytań z treścią, autorem i liczbą głosów.
    - `Switch`: Przełącznik do oznaczania pytania jako "odpowiedziane".
    - `Button` z ikoną kosza do usuwania pytania.
    - `AlertDialog`: Modal potwierdzający usunięcie pytania.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Zmiany (oznaczenie jako odpowiedziane, usunięcie) są natychmiast widoczne.
    - **Dostępność:** Interaktywne elementy (`Switch`, `Button`) będą miały etykiety `aria-label`.
    - **Bezpieczeństwo:** Wszystkie akcje moderacyjne wymagają uwierzytelnienia.

### Widok 8: Panel Moderatora - Zarządzanie Zaproszeniami
- **Nazwa widoku:** Zarządzanie Zaproszeniami
- **Ścieżka widoku:** `/moderator/invites`
- **Główny cel:** Generowanie i przeglądanie zaproszeń dla nowych moderatorów.
- **Kluczowe informacje do wyświetlenia:** Tabela z listą zaproszeń (token, status, data ważności).
- **Kluczowe komponenty widoku:**
    - `Table`: Tabela z zaproszeniami.
    - `Button`: Przycisk do generowania nowego zaproszenia.
    - `Badge`: Etykiety statusu (aktywne, użyte, wygasłe).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Prosty interfejs do zarządzania dostępem dla nowych moderatorów.
    - **Dostępność:** Tabela zaimplementowana zgodnie z zasadami dostępności.
    - **Bezpieczeństwo:** Dostęp tylko dla uwierzytelnionych moderatorów.

## 3. Mapa podróży użytkownika

### Przepływ Uczestnika (Główny przypadek użycia)
1.  **Wejście:** Uczestnik otrzymuje kod sesji (np. `abc123xyz`).
2.  **Strona Główna (`/`):** Wpisuje kod `abc123xyz` w pole `Input` i klika `Button` "Dołącz".
3.  **Przekierowanie:** Aplikacja weryfikuje kod i przekierowuje go do `Widoku Sesji` (`/session/abc123xyz`).
4.  **Widok Sesji (`/session/abc123xyz`):**
    *   Uczestnik widzi nazwę sesji i listę pytań.
    *   Czyta pytania innych, głosuje na najciekawsze za pomocą przycisku `Upvote`.
    *   Wpisuje własne pytanie w `Textarea`, opcjonalnie podaje imię i klika "Wyślij".
    *   Otrzymuje powiadomienie `Toast` o pomyślnym dodaniu pytania.
    *   Jego pytanie pojawia się na liście, która odświeża się co 5 sekund.

### Przepływ Moderatora
1.  **Logowanie (`/login`):** Moderator wpisuje email i hasło, aby uzyskać dostęp do panelu.
2.  **Panel Moderatora (`/moderator/sessions`):** Widzi listę sesji. Może przejść do tworzenia nowej lub zarządzać istniejącą.
3.  **Tworzenie Sesji (`/moderator/sessions/new`):** Wypełnia formularz, tworzy sesję i kopiuje wygenerowany link, aby udostępnić go uczestnikom.
4.  **Zarządzanie Pytaniami (`/moderator/sessions/[id]`):** W trakcie prelekcji obserwuje napływające pytania, oznacza je jako `answered` za pomocą `Switch` lub usuwa nieodpowiednie za pomocą `Button` i modala `AlertDialog`.

## 4. Układ i struktura nawigacji

### Nawigacja Publiczna
- Brak tradycyjnej nawigacji. Przepływ opiera się na bezpośrednim dostępie przez URL lub kod sesji.
- Strona błędu 404 będzie zawierać link powrotny do strony głównej (`/`).

### Nawigacja w Panelu Moderatora
- Po zalogowaniu moderator widzi stały, zagnieżdżony układ nawigacyjny.
- **Nawigacja główna (boczna lub górna):**
    - Link do `Listy Sesji` (`/moderator/sessions`).
    - Link do `Zarządzania Zaproszeniami` (`/moderator/invites`).
    - Przycisk "Wyloguj".
- **Nawigacja kontekstowa:**
    - Z `Listy Sesji` można przejść do `Tworzenia Sesji` (`/moderator/sessions/new`) lub `Zarządzania Pytaniami` (`/moderator/sessions/[id]`).

## 5. Kluczowe komponenty

Poniższe komponenty z biblioteki `Shadcn/ui` będą używane w całej aplikacji w celu zapewnienia spójności wizualnej i funkcjonalnej:

- **`Button`:** Standardowe przyciski do akcji (wysyłanie formularzy, nawigacja, akcje moderacyjne).
- **`Input` & `Textarea`:** Pola formularzy do wprowadzania danych.
- **`Toast`:** Dyskretne powiadomienia (pop-up) informujące o wyniku operacji (np. "Pytanie dodane!").
- **`Card`:** Kontenery do grupowania powiązanych informacji (np. dane sesji, podsumowanie).
- **`Table`:** Do prezentacji danych tabelarycznych (listy sesji, zaproszeń).
- **`Badge`:** Etykiety do oznaczania statusów (np. "Answered", "active").
- **`Switch`:** Przełącznik do zmiany stanu binarnego (np. `isAnswered`).
- **`AlertDialog`:** Modal do potwierdzania krytycznych akcji (np. "Czy na pewno chcesz usunąć to pytanie?").
