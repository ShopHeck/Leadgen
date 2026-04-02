# System Architecture

## Stack
Frontend:
- Next.js
- Tailwind
- TypeScript

Backend:
- Next API routes
- PostgreSQL
- Prisma

Infra:
- Vercel
- Upstash Redis
- Stripe
- Twilio
- Resend

## Core Services
- Auth + RBAC
- Lead ingestion API
- CRM service
- Automation engine (event-based)
- Messaging service
- AI service
- Analytics service

## Event System
Events:
- lead.created
- lead.scored
- booking.created
- message.sent
- revenue.recorded

## Flow
1. Form submit → lead.created
2. Score lead → lead.scored
3. Trigger automation
4. Send SMS/email
5. Push to booking
6. Track revenue
