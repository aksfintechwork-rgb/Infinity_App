# SUPREMO TRADERS LLP - Team Communication Platform
## Complete Feature Documentation

**Project Type:** Internal Team Communication & Collaboration Platform  
**Technology Stack:** React + TypeScript, Node.js, Express, PostgreSQL, WebSocket, Daily.co, OpenAI  
**Design Philosophy:** Banking-inspired ICICI aesthetic, NO gradients, NO emojis, WCAG AA compliance

---

## Feature Overview Table

| NAME | OBJECTIVE | CORE_FEATURE | DATA_ENTITIES | WORKFLOW | ETC | DEADLINE | STATUS |
|------|-----------|--------------|---------------|----------|-----|----------|--------|
| User Authentication & Authorization | Secure user login and role-based access control | JWT-based authentication (7-day expiration), bcrypt password hashing, case-insensitive login IDs | users (id, username, password, name, email, role, avatar, lastSeen, bio, phone, department) | User enters credentials → System validates → JWT token issued → Token stored in localStorage → Authenticated requests include token | Supports admin and user roles. Password reset by admins. Self-service password change. | Completed | Live |
| Real-time Chat Messaging | Enable instant communication between team members | Direct messages, group chats, message replies, sender-only deletion, automatic URL detection with clickable links | conversations (id, name, type, avatar, description), conversationMembers (conversationId, userId, joinedAt, role, canViewHistory, isPinned), messages (id, conversationId, senderId, body, attachmentUrl, replyToId, createdAt) | User selects conversation → Types message → WebSocket broadcasts to all members → Database stores message → Recipients receive instantly with toast notifications | Chat auto-scrolls to latest messages. Presence tracking. Enhanced desktop notifications. Message pagination (50 default). Ultra-fast performance via database indexing and React Query caching (5min staleTime). | Completed | Live |
| File Sharing | Share files within conversations | Upload and share Excel, images, video, audio files (up to 50MB) | messages (attachmentUrl), files metadata stored in message records | User clicks attach → Selects file → Uploads via multipart/form-data → Server stores in uploads/ directory → File URL saved in message → Shared with conversation | Supported formats: .xlsx, .xls, .jpg, .jpeg, .png, .gif, .mp4, .webm, .mp3, .wav, .pdf. 50MB size limit. | Completed | Live |
| Video Conferencing | Face-to-face virtual meetings | One-click audio/video calls using Daily.co, instant meeting creation, shareable links, camera off by default (privacy-first) | activeCalls (id, conversationId, roomName, roomUrl, callType, initiatorId, participants, startedAt), meetings integration | User clicks call button → System creates Daily.co room → Opens popup window → Other members receive WebSocket notification → Click to join → Meeting starts | Camera disabled by default (privacy). Popup blocker prevention. Active call participant tracking. Web Push Notifications with sound/vibration. Background tab awareness. | Completed | Live |
| Meeting Management | Schedule and manage team meetings | Meeting calendar, recurring meetings, auto-generated Daily.co links, automated reminders, one-click "Start Meeting Now" | meetings (id, title, description, startTime, endTime, meetingUrl, recurrence, createdById, aiSummary, summaryLanguage), meetingParticipants (meetingId, userId, status, joinedAt) | User creates meeting → Adds participants → Sets date/time → System generates Daily.co link → Sends reminders from Admin account → Meeting starts → Participants join → AI generates summary post-meeting | Quick Join feature. Shareable links for external guests. Supports recurring meetings (daily, weekly, monthly). | Completed | Live |
| AI Meeting Summarization | Automatic meeting notes and summaries | GPT-4o powered multi-language AI summaries | meetings (aiSummary, summaryLanguage), uses OpenAI integration | Meeting ends → Admin triggers summarization → System sends meeting details to GPT-4o → AI generates structured summary → Saved to database → Displayed in meeting details | Structured format with key points, decisions, action items. Multi-language support. Admin-only trigger. | Completed | Live |
| Task Management | Track team tasks and assignments | Task creation, assignment, start/target dates, status tracking, progress bars, automated reminders, Excel import/export | tasks (id, title, description, status, priority, assignedToId, startDate, targetDate, progress, createdById, createdAt, updatedAt) | Admin/user creates task → Assigns to team member → Sets dates → System tracks progress → Sends reminders from Admin account → Updates status → Real-time sync via WebSocket | Admin-only Excel import/export. Status options: not_started, in_progress, completed, on_hold. Priority levels: low, medium, high, urgent. | Completed | Live |
| Project Tracking Dashboard | Manage project lifecycle | Full project management with auto-generated IDs, detailed tracking, color-coded indicators, CRUD operations | projects (id, projectId, name, responsiblePerson, issues, dependencies, status, progress, targetDate, createdAt, updatedAt) | User creates project → System assigns auto-generated ID → Sets responsible person, issues, dependencies → Tracks status and progress → Color-coded visual indicators → Real-time updates | Auto-generated project IDs (e.g., PROJ-001). Status options: planning, active, on_hold, completed, cancelled. Progress: 0-100%. Real-time WebSocket updates. | Completed | Live |
| Performance Dashboard | Analytics and team insights | Admin-only analytics with comprehensive visualizations, period-based filtering | Uses existing tasks, projects, users data. No separate entities. | Admin accesses dashboard → Selects time period (week/month/quarter/year) → System aggregates data → Displays: overall stats cards, task completion trends, user performance bars, task distribution pie charts, detailed user statistics table, project performance tracking | Charts use banking theme colors. Empty state handling. Filters: week, month, quarter, year. Metrics: total tasks, completion rate, active projects, team size. | Completed | Live |
| Daily Work Log | Track daily team activities | Personal daily work logging for all users | workLogs (id, userId, date, description, createdAt, updatedAt) | User accesses work log → Selects date → Enters activities/notes → Saves entry → Can view/edit past logs → Managers can view team logs | Personal tracking tool. Editable entries. Date-based organization. | Completed | Live |
| To-Do List (Personal) | Individual task management | Standalone private to-do list with priority levels, completion tracking, automated reminders | todos (id, userId, title, description, priority, completed, dueDate, createdAt, updatedAt) | User creates todo → Sets priority and due date → System sends reminders from Admin account → User marks complete → Tracks completion status | Priority levels: low, medium, high, urgent. Private to each user. Automated reminder system. | Completed | Live |
| User Management | Admin tools for team management | User creation, deletion, task oversight, password reset, role management | users (id, username, password, name, email, role, avatar, lastSeen, bio, phone, department) | Admin accesses user management → Creates/edits/deletes users → Assigns roles (admin/user) → Resets passwords → Promotes/demotes users → Views user tasks | Safeguards: prevents self-demotion, prevents demoting last admin. Admin can oversee all user tasks. Profile management for all users. | Completed | Live |
| Supremo Drive | File storage with Google Drive sync | Local file storage with optional Google Drive sync, folder organization, ownership validation | files (id, name, mimeType, size, url, uploadedById, folderId, googleDriveId, syncStatus, errorMessage, createdAt, updatedAt), folders (id, name, parentId, createdById, createdAt, updatedAt) | User uploads file → Stored in local uploads/ directory → Optional: User syncs to Google Drive → System tracks sync status (not_synced, queued, in_progress, synced, error) → Can import from Google Drive → Folder-based organization | Sync preserves existing Google Drive IDs for re-sync. Folder-level authorization. Ownership validation. Google Drive integration via Replit connector with automatic OAuth. | Completed | Live |
| Push Notifications | Real-time alerts for messages and calls | Web Push Notifications with sound/vibration for messages and calls, works when app closed or in background | pushSubscriptions (id, userId, endpoint, p256dh, auth, createdAt) | User grants notification permission → Browser registers service worker → System stores subscription → Events trigger (new message/call) → Background tab awareness checks visibility → Sends push only to offline/hidden tabs → User receives notification with sound/vibration | Smart routing: notifications sent only when user has no visible tabs. Uses Page Visibility API. Supports both incoming calls and new messages. | Completed | Live |
| Conversation Read Status | Track unread messages | Mark conversations as read, unread count tracking | conversationReadStatus (userId, conversationId, lastReadMessageId, unreadCount, updatedAt) | User opens conversation → System marks as read → Updates lastReadMessageId → Calculates unread count → Displays unread badge → Real-time sync across devices | History visibility control based on member join date. Unread count indicators. Real-time updates. | Completed | Live |
| Presence Tracking | Show online/offline status | Real-time user presence and last seen timestamps | users (lastSeen), WebSocket connection tracking | User connects → WebSocket establishes → System updates lastSeen on activity → Broadcasts presence to others → User disconnects → Final lastSeen update → Others see offline status | Updates on any WebSocket activity. Tab visibility awareness. Connection heartbeat via ping/pong. | Completed | Live |

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** TanStack React Query v5 (5min staleTime, 10min gcTime)
- **UI Components:** Radix UI (shadcn/ui) with Tailwind CSS
- **Routing:** Wouter
- **Real-time:** WebSocket client with automatic reconnection
- **Animations:** Framer Motion, custom CSS transitions

### Backend Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Real-time:** WebSocket Server (ws library)
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM with 25+ database indexes
- **Authentication:** JWT (7-day expiration) + bcrypt
- **File Storage:** Local filesystem (uploads/) + Google Drive sync

### External Integrations
- **Video:** Daily.co for video conferencing
- **AI:** OpenAI GPT-4o via Replit AI Integrations
- **Cloud Storage:** Google Drive via Replit connector (OAuth managed)
- **Database:** Neon PostgreSQL serverless
- **Push:** Web Push API with VAPID keys

### Performance Optimizations
- **Database:** 25+ indexes on all foreign keys across 15+ tables
- **Caching:** React Query (5min staleTime, 10min gcTime)
- **Pagination:** Message pagination (50-message default limit)
- **Component Optimization:** React.memo on ConversationItem
- **Real-time:** WebSocket for instant updates (no polling)

---

## Database Schema Summary

**Total Tables:** 15+

Key Entities:
- `users` - User accounts and profiles
- `conversations` - Chat conversations (direct/group)
- `conversationMembers` - Conversation participants
- `messages` - Chat messages with replies
- `conversationReadStatus` - Unread tracking
- `meetings` - Meeting schedule with AI summaries
- `meetingParticipants` - Meeting attendees
- `tasks` - Team task management
- `projects` - Project tracking
- `workLogs` - Daily work logs
- `todos` - Personal to-do lists
- `activeCalls` - Live video calls
- `files` - Supremo Drive files
- `folders` - Supremo Drive folders
- `pushSubscriptions` - Push notification subscriptions

---

## Security Features

1. **Authentication:** JWT tokens (7-day expiration), bcrypt hashing
2. **Authorization:** Role-based access control (admin/user)
3. **Input Validation:** Zod schemas for all API requests
4. **SQL Injection Protection:** Drizzle ORM parameterized queries
5. **File Upload Security:** Type validation, size limits (50MB)
6. **Ownership Validation:** File and folder access controls
7. **Session Management:** JWT in localStorage with automatic refresh
8. **Password Security:** bcrypt with salt rounds

---

## Design System

**Theme:** ICICI Bank-inspired banking aesthetic

**Colors:**
- Primary: Orange/Coral (#C54E1F)
- Background: Warm Beige (#F5F0E8)
- Professional, minimal, accessible (WCAG AA)

**Rules:**
- ❌ NO gradients
- ❌ NO emojis (strictly enforced)
- ✅ Clean, professional interfaces
- ✅ Accessibility compliant
- ✅ Glassmorphism effects (backdrop blur)
- ✅ Smooth transitions (Button 0.15s, Input 0.3s)

**Layout:**
- Three-column desktop layout
- Mobile-responsive with sheet-based navigation
- Sticky headers with high z-index
- Component-based architecture

---

## Data Preservation Policy

⚠️ **CRITICAL: PRODUCTION SYSTEM**

This platform is in PRODUCTION with active users and data. See `DEVELOPMENT_LOCK.md` for complete guidelines.

**Mandatory Rules:**
- ❌ NEVER delete database tables or columns
- ❌ NEVER change existing API endpoints in breaking ways
- ❌ NEVER modify file storage paths or Google Drive sync metadata
- ✅ All schema changes must be backward compatible (additive only)
- ✅ Test all changes on staging database clone first
- ✅ Maintain rollback capability for every deployment

---

## Deployment Information

**Environment:** Replit
**Database:** Neon PostgreSQL (serverless)
**Workflow:** `npm run dev` (Express + Vite)
**Port:** 5000 (frontend bound to 0.0.0.0:5000)

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Authentication token secret
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - Push notifications
- Google Drive OAuth managed by Replit connector

---

## Current Status

**Overall Status:** ✅ LIVE IN PRODUCTION

**Database:** Fresh Neon PostgreSQL instance
- Default admin user: username "admin", password "admin123"

**Recent Updates:**
- Fixed real-time chat WebSocket bug (messages now appear instantly)
- Removed all emojis from platform and push notifications
- Added glassmorphism CSS utilities for modern banking UI
- Implemented smooth transitions across all components
- Created PageLoader component for page navigation feedback

**Known Limitations:**
- Admin meeting controls (mute/unmute participants) not implemented - requires complex Daily.co API integration
- Video calls use popup windows for compatibility

---

## Future Enhancement Opportunities

1. **Advanced Daily.co Integration** - Admin controls for muting/unmuting participants
2. **Email Notifications** - Complement push notifications with email
3. **Mobile Apps** - Native iOS/Android applications
4. **Advanced Analytics** - More detailed performance metrics and reporting
5. **File Version Control** - Track file versions in Supremo Drive
6. **Message Editing** - Allow users to edit sent messages
7. **Message Search** - Full-text search across conversations
8. **Voice Messages** - Record and send audio messages in chat
9. **Screen Sharing** - Share screen during video calls
10. **Calendar Integration** - Sync with Google Calendar/Outlook

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained By:** Development Team
