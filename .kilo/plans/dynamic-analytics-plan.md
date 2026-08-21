# Plan: Dynamic Metrics, Statistics & Analytics

## Context
Currently, the app shows hardcoded/static values in 3 places:
- Homepage (`app/page.tsx`): fake category counts, fake trust stats
- User Dashboard (`app/dashboard/page.tsx`): hardcoded trend labels, empty Recent Activity placeholder
- Admin Dashboard (`app/admin/page.tsx`): basic stat cards with no charts or time-series

## Goal
Replace all static numbers with real database-driven metrics, and add real-time/dynamic updates where appropriate.

## Strategy
**A) Server-rendered on navigation** for most metrics (simple, reliable, no extra infra).
**B) Client-side polling** for admin dashboard (optional, 30s interval) to simulate live monitoring.
**C) Public homepage stats** pulled from real DB counts.

## Granularity
- **Homepage**: All-time totals (users, transactions, GMV)
- **User Dashboard**: Weekly comparison where meaningful, all-time totals otherwise
- **Admin Dashboard**: Last 7 days + 30 days trend data

## Implementation Tasks

### 1. Dynamic Homepage Stats (public)
- Create `app/api/stats/public/route.ts`
- Query: total users, total transactions, total GMV, active listings
- Update `app/page.tsx` to fetch and display these values
- Replace hardcoded category counts with real counts per category

### 2. Dynamic User Dashboard
- Update `app/dashboard/page.tsx` to compute trends from DB:
  - Active listings vs last week
  - Purchases this week
  - Sales revenue vs last week
- Add Recent Activity feed from `db.notifications` or recent transactions
- Keep server-rendered; no polling needed

### 3. Admin Analytics Dashboard
- Create `app/api/admin/analytics/route.ts`
- Return:
  - Revenue over last 7 days (daily buckets)
  - Transaction volume last 7 days
  - New user signups last 7 days
  - Top 5 categories by sales
- Add chart library: `recharts` (lightweight, server-component friendly)
- Update `app/admin/page.tsx` with charts and trend cards
- Add optional 30s polling via `useEffect` + `fetch` for live feel

### 4. Shared Utilities
- Create `lib/analytics.ts` with helper functions:
  - `getRevenueTrend(days)`
  - `getTransactionTrend(days)`
  - `getCategoryBreakdown()`
  - `getUserGrowth(days)`

## Validation
- Homepage stats update when new users/products/transactions are created
- User dashboard shows accurate personal stats
- Admin charts render correctly with real data
- No hardcoded numbers remain in analytics surfaces

## Out of Scope
- WebSocket real-time (overkill for MVP)
- Advanced fraud/anomaly detection
- Export to CSV/PDF
