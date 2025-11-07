# SUPREMO TRADERS LLP Team Communication Platform

## Overview
This project is an internal, real-time communication platform for SUPREMO TRADERS LLP. It features direct messaging, group chats, file attachments, and role-based access. Beyond core chat functionalities, it integrates a meeting calendar with AI summarization, video conferencing, comprehensive task management, project tracking dashboard, and user profile management. The platform aims to be an efficient and professional communication tool, enhancing team collaboration and productivity with a focus on data preservation and integrity across all updates.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, Radix UI (shadcn/ui), Tailwind CSS, TanStack React Query, WebSocket client.
- **Design**: Component-based, custom design system using Inter font, three-column desktop layout, mobile-responsive with sheet-based navigation.

### Backend
- **Technology Stack**: Node.js with TypeScript, Express.js, WebSocket Server (ws), Drizzle ORM, JWT authentication.
- **API Structure**: RESTful endpoints, WebSocket for real-time communication, token-based authentication.

### Data Storage
- **Database**: PostgreSQL via Neon serverless HTTP driver, managed with Drizzle ORM.
- **Schema**: Includes tables for users, conversations, messages, meetings (with AI summaries), tasks, projects (with tracking details), and associated entities.
- **Data Preservation**: All existing data (tasks, messages, meetings, conversations, user data, file attachments, projects) must be preserved across updates. Schema changes must be backward compatible and non-destructive.

### Authentication & Authorization
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, case-insensitive login IDs.
- **Role-Based Access Control**: `admin` and `user` roles with distinct access privileges.
- **Security**: Environment variables for secrets, password validation, auth/admin middleware, auto-healing admin password system.

### Core Features
- **Cross-Device Compatibility**: Seamless operation across devices and browsers with automatic WebSocket reconnection and mobile optimization.
- **Real-Time Features**: Presence tracking, enhanced desktop notifications with audio alerts.
- **Group Conversations**: Naming, member management, and optional message history access.
- **File & Image Sharing**: Enhanced media display, clickable previews, and one-click downloads for various file types.
- **Admin Tools**: User deletion, real-time user list updates, and task oversight.
- **Meeting Calendar**: Full monthly grid view, one-click "Start Meeting Now", "Schedule Meeting" with custom dates, recurring meetings (daily, weekly, monthly), auto-generated Daily.co links, meeting reminders, and IST time management.
- **AI Meeting Summaries**: GPT-4o generates structured, multi-language summaries.
- **Instant Video/Audio Calling**: One-click calling from chat header using Daily.co, direct join (no lobby), user names displayed, and robust incoming/outgoing call notifications. Incoming calls show loud dual-tone ringtone, visual modal, and desktop notifications. Outgoing calls play loud single-tone ringtone that stops when answered/rejected. Calls open in new windows to maintain chat access.
- **Task Management**: Start/target dates, status tracking with completion percentage, visual progress bars, status update reasons, task assignment, real-time WebSocket updates, customizable automated reminders, and admin-only Excel import/export functionality with comprehensive error handling.
- **Professional UI Design**: Clean, responsive interface with ICICI Bank-inspired banking aesthetic featuring orange/coral primary colors (#C54E1F) and warm beige backgrounds (#F5F0E8). NO gradients, NO emojis policy enforced. All color pairings meet WCAG AA accessibility standards (4.5:1 contrast minimum).
- **Quick Join Meetings**: "Quick Join" section in chat sidebar displays upcoming meetings for one-click access.
- **Smart Chat Scrolling**: Intelligent auto-scroll system for uninterrupted chat history reading.
- **Pin Chat Feature**: Users can pin up to 3 conversations.
- **Password Management**: Self-service password change.
- **User Profile & Settings**: View profile information and manage app preferences (dark mode, notifications, sound alerts).
- **Daily Work Log**: Comprehensive daily planning and activity tracking system for all users with private to-do lists, priority levels, customizable working hours, hourly activity logging, auto-save, and admin team view (excluding private to-dos).
- **Project Tracker Dashboard**: Full project lifecycle management with auto-generated IDs (PRJ-XXXXXX), detailed tracking of status, progress percentage, responsible persons, support teams, issues/risks, dependencies, next steps, target dates, and remarks. Features color-coded status indicators (green/yellow/red based on progress), priority levels, duration calculation, and comprehensive CRUD operations with real-time updates.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **OpenAI via Replit AI Integrations**: GPT-4o for AI meeting summarization.
-   **Daily.co**: Video conferencing platform for team meetings and instant audio/video calls.
-   **Google Fonts**: Inter font family.
-   **File Storage**: Local filesystem (`uploads/` directory).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`, `xlsx`.

## Recent Changes

### November 6, 2025 - Critical Bug Fixes
1. **Fixed API Parameter Order Bug**: Corrected `apiRequest()` calls throughout the frontend from `(url, method, data)` to proper `(method, url, data)` signature in Projects and Supremo Drive components. This resolved silent failures where create/update/delete mutations were not reaching the server.

2. **Fixed TaskReminderService Database Error**: Replaced malformed SQL array literal usage `sql\`${conversations.id} = ANY(${sharedConvIds})\`` with proper Drizzle ORM `inArray(conversations.id, sharedConvIds)` in task-reminders.ts. This eliminated server crashes caused by "malformed array literal" PostgreSQL errors.

3. **Added broadcastUpdate Function**: Implemented missing `broadcastUpdate()` WebSocket broadcast function in server/routes.ts to enable real-time project and drive updates across all connected clients. This fixed ReferenceError crashes that prevented project and folder creation. Wired broadcasts to all CRUD operations for projects and drive (folders/files).

4. **Fixed File Upload Authentication Bug**: Corrected authentication token key from `localStorage.getItem('token')` to `localStorage.getItem('auth_token')` in SupremoDrive.tsx. Also fixed backend `/api/drive/upload` route to use `req.userId` instead of `req.user!.id` and added broadcast support. This resolved 401 authentication errors that prevented file uploads.

5. **Fixed Incoming Call Notification Bug**: Replaced incorrect `JSON.parse(conversation.memberIds)` calls with proper `storage.getConversationMembers(conversationId)` in all three WebSocket call handlers (incoming_call, call_answered, call_rejected) in server/routes.ts. The `memberIds` column doesn't exist in the conversations table - members are stored in the conversation_members join table. This fix eliminated "undefined is not valid JSON" server crashes and enables incoming call notifications to be properly broadcast to all conversation participants.

6. **Video Calls Start with Camera Off**: Modified video call initiation in ChatLayout.tsx to add `&video=false` parameter to Daily.co room URL. Video calls now start with camera disabled by default, allowing users to enable video manually if needed. This provides better privacy and follows user expectations for video call behavior.

### November 6, 2025 - Access Control Implementation
7. **Project Edit Access Control**: Implemented permission checks where only admin users or the assigned responsible person can edit or delete projects. Backend routes (PUT/DELETE `/api/projects/:id`) now validate that `req.user.role === 'admin' OR project.responsiblePersonId === req.userId` before allowing modifications. Frontend Projects component hides edit/delete buttons for unauthorized users. All users can still view all projects (read-only for non-authorized users).

8. **Supremo Drive Private Folders**: Implemented complete privacy for Supremo Drive folders and files. Users now only see their own folders and files. Storage layer methods (`getAllDriveFolders`, `getDriveFilesByFolder`) filter results by `createdById` and `uploadedById`. Individual operations (folder delete, file download, file delete) all validate ownership before allowing access. This prevents ID enumeration attacks and ensures complete data privacy between users.

9. **Security Hardening**: Added comprehensive ownership validation to all Supremo Drive endpoints to prevent unauthorized access via direct ID manipulation. Removed duplicate drive routes and consolidated all drive operations into a single, secure implementation with proper authentication and authorization checks throughout.

### November 6, 2025 - Banking-Inspired Theme Implementation
10. **Complete Theme Redesign to ICICI Bank Aesthetic**: Replaced professional blue color scheme with banking-inspired orange/coral and warm beige palette. Primary color changed to #C54E1F (orange/coral), backgrounds to #F5F0E8 (warm beige). Updated all semantic tokens in both light and dark modes. Enforced NO gradients and NO emojis policies.

11. **WCAG AA Accessibility Compliance**: Achieved full WCAG AA compliance for all color pairings across both light and dark modes. All semantic tokens now meet or exceed 4.5:1 contrast ratio requirements:
   - Light mode: Primary, secondary, sidebar, accent, muted, and destructive tokens all compliant
   - Dark mode: Primary, secondary, sidebar, sidebar-primary, accent, muted, and destructive tokens all compliant
   - Documented contrast ratios: light muted ≈5.0:1, dark sidebar primary ≈5.9:1, primary ≈4.9:1, destructive ≈5.8:1, dark muted ≈4.72:1

12. **Updated Design Guidelines**: Completely revised design_guidelines.md to reflect new banking-inspired aesthetic. Removed all blue color references, documented orange/beige color palette, specified no gradients or emojis policy, and added accessibility compliance documentation.

All core features (Project Tracker, Supremo Drive, and Incoming Call Notifications) are now fully operational with real-time WebSocket updates, proper authentication, comprehensive access control, and a production-ready WCAG AA compliant banking-inspired theme.

### November 7, 2025 - Add Team Members to Live Calls Feature
13. **Active Call Management Infrastructure**: Implemented complete backend infrastructure to track active calls and enable adding team members to ongoing calls. Created `active_calls` and `active_call_participants` database tables to track call metadata (room name, URL, host, conversation, type, status) and participant join/leave timestamps. All video/audio call initiation functions now automatically register calls in the database when started.

14. **Call Invitation API**: Added comprehensive REST API endpoints for call management: POST `/api/calls` (create call), GET `/api/calls/:id` (get call details), POST `/api/calls/:id/invite` (invite users to call), POST `/api/calls/:id/join` (mark user joined), POST `/api/calls/:id/leave` (mark user left), DELETE `/api/calls/:id/end` (end call). Invite endpoint automatically sends `call_invitation` WebSocket events to invited users with room URL and caller information.

15. **Storage Methods**: Implemented 10 new storage interface methods: `createActiveCall`, `getActiveCallById`, `getActiveCallByRoomName`, `endActiveCall`, `addCallParticipant`, `removeCallParticipant`, `getCallParticipants`, `getActiveCallsByConversation`, `getActiveCallsByUserId`, and `getUserActiveConversations`. These methods provide complete CRUD operations for managing calls and participants with proper error handling and validation.

16. **Frontend Integration**: Updated all three call initiation functions (`handleStartCall`, `handleQuickAudioCall`, `handleStartAudioCall`) in ChatLayout.tsx to automatically register calls in the database immediately after creating the Daily.co room. This ensures all calls are tracked with proper metadata for subsequent invitation and participant management operations.