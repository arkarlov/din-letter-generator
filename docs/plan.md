# Project Enhancement Plan & Future Ideas

This document outlines feature ideas, architectural intentions, and implementation scope to expand the Letter Layout App. Each point is structured to serve as a foundation for future detailed implementation plans.

---

## 📋 Feature Roadmap Summary

| Item | Feature                                         | Status     | Priority |
| ---- | ----------------------------------------------- | ---------- | -------- |
| 1    | Letter Settings (DIN 5008 Form A / Form B)      | 💡 Planned | High     |
| 2    | Stored PDFs & History Grid                      | 💡 Planned | High     |
| 3    | Pre-purchased Stamp Integration (Deutsche Post) | 💡 Planned | Medium   |
| 4    | Address Autocomplete API Integration            | 💡 Planned | Medium   |
| 5    | Header Motives & Branding                       | 💡 Planned | Low      |
| 6    | Letter Footer Section                           | 💡 Planned | High     |

---

## 🛠️ Detailed Feature Intentions & Scope

### 1. Letter Settings (DIN 5008 Form A vs Form B) & Persistence

- **Intention**: Support standard German letter formats (DIN 5008 Form A and Form B) and allow users to select their preferred default format.
  - **Form A**: Small header (27 mm top margin to address field), suitable for short header/logo.
  - **Form B**: Standard header (45 mm top margin to address field), standard for most business correspondence.
- **Persistence**: Save user preferences in `localStorage` (or user profile settings if auth is added) so selected letter standard, default margins, and font settings persist across sessions.
- **UI/UX**:
  - Toggle / dropdown selector in the main form or a dedicated Settings panel.
  - Visual diagram or tooltip preview showing folding mark positions and margin differences.
- **Technical Scope**:
  - Update `src/components/pdf/config.ts` to support dynamic switching between layout configurations.
  - Pass letter standard parameter through `PdfData` schema and PDF generator logic.

---

### 2. PDF Storage & History Grid

- **Intention**: Provide users with a history view of previously generated letters, allowing them to re-download, preview, or edit past documents.
- **Core Features**:
  - **History Dashboard/Grid**: Table or card view showing date, recipient, subject, letter type, and file size.
  - **PDF Preview Modal**: In-browser PDF preview directly from history.
  - **Re-generate / Re-use Data**: Option to fill form fields using data from a previously generated letter.
  - **Search & Filter**: Search by subject or recipient address, filter by date range.
- **Storage Strategy**:
  - _Phase 1 (Client-side)_: Store PDF metadata and compressed PDF blobs in IndexedDB.
  - _Phase 2 (Server-side)_: Store PDF assets in object storage (e.g. AWS S3, Vercel Blob) and record metadata in a database.

---

### 3. Pre-purchased Stamp Integration (Deutsche Post / Internetmarke Upload)

- **Intention**: Enable users to upload pre-bought postage stamps (e.g. Deutsche Post Internetmarke PDF or PNG/JPG) and automatically embed them onto the generated letter.
- **Core Features**:
  - Upload input for stamp file (`.pdf`, `.png`, `.jpg`).
  - Automatic extraction/cropping or embedding into the DIN 5008 postage area (top-right zone, 40mm x 20mm area above recipient address).
  - Visual positioning check / overlay preview in the UI before final rendering.
- **Technical Scope**:
  - PDF merging via `pdf-lib` (extracting stamp page / object or embedding image raster into the header coordinate space).
  - Validation to ensure uploaded stamp aspect ratio fits standard postage zones.

---

### 4. Address Autocomplete & Validation (Public Address API)

- **Intention**: Reduce typing effort and address errors by providing real-time address autocomplete for sender and recipient address fields.
- **Core Features**:
  - Search input with debounced API queries for street, house number, postal code (PLZ), city, and country.
  - Auto-fill structured address fields upon selecting a suggestion.
  - Support German PLZ and address structure standards.
- **API Options**:
  - **OpenStreetMap / Nominatim API** or **Photon** (free, open-source address search).
  - **Deutsche Post Direkt API** or **Google Places API** (as optional premium / fallback providers).
- **Technical Scope**:
  - Create reusable `AddressAutocomplete` component using custom hooks.
  - Ensure fallback manual entry remains available if search yields no results.

---

### 5. Header Motives & Branding

- **Intention**: Allow users to customize letter visuals with company logos, decorative header motifs, or custom color bars.
- **Core Features**:
  - Image upload for company logo (PNG/SVG/JPEG).
  - Alignment controls (top-left, top-right, center).
  - Predefined background motifs or decorative accent lines (e.g. corporate color primary bar, subtle geometric headers).
- **Technical Scope**:
  - Embed logo graphics into PDF using `pdf-lib` (`embedPng`, `embedJpg`).
  - Add color picker or preset selector for layout accent colors.

---

### 6. Letter Footer Section (DIN 5008 Compliant)

- **Intention**: Add a customizable multi-column footer at the bottom of the page, mandatory for formal and business correspondence.
- **Core Features**:
  - **Multi-column Layout** (1 to 4 columns):
    - Column 1: Company details / Management (e.g., Managing Directors, HRB, Court).
    - Column 2: Contact info (Phone, Email, Website).
    - Column 3: Bank details (Bank Name, IBAN, BIC).
    - Column 4: Tax information (Tax ID / Steuernummer, VAT ID / USt-IdNr.).
  - **Page Numbering**: Automatic "Page X of Y" rendering for multi-page letters.
  - **Toggle**: Ability to show/hide footer per document type (e.g. private vs. business letter).
- **Technical Scope**:
  - Extend `pdfDataSchema` and PDF layout calculation in `src/components/pdf/generatePDF.ts` to dynamically reserve bottom margin (approx. 20-25mm) and draw footer text columns.
