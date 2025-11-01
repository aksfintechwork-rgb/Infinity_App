# SUPREMO TRADERS LLP Team Communication Platform

## Overview
This project is an internal, real-time communication platform for SUPREMO TRADERS LLP. It features direct messaging, group chats, file attachments, and role-based access. Beyond core chat functionalities, it integrates a meeting calendar with AI summarization, video conferencing, comprehensive task management, and user profile management. The platform aims to be an efficient and professional communication tool, enhancing team collaboration and productivity.

## User Preferences
Preferred communication style: Simple, everyday language.

## CRITICAL: Data Preservation Policy
**MANDATORY RULE FOR ALL FUTURE UPDATES:**
- ALL existing data MUST be preserved in every update - tasks, messages, meetings, conversations, user data, file attachments
- NEVER delete or hide existing data when implementing new features
- NEVER modify database schema in ways that lose data (e.g., changing column types, dropping columns)
- Filter logic changes should ONLY affect what users SEE, not what data EXISTS in the database
- UI updates should ONLY change visibility/presentation, never data deletion
- When adding features: extend existing tables with new columns, don't replace or remove existing ones
- Always use `npm run db:push --force` for schema changes to preserve existing data
- **Data Integrity First**: Any update must ensure backward compatibility with all existing records
- Excel import should ADD new tasks, not replace existing ones
- Admin filters show/hide tasks from view, but all tasks remain in database
- Regular user visibility restrictions are VIEW-LEVEL only - all their assigned tasks exist in database permanently

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
  - **Weekly Off Display**: Sundays are visually marked as weekly off with red header text, "Weekly Off" label, subtle red background, and "OFF" indicator in each Sunday cell
  - **Meeting Badge Dropdown**: Click any meeting to access:
    - **Join Meeting**: Opens video conference in a new window (keeps main calendar accessible)
    - **Edit**: Opens edit dialog with pre-filled meeting details for quick time and participant updates
    - **Delete**: Removes the meeting with confirmation
  - **Auto-Generated Meeting Links**: Jitsi video links created automatically when joining - no technical room names visible to users
  - **Meeting Capacity**: Supports up to 35 participants (recommended) or 75 maximum with unlimited duration
  - **Recurring Meetings**: Daily, weekly, or monthly patterns with automatic display across all scheduled occurrence dates
  - **Indian Standard Time (IST)**: All times displayed and managed in IST with automatic UTC conversion for database storage
  - Popup blocker detection with user-friendly toast notifications
  - Keyboard-accessible dropdown navigation using onSelect handlers
  - Flexible time scheduling - set meetings at any custom time via intuitive datetime inputs
- **AI Meeting Summaries**: GPT-4o (via Replit AI Integrations) generates structured, multi-language summaries with objectives, topics, outcomes, and participant guidance.
- **Instant Video/Audio Calling**: Video call integration for direct and group calls with screen sharing and unlimited duration. Video meetings open in separate windows to maintain access to chat, tasks, and calendar during calls.
- **Task Management**: Start/target dates, status tracking with completion percentage (0%, 25%, 50%, 75%, 100%), visual progress bars, status update reasons, task assignment, real-time WebSocket updates, customizable automated reminders, and a professional UI. 
  - **Task Visibility**: Regular users see ONLY tasks assigned to them. Admins can view and filter all tasks (all tasks, created by them, assigned to them, or by specific team member).
  - **Task Editing**: All users can update task status, completion percentage, and remarks for tasks assigned to them. Admins can edit any task.
  - **Custom Task Reminders**: Per-task reminder frequency with options: hourly, every 3 hours, every 6 hours, daily, every 2 days, or none. Reminders sent via chat messages from system user "Atul" with toast notifications for immediate visibility.
  - **Excel Import/Export** (Admin-only): Bulk task management via Excel spreadsheets with comprehensive error handling:
    - **Export**: Downloads all currently visible tasks (respecting filters) as .xlsx file with complete task data including ID, title, description, dates, status, completion percentage, assignees, reminders, and remarks
    - **Import**: Bulk upload tasks from Excel files with intelligent date conversion (handles Excel serial dates), assignee name matching, and validation
    - **Error Reporting**: Detailed feedback showing row numbers and specific failure reasons (missing title, unknown assignee, invalid data) for up to 5 failed rows with summary count
    - **Date Handling**: Automatic conversion of Excel serial dates to ISO format, accounting for Excel's 1900 leap year bug
    - **Validation**: Title requirement, assignee existence verification, reminder frequency whitelist with safe defaults
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
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`, `xlsx` (for Excel file handling).