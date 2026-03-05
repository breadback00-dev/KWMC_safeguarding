# Community Hub Child Attendance & Safeguarding System

A comprehensive system for managing children's club attendance with integrated safeguarding notifications via SMS.

## Core Features

- **QR Code Check-in/Check-out**: Seamless logging of child arrivals and departures.
- **Automated SMS Notifications**: Parents receive instant updates when their child arrives or leaves using Twilio.
- **Late Arrival & Absence Alerts**: Buffer-based absence detection, triggering alerts to parents if a child hasn't arrived.
- **Parent Reply Handling**: Two-way SMS integration for handling replies like 'LATE' or 'NOT COMING'.
- **Session Tracking**: Management of daily sessions, capacity limits, and registrations.
- **Safeguarding Log**: A persistent database trail of every check-in, check-out, alert, and reply for safeguarding compliance.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database & Auth**: Supabase
- **Communications**: Twilio SMS
- **Hosting**: Vercel

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and populate the required keys for Supabase and Twilio.
   ```bash
   cp .env.example .env.local
   ```

3. **Database Setup**:
   Run the SQL scripts located in `docs/schema.sql` against your Supabase project.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Project Structure
- `/app`: Next.js App Router folders and API endpoints.
- `/components`: Reusable React components.
- `/lib`: Utilities for Supabase, QR generation, SMS sending, etc.
- `/cron`: Node.js cron scripts for checking absences.
- `/types`: TypeScript interfaces.
- `/docs`: Documentation and database schemas.
