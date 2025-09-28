# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Development with Turbopack (recommended)
npm run dev              # Clean .next and start with Turbopack
npm run dev:turbo        # Start with Turbopack (no cleaning)
npm run dev:fast         # Fast dev on port 3001 with Turbopack
npm run dev:debug        # Debug mode with Turbopack
npm run dev:clean        # Clean .next, cache, and start with Turbopack
npm run dev:safe         # Clean start on port 3001
npm run dev:no-turbo     # Start without Turbopack (fallback)
```

### Build Commands
```bash
npm run build            # Production build with Turbopack
npm run build:analyze    # Build with bundle analyzer
npm run build:prod       # Production build with NODE_ENV=production
npm run start            # Start production server
npm run start:prod       # Start production server with NODE_ENV
```

### Linting and Code Quality
```bash
npm run lint             # Run ESLint (Next.js config)
```

### Database and Setup
```voir supabase en ligne
```

### Migration Scripts
```bash
npm run migrate:prepare       # Prepare migration to new account
npm run migrate:validate      # Validate migration
npm run optimize:pre-migration # Optimize before migration
```

### Maintenance
```bash
npm run clean:build       # Clean build directories
npm run clean:cache       # Clean Turbo and Node cache
npm run fresh:install     # Clean reinstall dependencies
npm run optimize:images   # Optimize images
npm run analyze:bundle    # Analyze bundle size
npm run perf:audit        # Performance audit
```

### Testing Commands
Currently no specific test commands are configured. Check if tests need to be set up.

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15 with App Router and Turbopack
- **Authentication**: NextAuth v5 with Supabase adapter and credentials provider
- **Database**: Supabase (PostgreSQL) with custom auth table
- **UI**: Tailwind CSS v4 + shadcn/ui components (Radix UI based)
- **Styling**: Tailwind with custom design system and Outfit/FreeMono fonts
- **Deployment**: Vercel with optimized configuration

### Authentication System
- Custom credentials provider with bcrypt password hashing
- Role-based access control (RBAC) with 5 roles:
  - ADMIN, SECRETAIRE, CONTROLEUR_BUDGETAIRE, ORDONNATEUR, AGENT_COMPTABLE
- JWT session strategy with Supabase token generation
- Protected routes using middleware and session validation

### Application Structure
```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (protected)/         # Role-based protected routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── cb-dashboard/    # Contrôleur Budgétaire dashboard
│   │   ├── ordonnateur-dashboard/ # Ordonnateur dashboard
│   │   ├── ac-dashboard/    # Agent Comptable dashboard
│   │   ├── documents/       # Document management
│   │   ├── folders/         # Folder management
│   │   └── users/           # User management
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Authentication components
│   ├── cb/                  # Contrôleur Budgétaire components
│   ├── ordonnateur/         # Ordonnateur components
│   ├── ac/                  # Agent Comptable components
│   ├── documents/           # Document management components
│   ├── upload/              # File upload components
│   └── shared/              # Shared components
├── lib/                     # Utilities and configuration
├── types/                   # TypeScript definitions
└── hooks/                   # Custom React hooks
```

### Business Workflow
The application implements a financial document approval workflow:
1. **SECRETAIRE**: Creates and submits folders with documents
2. **CONTROLEUR_BUDGETAIRE**: Validates budget controls and operation types
3. **ORDONNATEUR**: Performs specific verifications and approvals
4. **AGENT_COMPTABLE**: Final validation and "quitus" generation

### Key Libraries and Dependencies
- **UI Components**: @radix-ui/* components with shadcn/ui styling
- **Forms**: react-hook-form with @hookform/resolvers (Zod validation)
- **Icons**: lucide-react (configured to avoid HMR issues)
- **Database**: @supabase/supabase-js with Row Level Security
- **PDF Generation**: jspdf with html2canvas for quitus documents
- **File Handling**: react-dropzone for uploads
- **Date Handling**: date-fns for date utilities
- **Notifications**: sonner for toast notifications
- **Analytics**: @vercel/analytics and @vercel/speed-insights

### Development Guidelines
- **UI Components**: Always use shadcn/ui components based on Radix UI
- **Styling**: Use Tailwind CSS with the custom design system
- **TypeScript**: Strict type checking enabled with custom types in src/types/
- **Code Quality**: ESLint with Next.js TypeScript config
- **Performance**: Turbopack enabled for fast development
- **Caching**: Optimized caching strategy for images and static assets

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

### Important Configuration Notes
- Turbopack is preferred for development (faster HMR)
- ESLint and TypeScript errors ignored during builds (configured for production deployment)
- Image optimization configured for Vercel with AVIF/WebP formats
- Security headers and CSP configured in next.config.ts
- Row Level Security (RLS) enabled on Supabase
- Custom webpack fallbacks for server-side compatibility