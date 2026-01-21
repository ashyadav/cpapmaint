# CPAP Maintenance Tracker - Product Specification

## 1. Overview

A Progressive Web Application (PWA) that helps CPAP users maintain their equipment by tracking cleaning schedules, replacement cycles, and building consistent maintenance habits. The app focuses on simplicity, habit formation, and providing peace of mind without guilt-tripping or over-engineering.

### Primary Success Criteria
After 3 months of use, the user should have **built consistent habits** around CPAP maintenance, reducing decision fatigue and providing confidence in equipment hygiene.

---

## 2. User Context & Current State

**Current Situation:**
- User relies entirely on memory for maintenance tracking
- No existing logging system
- Components have different maintenance schedules (daily, weekly, monthly)
- Needs flexible approach to handle both calendar-based and usage-based tracking

**Key Pain Points:**
- Uncertainty about "did I clean that?"
- No system of record for maintenance history
- Difficulty maintaining consistency
- Need for medical audit trail while avoiding nag culture

---

## 3. Core Features

### 3.1 Component Management

**Initial Setup:**
- Setup wizard that walks user through selecting components from pre-configured list
- Standard CPAP component categories:
  - **Mask parts**: cushion/pillows, frame, headgear
  - **Tubing/hose**: air delivery tubes
  - **Water chamber**: humidifier tank
  - **Air filters**: machine intake filter

**Pre-configured Templates:**
- Ship with medical best practice schedules as defaults
- Show recommended maintenance schedules clearly
- Make customization obvious and easy ("Hybrid: defaults with easy customization")
- Include multiple maintenance tiers per component:
  - Example: Mask → daily rinse, weekly deep clean, monthly replacement
  - Example: Water chamber → daily rinse, weekly deep clean, monthly sanitize

**Flexible Tracking Modes (per component):**
- **Calendar-based**: Replace every N days regardless of usage
- **Usage-based**: Replace after N nights of use (requires manual usage logging)
- User configures tracking mode per component during setup

### 3.2 Maintenance Actions

**Action Types per Component:**
- Multiple maintenance tiers with cascading schedules
- Each action type has:
  - Name (e.g., "Daily Rinse", "Deep Clean", "Replace")
  - Description/instructions
  - Schedule (frequency)
  - Notification timing (configurable per action)
  - Reminder escalation behavior

**Action Completion:**
- **Routine cleaning**: One-tap completion (quick, no friction)
- **Replacements/Issues**: Detailed logging option
  - Optional quick notes
  - Timestamp
  - Can record observations ("noticed wear on strap")

**Usage Logging (for usage-based components):**
- Keep it simple - don't overcomplicate
- Manual logging per component when needed
- For components set to usage-based tracking, user can increment usage counter

### 3.3 Scheduling & Overdue Logic

**When Maintenance is Missed:**
- **Show warning but let user decide**: Display overdue status prominently in app
- **User can choose**: Mark as done, skip, or snooze
- Don't accumulate "debt" - avoid guilt-tripping

**Rescheduling After Overdue Completion:**
- Schedule next occurrence from **original due date**, not completion date
- Example: Weekly clean due Monday, completed Wednesday → next due following Monday
- Prevents schedule drift while maintaining consistent intervals

**No Pause Mode:**
- Schedules always run continuously
- Calendar-based items continue regardless
- Usage-based items naturally don't increment if not logging usage

### 3.4 Notifications & Reminders

**Notification Philosophy:**
- **Only notify when action needed** - silent until something is due
- **Progressive reminders** - escalation if ignored

**Notification Timing:**
- **Configurable per maintenance type**
- Examples:
  - Daily cleaning: 8 AM
  - Weekly deep clean: Sunday 9 AM
  - Monthly replacement: 1st of month at 10 AM

**Progressive Reminder Escalation:**
- **Configurable per maintenance type**
- Daily routine tasks: gentle reminders (one per day, quiet)
- Important replacements: more urgent/persistent (multiple per day, increasing prominence)
- Never guilt-trip - focus on helpful nudges

### 3.5 History & Analytics

**Dual Purpose:**
1. **Medical Audit Trail**
   - Timestamped log of all maintenance actions
   - Exportable for insurance/doctor
   - Prove equipment maintenance compliance

2. **Visual Trends & Gamification**
   - Streak statistics (days of consistency)
   - Compliance percentage
   - Charts showing maintenance patterns
   - Positive reinforcement for good habits
   - Celebrate wins without guilt for misses

**Data Retention:**
- Store complete history indefinitely
- Allow filtering by date range, component, action type

---

## 4. User Experience & Interface Design

### 4.1 Home Screen (Primary View)

**Show only what needs action today:**
- Overdue items (red/urgent)
- Due today items (yellow/attention)
- Nothing shown if nothing due (green status message: "All caught up!")

**Quick Action Buttons:**
- Fast access to mark common actions complete
- "Mark Daily Clean" type shortcuts if patterns emerge

**Status Indicators:**
- Simple color coding: Red (overdue), Yellow (due today), Green (upcoming/ok)
- Clear, uncluttered interface

### 4.2 Secondary Views

**Timeline/Calendar View:**
- See upcoming maintenance (next 7-30 days)
- Optional view, not primary

**Component Detail View:**
- Full history for specific component
- All associated maintenance actions
- Edit component settings
- View trends specific to that component

**History/Analytics View:**
- Full audit log
- Charts and trends
- Streak tracking
- Export functionality

### 4.3 Design Principles

**Must Have:**
- ✅ Simple, uncluttered interface - show only what matters
- ✅ Elegant, modern looking UI
- ✅ Streaks and positive reinforcement
- ✅ Fast, friction-free task completion

**Must Avoid:**
- ❌ Nag culture and guilt-tripping
- ❌ Over-engineered features
- ❌ Complexity for complexity's sake
- ❌ Making users feel bad about missed tasks

---

## 5. Technical Requirements

### 5.1 Technology Stack

**Approach:** MVP speed - simple, proven stack

**Frontend:**
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Build Tool**: Vite (fast builds, excellent PWA support)
- **State Management**: React Context API (simple for MVP) or Zustand (if needed)
- **Date/Time**: date-fns (lightweight, tree-shakeable)

**Data & Storage:**
- **Local Database**: IndexedDB (via Dexie.js for easier API)
- **Data Export**: JSON/CSV generation client-side

**PWA Features:**
- **Service Worker**: Vite PWA plugin (workbox under the hood)
- **Caching Strategy**: Cache-first for app shell and static assets
- **Offline Support**: App works offline via cached resources and local data
- **Notifications**: Web Notifications API with permission management

**Hosting & Deployment:**
- **Platform**: Vercel
- **Domain**: Custom domain or Vercel subdomain
- **CI/CD**: Automatic deploys from main branch
- **Environment**: Single production environment for MVP

**Progressive Web App Requirements:**
- Installable on home screen (manifest.json)
- Works offline completely
- Fast load times (<2s initial, <500ms navigations)
- Responsive design (mobile-first, 320px+)

### 5.2 Multi-Device & Sync

**MVP Approach:**
- **Local-only**: All data stored in browser IndexedDB
- **Single-device**: No sync in MVP
- **Online-first with caching**: App works online by default, gracefully handles offline
- **Export/Import**: Manual data transfer via JSON/CSV export if user switches devices

**Post-MVP Sync Strategy:**
- **Phone-primary**, others secondary
- **Real-time sync across devices** (when online)
- **Online-first with offline support** - full functionality without connection via cache
- Local data storage with cloud sync when available
- Background sync when connection available
- Conflict resolution: last-write-wins (simple initially)
- Encrypted cloud sync (user authentication required)
- Authentication: Email/password

### 5.3 Data Model

**Core Entities:**

```
Component {
  id: uuid
  name: string
  category: enum (mask_cushion, mask_frame, tubing, water_chamber, filter, other)
  tracking_mode: enum (calendar, usage, hybrid)
  usage_count: number (nights used)
  is_active: boolean
  created_at: timestamp
  notes: string (optional)
}

MaintenanceAction {
  id: uuid
  component_id: uuid (foreign key)
  action_type: string (e.g., "Daily Rinse", "Deep Clean", "Replace")
  description: string
  schedule_frequency: number (days or uses)
  schedule_unit: enum (days, uses)
  notification_time: time (configurable)
  reminder_strategy: enum (gentle, standard, urgent)
  last_completed: timestamp (nullable)
  next_due: timestamp (calculated)
  instructions: text (optional)
}

MaintenanceLog {
  id: uuid
  component_id: uuid
  action_id: uuid
  completed_at: timestamp
  was_overdue: boolean
  notes: string (optional, for replacements)
  logged_by: enum (user, system)
}

NotificationConfig {
  id: uuid
  action_id: uuid
  enabled: boolean
  time: time
  escalation_strategy: enum (single_daily, multiple_daily, increasing_urgency)
  escalation_intervals: array (e.g., [0, 4, 8] hours)
}
```

### 5.4 Data Privacy & Export

**Privacy:**
- Anonymous by default - no personal identifiers collected
- All data stored locally first
- Optional encrypted cloud sync with user authentication
- No analytics or tracking without explicit consent

**Export Capability:**
- Export to JSON (full data backup)
- Export to CSV (for spreadsheet analysis, medical records)
- Export includes all components, actions, and history
- One-button export from settings

### 5.5 Caching & Offline Support

**Online-First with Offline Fallback:**
- App designed for online use by default
- All data stored locally in IndexedDB (no network needed for MVP)
- Service worker caches app shell and static assets
- App works offline using cached resources
- Local notifications work offline
- Graceful degradation when offline

**Caching Strategy:**
- **App Shell**: Cache-first (HTML, CSS, JS bundles)
- **Static Assets**: Cache-first (fonts, icons, images)
- **Data**: Local IndexedDB (no network calls in MVP)
- **Future (with sync)**: Network-first with cache fallback

---

## 6. Key User Workflows

### 6.1 First-Time Setup
1. Welcome screen explaining app purpose
2. Setup wizard: "What CPAP components do you use?"
   - Show standard categories with checkboxes
   - Brief description of each
3. For each selected component, configure:
   - Tracking mode (calendar vs usage)
   - Review default maintenance schedules
   - Customize if desired (clearly show defaults)
   - Set notification times per action
4. Grant notification permissions
5. Land on home screen (likely empty, nothing due yet)

### 6.2 Daily Routine - Completing Maintenance
1. Receive notification: "Daily mask rinse due"
2. Open app (or tap notification)
3. Home screen shows "Daily mask rinse - Due Now"
4. One-tap complete button
5. Confirmation (subtle, celebratory if on a streak)
6. Next due date calculated and scheduled

### 6.3 Handling Overdue Items
1. Home screen shows "Water chamber weekly clean - 2 days overdue" (red/prominent)
2. User taps item
3. Options presented:
   - "Mark Complete" (quick tap)
   - "Mark Complete + Add Note" (for detailed logging)
   - "Skip This Time" (dismisses without logging)
   - "Snooze" (remind me in X hours)
4. If marked complete:
   - Log recorded with overdue flag
   - Next occurrence scheduled from original due date
   - Brief positive feedback (no guilt)

### 6.4 Replacing a Component
1. Notification: "Mask cushion monthly replacement due"
2. User taps to view
3. "Mark as Replaced" button
4. Prompted for optional details:
   - Date installed (defaults to today)
   - Notes about condition of old component
   - Cost (optional, out of scope for MVP)
5. Confirmed - reset component lifecycle
6. Next replacement scheduled 30 days from original due date

### 6.5 Viewing History & Analytics
1. Navigate to History view from menu
2. See:
   - Current streak (days of full compliance)
   - Overall compliance % (last 30 days)
   - Timeline of all maintenance actions
   - Filterable by component, date, action type
3. Export button available for audit trail

---

## 7. Out of Scope (for MVP)

**Deferred to Post-MVP (Planned):**
- Multi-device sync (cloud-based)
- User authentication and accounts
- Real-time cross-device updates

**Explicitly NOT Included (Even Post-MVP):**
- Supply inventory tracking
- Cost tracking and budgeting
- Reorder reminders with shopping links
- Insurance schedule tracking and claim filing
- Social features or sharing with others
- Machine model-specific deep integration (may reconsider with user demand)

**Future Considerations (Nice-to-Have):**
- Integration with CPAP machine data APIs (ResMed, Philips)
- Auto-detection of usage from machine
- Smart scheduling based on learned patterns
- Advanced analytics and health outcome correlation
- Gamification beyond streaks/compliance % (achievements, challenges)

---

## 8. Success Metrics

**Primary Metric:**
- User maintains consistent habits over 3 months
- Measured by: compliance rate, streak length, self-reported confidence

**Secondary Metrics:**
- Reduction in overdue items over time
- Daily active usage rate
- Time to complete maintenance actions (should decrease as habits form)
- Export usage (indicates value of audit trail)

**Qualitative:**
- User reports reduced decision fatigue
- User feels confident about equipment hygiene
- User continues using app beyond initial 3 months

---

## 9. Future Considerations

**Post-MVP Enhancements:**
- Integration with CPAP machine data APIs (ResMed, Philips)
- Auto-detection of usage nights
- Smart scheduling based on learned patterns
- Supply reorder reminders with insurance tracking
- Community features (optional benchmarking)
- Health outcome correlation (with explicit consent)
- Accessibility improvements (screen reader, voice control)

**Technical Debt to Address Later:**
- More sophisticated conflict resolution for multi-device sync
- Performance optimization for large history datasets (5+ years)
- Advanced analytics and predictive modeling
- Offline-capable progressive reminders

---

## 10. Technical & Design Decisions ✅

**Technical Implementation:**
- ✅ **Frontend Framework**: React
- ✅ **Backend/Sync**: Local-only for MVP (IndexedDB), sync to be added post-MVP
- ✅ **Authentication**: Email/password (when sync is implemented post-MVP)
- ✅ **Hosting**: Vercel (free tier, automatic deploys, excellent PWA support)

**UX Details:**
- ✅ **Design System**: Tailwind CSS + shadcn/ui components
- ✅ **Color Scheme**: Modern best practices with dark mode support
- ✅ **Notification Sound/Vibration**: System defaults (familiar, expected behavior)
- ✅ **Streak Celebrations**: Celebratory modal with stats at milestones (7, 30, 90 days)
- ✅ **Empty State**: Motivational message + next upcoming task preview
  - Example: "Great work! Everything is up to date. Next maintenance: Water chamber clean in 2 days"

**Business/Deployment:**
- ✅ **Distribution Strategy**: Start as web PWA, submit to app stores later if successful
- ✅ **MVP Scope**: Core features only - no auth UI, no sync functionality
- ⏸️ **Monetization**: Deferred - free for MVP, evaluate later based on usage

**Implementation Notes:**
- Focus purely on local-first functionality for MVP
- No auth screens or sync UI in initial version
- All data stored in browser IndexedDB
- Export functionality critical for data portability before sync exists

---

## 11. Acceptance Criteria

**MVP is considered complete when:**

1. ✅ User can complete first-time setup wizard and configure their CPAP components
2. ✅ User can mark maintenance actions as complete (routine and detailed)
3. ✅ App correctly schedules next occurrences based on completion
4. ✅ Notifications fire at configured times for due/overdue items
5. ✅ Progressive reminders escalate appropriately per maintenance type
6. ✅ Home screen shows only actionable items (overdue/due today)
7. ✅ History view shows complete audit trail and streak statistics
8. ✅ App works offline via cached resources and local storage (online-first with offline fallback)
9. ✅ User can export data to JSON/CSV (for backup and device transfer)
10. ✅ User can import data from JSON (for device transfer)
11. ✅ Interface is clean, uncluttered, and elegant
12. ✅ Overdue items warn but don't guilt-trip
13. ✅ Positive reinforcement for streaks and good habits (modal celebrations at milestones)
14. ✅ Fast, friction-free task completion (one-tap for routine actions)
15. ✅ Dark mode support with system preference detection
16. ✅ PWA installable on home screen (iOS and Android)
17. ✅ Empty state shows motivational message with next upcoming task

---

## 12. Development Phases

### Phase 1: MVP (Local-Only PWA)
**Goal**: Fully functional maintenance tracker for single-device use

**Overall Timeline**: MVP focus - build for speed and learning

**Success Gate**: 2-3 users (including yourself) using daily for 2 weeks with positive feedback

---

#### Phase 1.1: Foundation & Infrastructure ✅
**Goal**: Get the project scaffolded with core infrastructure

**Tasks:**
- [x] Initialize React + TypeScript + Vite project
- [x] Configure Tailwind CSS
- [x] Install and configure shadcn/ui
- [x] Set up IndexedDB with Dexie.js
- [x] Create data models (Component, MaintenanceAction, MaintenanceLog, NotificationConfig)
- [x] Set up routing (React Router)
- [x] Configure Vite PWA plugin
- [x] Create basic app shell and layout structure
- [x] Set up dark mode with system preference detection
- [x] Deploy basic "Hello World" to Vercel

**Deliverable**: Empty app with routing, storage layer, and dark mode

**Estimated effort**: 1-2 days

---

#### Phase 1.2: Design System & Core Components ✅
**Goal**: Build reusable UI components and establish visual design

**Tasks:**
- [x] Define color palette (light + dark themes)
- [x] Configure Tailwind theme (colors, typography, spacing)
- [x] Create base UI components (Button, Card, Badge, Input, Select, etc.)
- [x] Build layout components (Header, Navigation, Container)
- [x] Create status indicator components (Red/Yellow/Green states)
- [x] Design and build empty state component
- [x] Create loading states and skeletons
- [x] Test all components in isolation

**Deliverable**: Complete design system and component library

**Estimated effort**: 2-3 days

---

#### Phase 1.3: Data Layer & State Management ✅
**Goal**: Implement all database operations and state management

**Tasks:**
- [x] Implement Dexie.js schema for all entities
- [x] Create CRUD operations for Components
- [x] Create CRUD operations for MaintenanceActions
- [x] Create CRUD operations for MaintenanceLogs
- [x] Create CRUD operations for NotificationConfig
- [x] Set up React Context or Zustand for global state
- [x] Implement data seeding for component templates
- [x] Write helper functions for date calculations
- [x] Implement scheduling logic (next due date calculation)
- [x] Test all database operations

**Deliverable**: Complete data layer with working CRUD operations

**Estimated effort**: 2-3 days

---

#### Phase 1.4: Setup Wizard & Onboarding ✅
**Goal**: First-time user experience for selecting and configuring components

**Tasks:**
- [x] Create welcome screen with app explanation
- [x] Build component category selection screen (checkboxes for mask, tubing, etc.)
- [x] Create component configuration screen (tracking mode, schedules)
- [x] Show default schedules with customization options
- [x] Build notification time configuration interface
- [x] Request notification permissions
- [x] Save selected components and actions to database
- [x] Create onboarding progress indicator
- [x] Handle skip/back navigation
- [x] Redirect to home screen after completion

**Deliverable**: Complete setup wizard that configures user's CPAP components

**Estimated effort**: 3-4 days

---

#### Phase 1.5: Home Screen & Action Dashboard ✅
**Goal**: Core interface showing what needs action today

**Tasks:**
- [x] Build home screen layout
- [x] Implement "what's due today" query logic
- [x] Create maintenance action card component (shows item, status, due date)
- [x] Display overdue items (red) prominently
- [x] Display due-today items (yellow)
- [x] Show empty state when nothing due ("All caught up!" + next upcoming)
- [x] Implement one-tap quick complete button
- [x] Add visual feedback on completion
- [x] Show brief celebration for streaks
- [x] Auto-refresh view after completion

**Deliverable**: Functional home screen with actionable items

**Estimated effort**: 2-3 days

---

#### Phase 1.6: Maintenance Action Completion Flow ✅
**Goal**: Complete maintenance actions with appropriate detail level

**Tasks:**
- [x] Build quick completion modal (one tap for routine tasks)
- [x] Build detailed completion modal (for replacements)
  - Optional notes textarea
  - Date picker (defaults to today)
  - Condition observations
- [x] Implement "Mark Complete" logic
- [x] Implement "Skip This Time" logic
- [x] Implement "Snooze" logic (remind in X hours)
- [x] Calculate and save next due date (from original due date)
- [x] Log completion to MaintenanceLog
- [x] Update component last_completed timestamp
- [x] Show success feedback
- [x] Handle overdue flag in logs

**Deliverable**: Complete maintenance action completion flow

**Estimated effort**: 2-3 days

---

#### Phase 1.7: Component Management ✅
**Goal**: View, edit, and manage existing components

**Tasks:**
- [x] Build component list view (all components)
- [x] Create component detail page
- [x] Show all maintenance actions for a component
- [x] Display component history timeline
- [x] Build edit component screen
  - Edit name, tracking mode
  - Edit maintenance action schedules
  - Edit notification times
  - Delete component (with confirmation)
- [x] Add new component flow
- [x] Add new maintenance action to existing component
- [x] Handle active/inactive toggle for components

**Deliverable**: Full component CRUD interface

**Estimated effort**: 2-3 days

---

#### Phase 1.8: Notifications System ✅
**Goal**: Browser notifications for due/overdue maintenance

**Tasks:**
- [x] Implement Web Notifications API wrapper
- [x] Create notification permission request flow
- [x] Build notification scheduling service
  - Check due items on app open
  - Schedule notifications at configured times
  - Handle progressive escalation per maintenance type
- [x] Implement notification click handling (deep link to action)
- [x] Create notification preferences screen
- [x] Test notifications on mobile (iOS Safari, Android Chrome)
- [x] Handle notification permission denied state
- [x] Implement "snooze" functionality
- [x] Add notification badge count (if supported)

**Deliverable**: Working notification system with progressive reminders

**Estimated effort**: 3-4 days

**Note**: Browser notifications have limitations - may need background sync or service worker tricks

---

#### Phase 1.9: History & Analytics
**Goal**: View maintenance history and track streaks/compliance

**Tasks:**
- [ ] Build history timeline view (all logged actions)
- [ ] Implement filtering (by component, date range, action type)
- [ ] Calculate current streak (days of full compliance)
- [ ] Calculate compliance % (last 30 days)
- [ ] Build charts for trends
  - Completion rate over time
  - Actions per component
- [ ] Create streak milestone celebration modal
  - Show at 7, 30, 90 day milestones
  - Display stats and encouraging message
  - Confetti or visual celebration
- [ ] Show overdue history (what was late)
- [ ] Display component-specific analytics on detail page

**Deliverable**: Complete history view with analytics and gamification

**Estimated effort**: 3-4 days

---

#### Phase 1.10: Export & Import
**Goal**: Data portability for backup and device transfer

**Tasks:**
- [ ] Implement JSON export (all data)
- [ ] Implement CSV export (maintenance log for medical records)
- [ ] Build export UI in settings
  - Export button with format selection
  - Download file to device
- [ ] Implement JSON import
  - File picker
  - Data validation
  - Merge or replace options
  - Preview import before applying
- [ ] Handle import errors gracefully
- [ ] Create settings page for export/import

**Deliverable**: Working export/import functionality

**Estimated effort**: 1-2 days

---

#### Phase 1.11: PWA Features & Offline Support
**Goal**: Make app installable with online-first caching

**Tasks:**
- [ ] Configure manifest.json (name, icons, theme colors, start_url)
- [ ] Generate app icons (multiple sizes for iOS/Android)
- [ ] Configure service worker with Vite PWA plugin
  - Cache-first strategy for app shell (HTML, CSS, JS)
  - Cache-first strategy for static assets (fonts, icons, images)
  - Precache critical resources
  - Runtime caching for navigations
- [ ] Test offline functionality (airplane mode)
  - App shell loads from cache
  - All features work (data is local)
  - Notifications still function
- [ ] Implement install prompt (iOS: share menu, Android: banner)
- [ ] Add "Install App" button in settings
- [ ] Test PWA installation on iOS Safari and Android Chrome
- [ ] Verify app updates properly when new version deployed

**Deliverable**: Installable PWA with online-first caching that works offline

**Estimated effort**: 2-3 days

---

#### Phase 1.12: Polish, Testing & Bug Fixes
**Goal**: Refine UX, fix bugs, optimize performance

**Tasks:**
- [ ] End-to-end user testing (complete full flow)
- [ ] Fix any blocking bugs
- [ ] Polish animations and transitions
- [ ] Optimize performance (lazy loading, code splitting)
- [ ] Improve loading states
- [ ] Test edge cases:
  - Large number of components
  - Years of history data
  - Timezone changes
  - Browser storage limits
- [ ] Add error boundaries and error handling
- [ ] Improve accessibility (keyboard navigation, ARIA labels)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing (various screen sizes)
- [ ] Write README with setup instructions

**Deliverable**: Production-ready MVP

**Estimated effort**: 3-5 days

---

#### Phase 1.13: Launch Preparation
**Goal**: Get ready for first users

**Tasks:**
- [ ] Create simple landing page (optional, can be just the app)
- [ ] Set up production Vercel deployment
- [ ] Configure custom domain (if desired)
- [ ] Test full flow on production environment
- [ ] Prepare user onboarding instructions
- [ ] Set up basic error monitoring (Sentry or similar - optional)
- [ ] Create backup/restore documentation
- [ ] Invite 2-3 beta users
- [ ] Set up feedback collection mechanism

**Deliverable**: Deployed MVP with first users

**Estimated effort**: 1-2 days

---

**Total Phase 1 Estimated Effort**: 25-35 days of focused development

**Critical Path**: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.8 → 1.11 → 1.12 → 1.13

**Can be done in parallel**: 1.7, 1.9, 1.10 (after 1.6 is complete)

### Phase 2: Cloud Sync & Multi-Device
**Goal**: Enable seamless experience across devices

**Features:**
- User authentication (email/password)
- Encrypted cloud storage
- Real-time sync across devices
- Conflict resolution
- Account management
- Backend infrastructure

**Prerequisites**: MVP validation, user demand for multi-device

**Timeline**: After MVP proves valuable

### Phase 3: Enhanced Features
**Goal**: Improve engagement and utility based on user feedback

**Potential Features:**
- Smart scheduling (pattern learning)
- Enhanced analytics and insights
- Component lifespan optimization
- Accessibility improvements
- App store distribution (iOS, Android)
- Social proof/testimonials for landing page

**Prerequisites**: Active user base, clear feature demand

### Phase 4+: Future Expansion
**Goal**: Ecosystem integration and advanced features

**Potential Features:**
- CPAP machine data integration
- Supply management (if user demand emerges)
- Community features (opt-in)
- Health outcome correlation
- Advanced gamification

**Prerequisites**: Strong product-market fit, resources for integration work

---

## Appendix: Component Templates

### Default CPAP Component Configurations

**Mask Cushion/Pillows:**
- Daily Rinse (calendar, every 1 day, 8:00 AM, gentle reminder)
- Weekly Deep Clean (calendar, every 7 days, Sunday 9:00 AM, standard reminder)
- Monthly Replacement (calendar, every 30 days, 1st of month 10:00 AM, urgent reminder)

**Mask Frame/Headgear:**
- Weekly Clean (calendar, every 7 days, Sunday 9:00 AM, standard reminder)
- Quarterly Replacement (calendar, every 90 days, urgent reminder)

**Tubing/Hose:**
- Weekly Rinse (calendar, every 7 days, Sunday 9:00 AM, standard reminder)
- Monthly Replacement (calendar, every 30 days, urgent reminder)

**Water Chamber:**
- Daily Rinse (calendar, every 1 day, 8:00 AM, gentle reminder)
- Weekly Deep Clean with Vinegar (calendar, every 7 days, Sunday 9:00 AM, standard reminder)
- Monthly Sanitize (calendar, every 30 days, standard reminder)
- 6-Month Replacement (calendar, every 180 days, urgent reminder)

**Air Filter (Disposable):**
- Monthly Replacement (calendar, every 30 days, urgent reminder)

**Air Filter (Reusable):**
- Weekly Rinse (calendar, every 7 days, Sunday 9:00 AM, standard reminder)
- Monthly Deep Clean (calendar, every 30 days, standard reminder)
- 6-Month Replacement (calendar, every 180 days, urgent reminder)

---

*This specification represents the complete product vision based on user interviews conducted on January 3, 2026. All decisions reflect stated user preferences and priorities for MVP development. Updated with final technical and design decisions on January 3, 2026.*
