# Webflow JavaScript Integration

Detta projekt innehåller JavaScript-filer som kan användas i Webflow.

## Installation

1. Installera beroenden:
```bash
npm install
```

2. Starta utvecklingsservern:
```bash
npm start
```

## Användning i Webflow

1. Bygg JavaScript-filerna:
```bash
npm run build
```

2. Kopiera den byggda JavaScript-filen från `dist`-mappen

3. I Webflow:
   - Gå till Project Settings > Custom Code
   - Klistra in JavaScript-koden i "Before </body> tag" sektionen
   - Eller ladda upp filen till en extern hosting-tjänst och länka till den

## Utveckling

- Placera nya JavaScript-filer i `src`-mappen
- Använd `npm start` för att starta utvecklingsservern
- Använd `npm run build` för att bygga produktionsversionen 