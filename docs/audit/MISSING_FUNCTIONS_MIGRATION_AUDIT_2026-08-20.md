# MISSING FUNCTIONS MIGRATION AUDIT (DEV3 vs Pomoc_otcum-)

**Datum:** 20. 8. 2026
**DEV3 HEAD:** $(git rev-parse HEAD)
**Pomoc_otcum- HEAD:** (reference)

## 1. Porovnání funkcí

| Funkce starého projektu | Stav DEV3 | Chybí | Doporučení |
| :--- | :--- | :--- | :--- |
| **P0: Video Hub (Videotéka)** | EXISTS (`VideothequeView.tsx`) | NE | Ponechat stávající. |
| **P0: Stories Hub (Příběhy)** | EXISTS (`CaseStoriesView.tsx`) | NE | Ponechat stávající. |
| **P0: News Hub (Novinky)** | MISSING | ANO | Vytvořit `NewsHubView.tsx`. |
| **P0: Document Center** | EXISTS (`UserDocumentsView.tsx`) | NE | Ponechat stávající. |
| **P1: Help Center (Nápověda)** | PARTIAL (`UserManualPage` je stub) | ANO | Vytvořit plnohodnotný `HelpCenterView.tsx`. |
| **P1: Support Center (Ticketing)** | MISSING (máme jen linky bezpečí) | ANO | Vytvořit `TicketingView.tsx`. |
| **P1: Statistics Hub** | EXISTS (`StateStatisticsView.tsx`) | NE | Ponechat stávající. |
| **P2: Mapa pomoci** | MISSING | ANO | Neimplementovat v této fázi. |

## 2. Plán implementace
1. Implementace P0: `NewsHubView.tsx`
2. Implementace P1: `HelpCenterView.tsx`
3. Implementace P1: `TicketingView.tsx`

