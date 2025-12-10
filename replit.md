# Kashta Planning App

## Overview

Kashta is a Gulf-cultural trip planning application designed for organizing desert camping trips (كشتات) with friends and family. The app manages events, participants, items/equipment, and contributions with an Arabic-first RTL interface. It blends traditional Gulf aesthetic with modern productivity app patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with HMR support

The frontend follows an RTL-first layout with Arabic as the primary language. All text flows right-to-left. The design uses Noto Kufi Arabic font family with a warm desert-inspired color palette.

### Backend Architecture
- **Framework**: Express.js on Node.js
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod with drizzle-zod integration

The server handles API routes, serves the static frontend in production, and uses Vite middleware in development for HMR.

### Data Model
Core entities defined in `shared/schema.ts`:
- **Categories**: Equipment categories (coffee, grilling, camping, etc.)
- **Items**: Equipment items belonging to categories
- **Participants**: People who join trips
- **Events**: Trip/event records with dates and locations
- **EventParticipants**: Junction table linking events and participants
- **Contributions**: Items contributed by participants for events
- **ActivityLogs**: Audit trail of actions
- **SettlementRecords**: Tracks debts between participants after expense splitting
- **Users**: User accounts (future authentication)

### Expense Settlement System
The app includes a complete expense settlement system:
- **Fair Share Calculation**: Expenses are split equally among participants
- **Decimal Precision**: All amounts use 2 decimal places (e.g., 1.50 QAR for 3 QAR split between 2)
- **Settlement Tracking**: Track who owes whom with toggle for marking debts as settled
- **Unassigned Costs**: Items without assigned participants are tracked separately and excluded from settlement math
- **Currency**: Qatari Riyal (QAR) with Arabic numeral formatting

### Debt Portfolio System
Cross-event debt aggregation:
- **Debt Overview** (`/debt`): Lists all participants with their net debt position
- **Participant Portfolio** (`/debt/:participantId`): Detailed breakdown per participant
  - Total paid across all events
  - Total owed to others / Total owed to you
  - Counterparty breakdown (aggregated debts with each person)
  - Per-event contribution history

### Key Design Patterns
- Shared schema between client and server via `@shared/*` path alias
- Type-safe API with Zod schemas derived from Drizzle table definitions
- Optimistic UI updates with React Query mutations
- Component-based architecture with shadcn/ui primitives
- Theme support (light/dark mode) via CSS variables

### Project Structure
```
client/          # React frontend
  src/
    components/  # Reusable UI components
    pages/       # Route page components
    hooks/       # Custom React hooks
    lib/         # Utilities and constants
server/          # Express backend
  routes.ts      # API route definitions
  storage.ts     # Database access layer
  db.ts          # Database connection
shared/          # Shared types and schemas
  schema.ts      # Drizzle schema definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Database migration tooling (`db:push` command)

### Third-Party Services
- **Google Fonts**: Noto Kufi Arabic font family loaded via CDN

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `react-hook-form`: Form handling
- `zod`: Schema validation
- `date-fns`: Date formatting utilities
- `wouter`: Client-side routing
- `express`: HTTP server
- `pg`: PostgreSQL client