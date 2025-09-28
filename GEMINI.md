# Gemini Project Context: ACGE

## Project Overview

This is a Next.js 15 (with Turbopack) web application for "Agence Comptable des Grandes Écoles" (ACGE). It's a comprehensive accounting management application for major schools in Gabon. The application is built with a modern tech stack, including:

*   **Frontend:** Next.js 15, React 18, TypeScript
*   **Backend:** Next.js API Routes, Supabase (PostgreSQL)
*   **Authentication:** NextAuth.js
*   **UI/UX:** Tailwind CSS, Shadcn/UI
*   **Deployment:** Vercel
*   **Analytics:** Vercel Speed Insights & Analytics

The application features a role-based access control system with the following roles: Secretary, Budget Controller, Payer, and Accounting Officer. The workflow involves creating and validating files, with a complete audit trail.

## Building and Running

### Key Commands

*   **Development:** `npm run dev` (starts the development server with Turbopack)
*   **Build:** `npm run build` (creates a production build)
*   **Start:** `npm run start` (starts the production server)
*   **Lint:** `npm run lint` (runs the linter)

### Docker

The project includes a `docker-compose.yml` file for running a PostgreSQL database and pgAdmin for local development.

*   **Start Docker containers:** `npm run docker:up`
*   **Stop Docker containers:** `npm run docker:down`
*   **View Docker logs:** `npm run docker:logs`

## Development Conventions

*   **TypeScript:** The project uses TypeScript with strict mode enabled.
*   **Linting:** ESLint is used for linting, with the configuration in `.eslintrc.json`.
*   **Styling:** Tailwind CSS is used for styling, with the configuration in `tailwind.config.ts`.
*   **Code Structure:** The project follows the standard Next.js `app` directory structure.
*   **Path Aliases:** The project uses path aliases (e.g., `@/components/*`) for cleaner imports, configured in `tsconfig.json` and `next.config.ts`.
*   **Database:** Supabase (PostgreSQL) is used for the database. Migrations are located in the `supabase/migrations` directory.
*   **Authentication:** NextAuth.js is used for authentication, with a Supabase adapter.
*   **Deployment:** The project is deployed on Vercel.
