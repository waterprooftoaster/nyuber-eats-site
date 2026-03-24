# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

npm run test         # Run all unit tests (Vitest + jsdom)
npx vitest run tests/unit/path/to/file.test.ts   # Run a single unit test

npx playwright test               # Run all E2E tests
npx playwright test tests/e2e/home.spec.ts        # Run a single E2E spec

npx tsx scripts/seed.ts           # Seed local Supabase with eateries/menu items

supabase start       # Start local Supabase (Docker required)
supabase stop
supabase db push     # Apply migrations to local DB
supabase migration new <name>     # Create a new migration file
```

E2E tests auto-start the dev server if not already running. The `authenticated/` test suite depends on `auth.setup.ts` running first, which writes `.auth/user.json`.

## Architecture

### Domain Model

| Entity | Notes |
|--------|-------|
| `schools` | Top-level tenant (currently NYU) |
| `eateries` | Dining halls/restaurants scoped to a school |
| `menu_items` | Belong to an eatery; have `original_price_cents` (what it costs the swiper) and `market_price_cents` (what the orderer pays) |
| `menu_item_option_groups` / `menu_item_options` | Modifiers (size, toppings) with `single`/`multiple` selection |
| `profiles` | Extends Supabase auth users; has `school_id`, `phone` for SMS |
| `orders` | Core entity — see order lifecycle below |
| `payments` | Created after Stripe PaymentIntent; tracks `platform_fee_cents` ($1 flat) |
| `stripe_accounts` | Swiper's Stripe Connect account; must have `onboarding_complete = true` to accept orders |
| `carts` / `cart_items` | Session-based for guests (cookie `cart_session_id`), user-based for auth'd users |
| `conversations` / `messages` | Created when a swiper accepts an order; supports orderer↔swiper in-order chat |

### Order Lifecycle (Pull System)

Orders flow through a state machine (`lib/orders/state-machine.ts`):

```
pending → accepted → in_progress → completed → paid
                 ↘ cancelled (from any state except paid)
```

- **Orderer** creates an order (`POST /api/orders`) and it enters `pending`
- **Swiper** browses the pending queue and pulls (`PATCH /api/orders/[id]/accept`) — atomic update prevents race conditions
- Swiper advances status via `PATCH /api/orders/[id]/status`
- Payment triggered via `PATCH /api/orders/[id]/pay` or Stripe webhook

### Two Supabase Clients

```
lib/supabase/server.ts   — Cookie-based SSR client (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
                           Use for all authenticated user operations; respects RLS
lib/supabase/service.ts  — Service role client (SUPABASE_SECRET_KEY)
                           Bypasses RLS; use only for server-side operations that anon/user roles can't do
                           (e.g., guest order inserts, creating conversations, sending notifications)
```

Never use the service client in client-side code or where RLS should apply.

### Guest vs Authenticated Ordering

Guest users (unauthenticated) can place orders but must provide `guest_name`, `guest_phone`, and a Stripe PaymentMethod ID (`guest_stripe_pm_id`). Because the anon role has no INSERT grant on `orders`, guest order creation uses the service client. When a swiper accepts a guest order, `lib/orders/auto-charge.ts` fires the Stripe PaymentIntent immediately using the stored PM, then clears `guest_stripe_pm_id` from the record.

Authenticated orderers go through an embedded Stripe Checkout session (`/api/stripe/checkout-session`).

### Stripe Connect

Swipers must complete Stripe Connect onboarding before accepting orders. The flow is:
1. `POST /api/stripe/connect/create` — creates a Connected Account
2. `POST /api/stripe/connect/onboard` — returns an onboarding URL
3. `account.updated` webhook marks `onboarding_complete = true`

Payments use `application_fee_amount` + `transfer_data.destination` so the $1 platform fee stays on the platform and the rest transfers to the swiper's account.

### Chat and Notifications

Order status changes are surfaced via in-app Realtime chat (Supabase Realtime). The `messages` table is published to `supabase_realtime` for INSERT streaming. Delivery photo messages expire after 7 days; text/system messages expire after 48 hours, cleaned up hourly by `public.cleanup_expired_messages()`.

### API Conventions

All routes use helpers from `lib/api/helpers.ts`:
- `apiSuccess(data, status?)` — wraps response in `NextResponse.json`
- `apiError(message, status)` — same pattern for errors
- `getAuthenticatedUser(supabase)` — returns `null` if unauthenticated (never throws)

All request bodies are validated with Zod schemas defined in `lib/types/api.ts` before any DB access.

### Next.js Parallel Routes

The root layout (`app/layout.tsx`) uses `@modal` as a parallel route slot. The cart page at `/cart` is intercepted as a modal via `app/@modal/(.)cart/page.tsx` when navigating client-side; navigating directly renders the full page at `app/cart/page.tsx`.

### Path Alias

`@` maps to the repo root (`/`), configured in both `tsconfig.json` and `vitest.config.ts`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```
