# SUPREMO TRADERS LLP Team Communication Platform

## Overview
This project is an internal, real-time communication platform for SUPREMO TRADERS LLP. It features direct messaging, group chats, file attachments, and role-based access. Beyond core chat functionalities, it integrates a meeting calendar with AI summarization, video conferencing, comprehensive task management, and user profile management. The platform aims to be an efficient and professional communication tool, enhancing team collaboration and productivity.

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
- **Schema**: Includes tables for users, conversations, messages, meetings (with AI summaries), tasks, and associated entities.

### Authentication & Authorization
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, case-insensitive login IDs.
- **Role-Based Access Control**: `admin` and `user` roles, with distinct access privileges.
- **Security**: Environment variables for secrets, password validation, auth/admin middleware, auto-healing admin password system.

### Cross-Device Compatibility
- Seamless operation across devices and browsers with automatic WebSocket reconnection, robust file handling, and enhanced desktop notifications.
- **Mobile Optimization**: Touch-optimized interface, larger fonts, responsive layouts, and a comprehensive mobile navigation system with a Floating Action Button (FAB).

### Real-Time Features
- **Presence Tracking**: WebSocket-based online/offline status with multi-tab support and visual indicators.
- **Enhanced Notifications**: Browser desktop notifications with distinct audio alerts and automatic AudioContext management.

### Key Features
- **Group Conversations**: Group naming, member management, and optional message history access.
- **File & Image Sharing**: Enhanced media display with larger, clearer image previews (448px max-width, 400px max-height), clickable images that open full-size in new tabs, hover effects for interactivity, and one-click file downloads. Supports images (JPG, PNG, GIF, WebP), PDFs, and documents.
- **Admin Tools**: User deletion, real-time user list updates, and task oversight.
- **Meeting Calendar**: Full monthly grid view with clickable days, month navigation, and interactive meeting badges:
  - **Start Meeting Now**: Instantly opens a video meeting in a new window without creating a calendar entry
  - **Schedule Meeting**: Create calendar entries with custom date/time selection using native datetime-local inputs
  - **Meeting Badge Dropdown**: Click any meeting to access:
    - **Join Meeting**: Opens video conference in a new window (keeps main calendar accessible)
    - **Edit**: Opens edit dialog with pre-filled meeting details for quick time and participant updates
    - **Delete**: Removes the meeting with confirmation
  - Popup blocker detection with user-friendly toast notifications
  - Keyboard-accessible dropdown navigation using onSelect handlers
  - Flexible time scheduling - set meetings at any custom time via intuitive datetime inputs
- **AI Meeting Summaries**: GPT-4o (via Replit AI Integrations) generates structured, multi-language summaries with objectives, topics, outcomes, and participant guidance.
- **Instant Video/Audio Calling**: Video call integration for direct and group calls with screen sharing and unlimited duration. Video meetings open in separate windows to maintain access to chat, tasks, and calendar during calls.
- **Task Management**: Start/target dates, status tracking with completion percentage (0%, 25%, 50%, 75%, 100%), visual progress bars, status update reasons, task assignment, real-time WebSocket updates, customizable automated reminders, and a professional UI. Admins can view and filter all tasks. All users can update task status, completion percentage, and remarks for collaborative workflow.
  - **Custom Task Reminders**: Per-task reminder frequency with options: hourly, every 3 hours, every 6 hours, daily, every 2 days, or none. Reminders sent via chat messages from system user "Atul" with toast notifications for immediate visibility.
  - **Backend Implementation**: All 5 task retrieval methods in `server/storage.ts` (getTaskById, getTasksByCreator, getTasksByAssignee, getAllTasksForUser, getAllTasks) include `completionPercentage`, `statusUpdateReason`, `reminderFrequency`, and `lastReminderSent` fields in their SELECT statements to ensure complete data delivery to API consumers.
- **Professional UI Design**: Clean, responsive interface with a professional blue palette, solid colors, and enhanced visual hierarchy across all components (sidebar, conversation list, search, mobile).
- **Smart Chat Scrolling**: Intelligent auto-scroll system that allows users to read chat history without interruption. Features conversation-aware scrolling that:
  - Automatically scrolls to bottom when opening or switching conversations (shows latest messages)
  - Preserves scroll position when user scrolls up to read history (no forced auto-scroll)
  - Only auto-scrolls when user is near bottom (within 150px threshold)
  - Uses double requestAnimationFrame for reliable DOM synchronization
  - Direct scrollTop manipulation for consistent cross-browser behavior
- **Pin Chat Feature**: Users can pin up to 3 conversations to the top of their list with backend validation, real-time updates, and visual indicators.
- **Password Management**: Self-service password change feature with validation and security checks.
- **User Profile & Settings**: View profile information and manage app preferences (dark mode, notifications, sound alerts) with persistence via localStorage.
- **Task Assignment & Remarks**: Users can create tasks and edit assignments/remarks for their own tasks; admins can edit any task.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **OpenAI via Replit AI Integrations**: GPT-4o for AI meeting summarization.
-   **Google Fonts**: Inter font family.
-   **Video Conferencing**: Integrated for team meetings and calls.
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer.
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`.