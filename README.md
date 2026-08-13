# Kapot Money

Kapot Money is a production-oriented personal finance web app built around a ledger model:

```text
opening balance + wallet movements = current balance
```

Income explains where money came from, wallets show where money is now, expenses show where money went, and transfers only move money between the user's own wallets.

## Stack

- Next.js App Router, React, TypeScript strict
- Tailwind CSS with shadcn-style local UI components
- Supabase Auth, PostgreSQL, Row Level Security and RPC
- Zod validation
- Recharts for reports
- dnd-kit for optional quick operation mode selection
- Vitest and Playwright

## Features

- Real Supabase registration, login, logout and password reset
- User-isolated finance books
- Wallets with integer minor-unit opening balances
- Income, expense, transfer and adjustment transactions
- Atomic transaction RPC with `transactions` and `transaction_entries`
- Multi-currency wallets and explicit FX transfer amounts
- Budgets and budget progress
- Transaction history with filters, edit and delete
- Category reports and monthly cash flow
- RLS policies for every user-owned table

## Environment

Copy `.env.example` to `.env.local` and set:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is optional and must stay server-only. It is used only by integration tests or trusted maintenance scripts.

## Supabase Setup

1. Create a Supabase project.
2. Apply migrations from `supabase/migrations/`.
3. Configure Auth redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your production `/auth/callback` URL
4. Start the app and register a user.

The migration creates:

- `user_profiles`
- `finance_books`
- `wallets`
- `categories`
- `transactions`
- `transaction_entries`
- `budgets`
- `debts`
- `debt_payments`
- `fx_rates`

All tables have RLS enabled. Child entities authorize through their `finance_book`, so another authenticated user cannot read or mutate data by guessing UUIDs.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Integration and E2E tests require real Supabase environment variables. Without them, those suites skip instead of using mocks.

To check whether the Supabase project from `.env.local` has the required public schema visible to PostgREST:

```bash
npm run db:check
```

Apply remote migrations before running the app against a hosted Supabase project:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
npm run db:check
```

Replace `your-project-ref` with the real project ref from `NEXT_PUBLIC_SUPABASE_URL`; do not include angle brackets.

## Seed Data

`supabase/seed.sql` is for local development only. Create a Demo User through Supabase Auth, then set `app.demo_user_id` before running the seed. Do not run seed automatically in production.

## Deployment

Deploy the Next.js app to Vercel and use Supabase for Auth/PostgreSQL. Set the same public Supabase variables in Vercel. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Architecture

- `src/lib/finance`: money and financial calculations
- `src/lib/data`: Supabase data access layer
- `src/lib/validation`: Zod schemas
- `src/app/app/actions.ts`: server-side mutations
- `supabase/migrations`: reproducible database schema, RLS, constraints and RPC

The UI intentionally avoids storing financial truth in React state. User actions persist through Supabase and pages refresh from database aggregates.
