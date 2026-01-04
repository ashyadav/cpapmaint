# CPAP Maintenance Tracker - Implementation Plan

## Overview
Progressive Web App for tracking CPAP equipment cleaning schedules, maintenance reminders, and component replacement timelines.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3)
- **State Management**: Zustand
- **PWA**: Vite PWA Plugin + Service Worker
- **Notifications**: Web Push API + node-cron scheduler
- **Date Handling**: date-fns

## Project Structure
```
cpapmaint/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── dashboard/    # Dashboard view
│   │   │   ├── components/   # Component management
│   │   │   ├── calendar/     # Calendar view
│   │   │   └── reminders/    # Reminder list
│   │   ├── store/            # Zustand stores
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # API client, utils
│   └── public/
│       └── manifest.json     # PWA manifest
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts   # SQLite connection
│   │   │   └── schema.sql    # Database schema
│   │   ├── routes/           # API endpoints
│   │   ├── services/
│   │   │   ├── schedulerService.ts    # Cron job
│   │   │   └── notificationService.ts # Push notifications
│   │   └── index.ts
│   └── data/
│       └── cpap.db          # SQLite database file
└── package.json             # Monorepo root
```

## Database Schema

### Core Tables
1. **components** - CPAP parts to track
   - id, name, type, cleaning_frequency (daily/weekly)
   - cleaning_time (HH:MM), replacement_months
   - current_install_date, next_replacement_date

2. **cleaning_completions** - Completion history
   - id, component_id, completed_at, was_on_time, notes

3. **replacement_history** - Replacement tracking
   - id, component_id, old_install_date, new_install_date, notes

4. **notification_subscriptions** - Push subscriptions
   - id, endpoint, p256dh, auth

5. **notification_log** - Notification tracking
   - id, subscription_id, component_id, notification_type, sent_at

## Key Features

### 1. Component Management
- Track 5 CPAP parts: mask, nose piece, airflow hose, humidifier container, CPAP filter
- Set cleaning frequency (daily/weekly) and reminder time
- Set replacement duration (e.g., 3 months, 6 months)
- Calculate next replacement date automatically

### 2. Cleaning Reminders
- Push notifications at scheduled time
- Mark reminders as complete with notes
- Track completion history
- Visual indicators for overdue items

### 3. Replacement Tracking
- Remind 2 weeks before replacement due
- Example: "Please order airflow hose - replacement due in 10 days"
- Mark component as replaced
- Reset replacement timer with new install date

### 4. Dashboard
- Compliance statistics (% cleaned on time)
- Upcoming reminders
- Replacement alerts
- Quick action buttons

### 5. Calendar View
- Monthly calendar with color-coded days
  - Green: completed on time
  - Yellow: completed late
  - Red: missed cleaning
  - Gray: no schedule
- Click day for details
- Month navigation

## Implementation Phases

### Phase 1: Project Setup (Critical Foundation)
**Goal**: Development environment and infrastructure

1. **Initialize Monorepo Structure**
   - Create client/ and server/ directories
   - Set up workspace package.json
   - Initialize Git repository

2. **Frontend Setup**
   - Create Vite + React + TypeScript project
   - Install Tailwind CSS
   - Configure shadcn/ui (npx shadcn-ui@latest init)
   - Set up React Router for navigation

3. **Backend Setup**
   - Create Express + TypeScript server
   - Install better-sqlite3
   - Set up CORS and error handling middleware

4. **Database Initialization**
   - Create schema.sql with all tables
   - Initialize SQLite database
   - Create seed data for 5 default components

**Critical Files**:
- `cpapmaint/package.json` - workspace root
- `cpapmaint/server/src/db/schema.sql` - database schema
- `cpapmaint/server/src/db/database.ts` - SQLite connection
- `cpapmaint/client/vite.config.ts` - Vite configuration
- `cpapmaint/client/tailwind.config.js` - Tailwind config

**Deliverables**:
- npm run dev works for both client and server
- Database created with schema
- Basic React app loads
- API server responds to health check

---

### Phase 2: Component Management (Core CRUD)
**Goal**: Manage CPAP components

**Backend**:
- API routes: GET/POST/PUT/DELETE `/api/components`
- Validation using Zod schemas
- Calculate next_replacement_date: `addMonths(install_date, replacement_months)`

**Frontend**:
- ComponentList page with component cards
- ComponentEditor dialog (shadcn/ui Dialog)
- Form with validation
  - Name (text)
  - Type (select: mask, nose_piece, etc.)
  - Cleaning frequency (select: daily, weekly)
  - Cleaning time (time picker)
  - Replacement duration (number input, 1-24 months)
  - Install date (date picker)
- Zustand store for component state
- API client for HTTP requests

**Critical Files**:
- `cpapmaint/server/src/routes/components.ts` - API routes
- `cpapmaint/server/src/services/componentService.ts` - business logic
- `cpapmaint/client/src/components/components/ComponentList.tsx`
- `cpapmaint/client/src/components/components/ComponentEditor.tsx`
- `cpapmaint/client/src/store/componentStore.ts`
- `cpapmaint/client/src/lib/api.ts` - API client

**Deliverables**:
- Create, read, update, delete components
- Form validation works
- Components persist in database

---

### Phase 3: Cleaning Reminders & Completions
**Goal**: Track cleaning completion

**Backend**:
- API routes: POST/GET `/api/completions`
- GET `/api/reminders/today` - today's pending reminders
- Calculate if completion was on-time
- Prevent duplicate completions for same day

**Frontend**:
- ReminderList showing today's reminders
- ReminderCard with "Mark Complete" button
- CompleteReminderDialog with notes field
- Completion history view
- Visual indicators (badges) for status:
  - Pending (yellow)
  - Completed (green)
  - Overdue (red)

**Critical Files**:
- `cpapmaint/server/src/routes/completions.ts`
- `cpapmaint/server/src/services/reminderService.ts`
- `cpapmaint/client/src/components/reminders/ReminderList.tsx`
- `cpapmaint/client/src/components/reminders/CompleteReminderDialog.tsx`
- `cpapmaint/client/src/store/reminderStore.ts`

**Deliverables**:
- Mark reminders as complete
- View today's pending reminders
- See completion history

---

### Phase 4: Calendar View
**Goal**: Visual monthly calendar

**Backend**:
- GET `/api/completions/calendar/:year/:month`
- Return completions grouped by date
- Include which days should have cleanings

**Frontend**:
- Custom calendar component using shadcn/ui Calendar primitive
- Color-coded day cells:
  - Green: completed on schedule
  - Yellow: completed late (after scheduled time)
  - Red: missed (no completion on scheduled day)
  - Gray: not a scheduled day
- Month navigation (previous/next buttons)
- Calendar legend
- Click day to see details in dialog

**Critical Files**:
- `cpapmaint/server/src/routes/calendar.ts`
- `cpapmaint/client/src/components/calendar/CalendarView.tsx`
- `cpapmaint/client/src/components/calendar/CalendarDay.tsx`
- `cpapmaint/client/src/hooks/useCalendar.ts`

**Deliverables**:
- Working monthly calendar
- Color-coded compliance indicators
- Navigate between months

---

### Phase 5: Dashboard & Statistics
**Goal**: Overview with stats and insights

**Backend**:
- GET `/api/stats/overview`
  - Overall compliance percentage
  - Total completions this month
  - Missed cleanings this month
- GET `/api/stats/compliance` - per-component stats
- GET `/api/reminders/upcoming` - next 7 days
- GET `/api/components/replacement-alerts` - due within 14 days

**Frontend**:
- Dashboard with grid layout (Tailwind Grid)
- StatsCard components showing key metrics
- Simple progress rings (SVG) for compliance
- UpcomingReminders widget
- ReplacementAlerts widget with urgency indicators
- Quick action buttons

**Critical Files**:
- `cpapmaint/server/src/routes/stats.ts`
- `cpapmaint/server/src/services/statsService.ts`
- `cpapmaint/client/src/components/dashboard/Dashboard.tsx`
- `cpapmaint/client/src/components/dashboard/StatsCard.tsx`
- `cpapmaint/client/src/components/dashboard/ComplianceChart.tsx`

**Deliverables**:
- Dashboard with key metrics
- Visual compliance indicators
- Upcoming reminders preview

---

### Phase 6: PWA & Push Notifications (Most Complex)
**Goal**: Installable app with background notifications

**PWA Setup**:
1. Create manifest.json
   - App name, icons (generate 192x192 and 512x512)
   - Display: standalone, theme colors
2. Install Vite PWA Plugin
   - Configure workbox for caching strategy
   - Pre-cache static assets
   - Network-first for API calls
3. Service worker for offline capability
4. Install prompt UI

**Push Notifications - Backend**:
1. Install web-push library
2. Generate VAPID keys: `npx web-push generate-vapid-keys`
3. Store keys in .env
4. API routes:
   - POST `/api/notifications/subscribe` - save subscription
   - POST `/api/notifications/unsubscribe` - remove subscription
   - GET `/api/notifications/vapid-key` - get public key
5. Set up node-cron scheduler
   - Run every 15 minutes: `*/15 * * * *`
   - Check for due reminders
   - Send push notifications via Web Push API
6. Check replacement warnings (14 days before)

**Push Notifications - Frontend**:
1. Request notification permission
2. Subscribe to push notifications when granted
3. Send subscription to backend
4. Handle permission denial gracefully
5. NotificationPermission component with visual guide

**Service Worker**:
- Listen for 'push' events
- Display notifications with actions
- Handle 'notificationclick' to open app

**Critical Files**:
- `cpapmaint/client/public/manifest.json`
- `cpapmaint/client/vite.config.ts` - PWA plugin config
- `cpapmaint/server/src/services/schedulerService.ts` - cron job
- `cpapmaint/server/src/services/notificationService.ts` - Web Push
- `cpapmaint/client/src/components/notifications/NotificationPermission.tsx`
- `cpapmaint/client/src/hooks/useNotifications.ts`

**Technical Details**:

Cron Job Logic:
```typescript
// Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  // 1. Get components with reminders due now
  // 2. Check if already completed today
  // 3. Send push notification if not completed
  // 4. Check replacement warnings (14 days before)
  // 5. Send replacement notification if not sent today
});
```

Notification Payload:
```json
{
  "title": "CPAP Cleaning Reminder",
  "body": "Time to clean your Full Face Mask",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/badge-72x72.png",
  "tag": "cleaning-1-timestamp",
  "data": {
    "url": "/?component=1",
    "componentId": 1
  }
}
```

**Deliverables**:
- Installable PWA (Add to Home Screen)
- Push notifications at scheduled times
- Automated reminder system
- Offline capability

---

### Phase 7: Replacement Tracking
**Goal**: Track part replacements

**Backend**:
- POST `/api/replacements` - mark component replaced
  - Create replacement_history record
  - Update component.current_install_date
  - Recalculate next_replacement_date
- GET `/api/replacements/:componentId` - history

**Frontend**:
- Replacement warning banner on dashboard (if < 14 days)
- "Mark as Replaced" dialog
  - New install date (default: today)
  - Notes field (optional)
- Replacement history view
- Confirmation before replacing

**Critical Files**:
- `cpapmaint/server/src/routes/replacements.ts`
- `cpapmaint/server/src/services/replacementService.ts`
- `cpapmaint/client/src/components/components/ReplacementDialog.tsx`

**Deliverables**:
- Mark components as replaced
- Reset replacement timer
- View replacement history

---

### Phase 8: Polish & UX Improvements
**Goal**: Production-ready polish

**UX Improvements**:
- Loading states (skeleton screens)
- Error messages (toast notifications)
- Empty states with helpful prompts
- Smooth transitions (Tailwind transitions)
- Responsive design (mobile-first)
- Dark mode support (optional)

**Performance**:
- Lazy load routes
- Optimize images
- API response caching with React Query
- Optimistic UI updates

**Edge Cases**:
- Handle deleted components with completions
- Handle offline completions (sync when online)
- Handle notification permission revoked
- Validate dates (install date not in future)

**Testing**:
- Unit tests for business logic
- Test notification scheduling logic
- Test date calculations
- PWA audit with Lighthouse

**Deliverables**:
- Polished, production-ready app
- Good Lighthouse scores (>90)
- Handled edge cases

---

## Critical Technical Decisions

### 1. Notification Scheduling Strategy
- **Cron job** runs every 15 minutes on backend
- Round reminder times to nearest 15-min window (e.g., 8:07 → 8:00)
- Check if reminder due in current window
- Check if already completed today (prevent duplicates)
- Send push notification via Web Push API
- Service worker displays notification even when app closed

### 2. Replacement Warning Logic
- Start warning 14 days before due date
- Send once per day (not every 15 minutes)
- Calculate days remaining: `differenceInDays(next_replacement_date, today)`
- Message format: "Please order {component} - replacement due in {X} days"
- Update urgency as date approaches

### 3. Calendar Color Coding
- **Green**: Completed within 1 hour of scheduled time
- **Yellow**: Completed but late (>1 hour after scheduled time)
- **Red**: Missed (no completion on scheduled day)
- **Gray**: Not a scheduled day (e.g., if weekly on Monday, other days are gray)

### 4. Data Persistence Strategy
- SQLite as single source of truth
- Zustand stores sync from API
- Optimistic updates with rollback on error
- Service worker caches API responses for offline viewing
- Background sync for offline completions (optional enhancement)

## Environment Variables

### Backend (.env)
```env
PORT=3001
DATABASE_PATH=./data/cpap.db
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:your-email@example.com
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## Running the App

### Development
```bash
# Install dependencies
npm install

# Run backend
cd server && npm run dev

# Run frontend (in another terminal)
cd client && npm run dev
```

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start backend
cd server && npm start
```

## Deployment Notes

### Requirements
- Node.js 18+
- HTTPS required (for PWA and push notifications)
- Persistent storage for SQLite database

### Hosting Options
- **Frontend**: Vercel, Netlify, Cloudflare Pages (static build)
- **Backend**: Railway, Render, DigitalOcean App Platform (Node.js)
- **Database**: SQLite file on server filesystem (or use PostgreSQL for production)

### PWA Requirements
- Valid SSL certificate (HTTPS)
- Service worker registration
- Web manifest with required fields
- Icons in multiple sizes (192x192, 512x512)

## Key Dependencies

### Frontend
- react, react-dom, react-router-dom
- zustand (state management)
- date-fns (date utilities)
- @tanstack/react-query (API caching, optional)
- zod (validation)
- tailwindcss
- shadcn/ui components
- vite-plugin-pwa

### Backend
- express
- better-sqlite3
- web-push
- node-cron
- cors
- dotenv
- zod (shared validation)

## Success Criteria

- User can add/edit/delete CPAP components
- User receives push notifications at scheduled times
- User can mark cleanings as complete
- Calendar shows color-coded completion history
- Dashboard displays compliance statistics
- User receives replacement warnings 14 days in advance
- User can mark components as replaced and reset timers
- App works offline (view data, mark completions)
- App is installable as PWA
- App scores >90 on Lighthouse PWA audit

## Future Enhancements (Post-MVP)

1. **Multi-device sync**: User accounts with cloud sync
2. **Advanced analytics**: Trends over time, export data
3. **Smart recommendations**: Optimal cleaning times based on usage
4. **Integration**: Import data from CPAP machine, sync with calendar apps
5. **Social**: Share schedules, community best practices
6. **Recurring orders**: Integration with medical supply stores

---

## Implementation Order Summary

1. ✅ Project setup + database schema
2. ✅ Component CRUD (backend + frontend)
3. ✅ Cleaning reminders + completions
4. ✅ Calendar view with color coding
5. ✅ Dashboard with statistics
6. ✅ PWA + push notifications (most complex)
7. ✅ Replacement tracking
8. ✅ Polish + production readiness

**Estimated Timeline**: 6-8 weeks for full implementation (working part-time)

Each phase builds on the previous, so order is important. PWA + notifications (Phase 6) is the most complex and should be done after core features are solid.
