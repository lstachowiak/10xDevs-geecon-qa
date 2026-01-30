# Dokument wymagań produktu (PRD) - GeeCON Q&A
## 1. Przegląd produktu
- Cel: usprawnienie sesji Q&A podczas konferencji GeeCON poprzez umożliwienie anonimowego zadawania pytań online i priorytetyzację ich według popularności.
- Główne grupy użytkowników: uczestnicy prelekcji (bez kont), moderatorzy pytań (z kontem invite-only), prelegenci korzystający z panelu moderatora.
- Zakres MVP: webowa aplikacja dostępna na urządzeniach mobilnych i desktopowych.
- Dostępność: język interfejsu angielski, linki pozwalają na szybkie wejście na stronę sesji.
- Zależności: mechanizm zapisu pytań i głosów w bazie.

## 2. Problem użytkownika
- Uczestnicy mają utrudnione zadawanie pytań podczas prelekcji, co spowalnia wydarzenie i zniechęca do interakcji.
- Prelegenci i moderatorzy nie dysponują narzędziem do sprawnego zbierania, selekcji i moderacji pytań.
- Brak priorytetyzacji pytań powoduje, że nie zawsze odpowiada się na najbardziej istotne wątki.

## 3. Wymagania funkcjonalne
### 3.1 Uczestnicy
- Dostęp do strony sesji poprzez użycie unikalnego URL.
- Formularz zadania pytania z opcjonalnym polem imienia; domyślna wartość Anonymous.
- Jednoetapowe wysłanie pytania bez konieczności zakładania konta ani podawania danych kontaktowych.
- Natychmiastowe potwierdzenie wyświetlane po zapisaniu pytania.
- Lista pytań dla danej prelekcji sortowana malejąco według liczby upvote.
- Możliwość przyznania jednego upvote na pytanie na urządzenie/przeglądarkę, z zapobieganiem wielokrotnym głosom.
- Widok oznaczeń, które pytania zostały już oznaczone jako answered przez moderatora.

### 3.2 Moderatorzy i prelegenci
- Logowanie do panelu moderatora przy pomocy konta invite-only.
- Panel listujący wszystkie prelekcje.
- Tworzenie nowych prelekcji z nazwą, datą i krótkim opisem.
- Automatyczne generowanie unikalnego URL dla każdej prelekcji.
- Przegląd pytań w czasie rzeczywistym dla wybranej prelekcji.
- Możliwość oznaczenia pytania jako answered.
- Możliwość usunięcia pytania (z potwierdzeniem).

### 3.3 System kont moderatorów
- Pierwszy administrator dodany ręcznie w bazie danych.
- Moderatorzy mogą generować linki zaproszeniowe z jednorazowym tokenem do rejestracji nowych moderatorów.
- Po wykorzystaniu token staje się nieważny; wysyłka linku odbywa się poza systemem.
- Rejestracja obejmuje email, hasło.

### 3.4 Zarządzanie danymi i raportowanie
- Pytania i upvote przechowywane w PostgreSQL z historią znaczników czasu.

### 3.5 Wymagania niefunkcjonalne
- Responsywny frontend dopasowany do ekranów mobilnych.

## 4. Granice produktu
- W zakresie: tworzenie i moderacja sesji Q&A dla pojedynczych prelekcji, zadawanie pytań, głosowanie na pytania, panel moderatora, mechanizm invite-only dla moderatorów.
- Poza zakresem MVP: równoległa obsługa wielu sal z zsynchronizowanym harmonogramem, wysyłka emaili lub powiadomień push, integracja z systemami konferencyjnymi, analityka przekraczająca liczenie pytań na prelekcję, personalizacja interfejsu, rozbudowany system ról (np. współmoderatorzy z różnymi uprawnieniami).
- Założenia: zaufane środowisko konferencyjne, dostęp do internetu dla uczestników, pierwszy administrator konfigurowany ręcznie.
- Ograniczenia: brak funkcji eksportu odpowiedzi ustnych, brak przypisywania pytań do konkretnych moderatorów, brak wymagań dotyczących wielu języków interfejsu.

## 5. Historyjki użytkowników
### US-001. Wejście na stronę sesji
Opis: Jako uczestnik chcę szybko wejść na stronę Q&A danej prelekcji, aby zadawać pytania.
Kryteria akceptacji:
- Gdy wpiszę unikalny slug na stronie głównej, zostaję przeniesiony na stronę z nazwą prelekcji i formularzem pytania.
- Link jest niepowtarzalny dla każdej prelekcji i pozostaje ważny do zakończenia konferencji.
- Próba wejścia na nieistniejącą sesję wyświetla jednoznaczny komunikat błędu.

### US-002. Zadanie pytania
Opis: Jako uczestnik chcę zadać pytanie anonimowo lub z imieniem, aby przekazać je prelegentowi.
Kryteria akceptacji:
- Formularz przyjmuje treść pytania (min. 5 znaków, max. 500 znaków) oraz opcjonalne pole imienia.
- Jeśli nie podam imienia, pytanie zapisuje się z nadawcą Anonymous.
- Po wysłaniu dostaję jednoznaczne potwierdzenie na ekranie bez przeładowania strony.

### US-003. Podgląd listy pytań
Opis: Jako uczestnik chcę przeglądać pytania innych uczestników, aby wybrać najciekawsze.
Kryteria akceptacji:
- Lista jest aktualizowana co najmniej co 10 sekund bez przeładowania strony.
- Pytania są sortowane malejąco według sumy upvote; przy remisie wcześniej dodane pytanie jest wyżej.
- Pytania oznaczone jako answered są widocznie wyróżnione.

### US-004. Głosowanie na pytanie
Opis: Jako uczestnik chcę oddać upvote na interesujące pytanie, aby pomóc w jego priorytetyzacji.
Kryteria akceptacji:
- Mogę oddać jeden upvote na pytanie na urządzenie/przeglądarkę; ponowne kliknięcie nie zwiększa licznika.
- Po oddaniu głosu licznik rośnie natychmiast.
- Jeśli pytanie zostanie oznaczone jako answered to znika z listy pytań.

### US-005. Logowanie moderatora
Opis: Jako moderator chcę bezpiecznie zalogować się do panelu, aby zarządzać sesjami.
Kryteria akceptacji:
- Logowanie odbywa się z użyciem emaila i hasła.
- Hasła są przechowywane jako hash z solą.
- Uzytkownik MOŻE przejść na stronę sesji z pytaniami bez logowania się do systemu
- Użytkownik MOŻE przegladać pytania i zadawać nowe bez logowania się do systemu
- Użytkownik może głosować na pytania (upvote) bez logowania się do systemu
- Moderator musi się zalogować aby zarządzać sesjami oraz pytaniami
- Moderator może logować się do systemu poprzez przycisk w prawym górnym rogu.
- Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
- Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
- Odzyskiwanie hasła powinno być możliwe.

### US-006. Tworzenie sesji
Opis: Jako moderator chcę utworzyć nową sesję, aby uczestnicy mogli zadawać pytania.
Kryteria akceptacji:
- Mogę podać nazwę, datę, prelegenta (imię + nazwisko) i opcjonalny opis.
- System generuje unikalny URL zapisywany w bazie.
- Po zapisaniu widzę podsumowanie danych i przycisk kopiuj link.

### US-007. Zarządzanie pytaniami
Opis: Jako moderator chcę przeglądać i oznaczać pytania, aby przygotować się do odpowiedzi.
Kryteria akceptacji:
- Lista pytań pokazuje treść, nadawcę, liczbę upvote i znacznik czasu.
- Mogę oznaczyć pytanie jako answered; status zmienia się natychmiast u wszystkich użytkowników.
- Oznaczenie można cofnąć w razie pomyłki.

### US-008. Usuwanie pytań
Opis: Jako moderator chcę usuwać nieodpowiednie pytania, aby utrzymać porządek.
Kryteria akceptacji:
- Każde pytanie ma akcję usuń z potwierdzeniem.
- Po usunięciu pytanie znika z listy użytkowników i archiwum.

### US-009. Generowanie zaproszeń moderatora
Opis: Jako moderator chcę zaprosić nowego moderatora, aby rozszerzyć zespół.
Kryteria akceptacji:
- Mogę wygenerować jednorazowy link ważny przez 72 godziny.
- Widzę stan każdego linku (aktywne, wykorzystane, wygasłe).
- Gdy link zostanie użyty, nowy moderator ustawia hasło i może się zalogować.

### US-010. Lista sesji
Opis: Jako moderator chcę przejrzeć listę sesji dostępnych w czasie konferencji
Kryteria akceptacji:
- Widzę utworzone sesje wraz w ich nazwą, prelegentem, kodem (slug), godziną rozpoczęcia oraz liczbą pytań zadanych do sesji
- Mogę łatwo skopiować kod sesji (slug) przez przycisk "kopiuj"
- Sesje są posortowane wg godziny rozpoczęcia