# ADHD Clinic - Patient Management System

A telehealth patient management system for ADHD clinics, featuring online booking, video consultations, and prescription management.

## Features

- **Patient Portal**: Book appointments, upload referrals, join video consultations
- **Doctor Dashboard**: Manage availability roster, conduct telehealth appointments, write notes
- **Reception Portal**: View and manage bookings, search patients
- **Admin Dashboard**: User management, reports, clinic settings
- **Video Consultations**: Secure telehealth via Daily.co
- **Payments**: Stripe checkout for appointment deposits

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe
- **Video**: Daily.co
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Daily.co account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/blockchainbob1/adhd-cloud.git
   cd adhd-cloud
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your credentials:
   ```
   DATABASE_URL="postgresql://..."
   AUTH_SECRET="your-secret"
   STRIPE_SECRET_KEY="sk_..."
   STRIPE_PUBLISHABLE_KEY="pk_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   DAILY_API_KEY="..."
   ```

5. Push the database schema:
   ```bash
   npm run db:push
   ```

6. Seed the database with test accounts:
   ```bash
   npm run db:seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

### Test Accounts

After seeding, you can log in with these accounts (password: `password123`):

| Role | Email |
|------|-------|
| Admin | admin@adhdclinic.com.au |
| Doctor | doctor@adhdclinic.com.au |
| Reception | reception@adhdclinic.com.au |
| Patient | patient@example.com |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login/Register pages
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── admin/         # Admin pages
│   │   ├── doctor/        # Doctor pages
│   │   ├── patient/       # Patient pages
│   │   └── reception/     # Reception pages
│   ├── api/               # API routes
│   └── consultation/      # Video call page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── video/             # Video call components
├── lib/                   # Utilities (auth, prisma, stripe, daily)
└── actions/               # Server actions
```

## Consultation Types

| Type | Duration | Price |
|------|----------|-------|
| Initial Consultation | 30 min | $500 |
| Follow-up | 15 min | $300 |

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run db:push    # Push Prisma schema to database
npm run db:seed    # Seed database with test data
npm run db:studio  # Open Prisma Studio
```

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/blockchainbob1/adhd-cloud)

Configure environment variables in Vercel dashboard.

## License

Private - All rights reserved.
