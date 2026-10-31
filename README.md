# DIN Letter Generator

[![Tests](https://github.com/arkarlov/din-letter-generator/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/arkarlov/din-letter-generator/actions/workflows/tests.yml)

## Requirements

- Node.js 20.9 or newer
- pnpm

## Getting Started

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm dev           # Start the development server
pnpm build         # Create a production build
pnpm start         # Serve the production build
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
pnpm typecheck     # Run TypeScript checks
pnpm lint          # Run ESLint
pnpm format:check  # Check formatting with Prettier
```

## PDF Generation

The form validates letter data with the shared Zod schema before submitting it to `POST /api/generate-pdf`. The endpoint validates the request again and returns a PDF response.

The renderer creates A4 PDFs with sender and recipient addresses, an information block, date, subject, and paginated message text. It supports Form A and Form B layout geometry. Invalid requests return `400`; content that does not fit the layout returns `422`.

## Project Structure

- `src/app/` — Next.js pages, root layout, and PDF API route
- `src/components/` — Letter form and shared form controls
- `src/lib/letter/` — Letter schema, form-data conversion, and field errors
- `src/lib/pdf/` — PDF generation entry points (`generate.ts`), with `letter/`, `envelope/` and `shared/` (fonts, drawing, text wrapping) modules
- `src/hooks/` — Client-side PDF request and download flow
- `docs/` — DIN 5008 reference, envelope addressing guide, and project roadmap

## Tests

Vitest tests cover letter validation, PDF wrapping and pagination, A/B layout geometry, PDF generation, and API error responses.
