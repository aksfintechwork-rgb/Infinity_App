# SUPREMO TRADERS LLP Team Communication Platform

## Overview
This project is an internal, real-time communication platform designed to enhance collaboration and productivity for SUPREMO TRADERS LLP. It provides core communication features such as direct messaging, group chats, and file sharing, complemented by advanced tools like a meeting calendar with AI summarization, robust video conferencing, comprehensive task management, and a project tracking dashboard. The platform prioritizes data preservation and integrity across all updates.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, Radix UI (shadcn/ui), Tailwind CSS, TanStack React Query, WebSocket client.
- **Design**: Component-based architecture, custom design system, three-column desktop layout, mobile-responsive with sheet-based navigation. Features a professional UI with an ICICI Bank-inspired banking aesthetic using orange/coral primary colors (#C54E1F) and warm beige backgrounds (#F5F0E8). Adheres to a "NO gradients, NO emojis" policy and meets WCAG AA accessibility standards (4.5:1 contrast minimum).

### Backend
- **Technology Stack**: Node.js with TypeScript, Express.js, WebSocket Server (ws), Drizzle ORM.
- **API Structure**: RESTful endpoints and WebSocket for real-time communication.
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, case-insensitive login IDs.
- **Authorization**: Role-Based Access Control (`admin` and `user` roles) with distinct access privileges and secure environment variables for secrets.

### Data Storage
- **Database**: PostgreSQL via Neon serverless HTTP driver, managed with Drizzle ORM.
- **Schema**: Comprehensive schema for users, conversations, messages, meetings (with AI summaries), tasks, projects (with tracking details), active calls, and standalone to-dos.
- **Data Preservation**: All existing data must be preserved across updates; schema changes must be backward compatible and non-destructive.

### Core Features
- **Real-time Communication**: Direct messages, group chats, file sharing, presence tracking, enhanced desktop notifications, message replies with mentions, and message deletion (sender-only with confirmation).
- **Meeting Management**: Meeting calendar with scheduling, recurring meetings, auto-generated Daily.co links, reminders, one-click "Start Meeting Now," and "Quick Join" functionality.
- **AI Integration**: GPT-4o for structured, multi-language AI meeting summaries.
- **Video Conferencing**: Instant one-click audio/video calls using Daily.co, direct join (no lobby), robust incoming/outgoing call notifications, and active call management with participant tracking and invitation system.
- **Task Management**: Start/target dates, status tracking, progress bars, real-time updates, automated reminders, and admin-only Excel import/export.
- **Project Tracking Dashboard**: Full project lifecycle management with auto-generated IDs, detailed tracking (status, progress, responsible persons, issues, dependencies, target dates), color-coded indicators, and CRUD operations with real-time updates.
- **User Productivity Tools**: Daily Work Log for activity tracking (excluding private to-dos), and a standalone private To-Do List with priority levels and completion tracking.
- **User Management**: Admin tools for user deletion and task oversight.
- **Security & Access**: Role-based access control, secure file management with ownership validation, and self-service password change.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **OpenAI via Replit AI Integrations**: GPT-4o for AI meeting summarization.
-   **Daily.co**: Video conferencing platform.
-   **Google Fonts**: Inter font family.
-   **File Storage**: Local filesystem (`uploads/` directory).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`, `xlsx`.

## Recent Changes

### November 7, 2025 - File Upload Enhancement
**Fixed chat attachment uploads for Excel, images, and videos**: Updated `server/upload.ts` to support all common file types requested by users. Expanded allowed MIME types to include Excel files (.xls, .xlsx), all common image formats (JPEG, PNG, GIF, WebP, BMP), and video formats (MP4, MPEG, QuickTime, AVI, WMV, WebM). Also added audio support (MP3, WAV, WebM, OGG). Increased file size limit from 10MB to 50MB to accommodate video uploads. Removed SVG support for security (prevents stored XSS attacks). Users can now attach Excel spreadsheets, images, and videos in chat conversations without errors.

### November 7, 2025 - Message Deletion Feature
**Implemented message deletion with ownership validation and real-time updates**: Users can now delete their own chat messages through a dropdown menu (three-dot icon) accessible from each message. The delete button is visible only for messages sent by the current user, with a semi-transparent menu that becomes fully visible on hover (better accessibility). Upon clicking delete, a browser confirmation dialog prevents accidental deletions. The backend validates message ownership via JWT authentication and broadcasts deletion events through WebSocket to all conversation members for instant UI updates. The DELETE /api/messages/:id endpoint uses `apiRequest` helper to attach auth tokens, and the UI correctly recomputes conversation's lastMessage after deletion. Message menu visibility enhanced from invisible to opacity-based (opacity-50 default, opacity-100 on hover) for improved mobile and testing accessibility.

### November 7, 2025 - Enhanced Call Invitation System
**Enabled inviting team members during active calls**: Implemented active call state tracking to persist call information after a call is answered, allowing the "Invite to Call" button and dialog to remain functional throughout the entire call duration (not just during the outgoing phase). Added separate `activeCall` state that persists after `outgoingCall` is cleared when a call is answered. Updated call lifecycle to set `activeCall` when starting calls, accepting calls, or receiving call_answered WebSocket events. Modified `handleSendCallInvite` to derive call context from either `activeCall` or `outgoingCall`, ensuring invitations work both before and after a call is answered. Call window monitoring now clears both states on close. UI conditionals updated to show Invite button when either state is active, with appropriate "End Call" vs "Cancel Call" button text. Successfully tested end-to-end with automated tests confirming invite dialog opens, users can be selected, and invitations are sent via WebSocket during active calls.