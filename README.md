# Business Architect

Dwujęzyczna (PL/EN) strona one-page dla Business Architect — konsulting wdrożeń AI,
z dedykowaną ofertą dla branży TSL. Backend na Node.js + Express serwuje treść i obsługuje
formularze; frontend to statyczny HTML/CSS/JS z animacjami scroll-linked.

## Funkcje

- Jedna strona z sekcjami odsłanianymi przy przewijaniu (scroll-linked reveal)
- Przełącznik języka PL/EN (flagi), zapamiętywany w `localStorage`
- Formularz kontaktowy (`/api/contact`) zapisujący zgłoszenia
- Strona reklamacji (`/reklamacje`, `/complaints`) z formularzem i **uploadem załączników**
- Strona polityki prywatności (`/polityka-prywatnosci`, `/privacy-policy`)

## Uruchomienie

```bash
npm install
npm start
```

Strona: http://localhost:3000

Tryb developerski z auto-restartem:

```bash
npm run dev
```

## Struktura

```
server.js            # Express: API treści, formularze, upload (multer), routing
public/              # Frontend (HTML, styles.css, app.js)
data/                # Zapisane zgłoszenia i załączniki (ignorowane w gicie)
```

## Uwagi

- Dane zgłoszeń i wgrane pliki trafiają do `data/` i nie są wersjonowane.
- Polityka prywatności i regulamin reklamacji to wersje robocze — wymagają uzupełnienia
  i weryfikacji prawnej przed publikacją.
