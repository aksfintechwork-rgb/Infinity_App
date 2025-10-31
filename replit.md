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
- **Admin Tools**: User deletion, real-time user list updates, and task oversight.
- **Meeting Calendar**: Integrated Jitsi Meet video conferencing, participant tracking, recurring meeting schedules, and AI-powered summarization.
- **AI Meeting Summaries**: GPT-4o (via Replit AI Integrations) generates structured, multi-language summaries with objectives, topics, outcomes, and participant guidance.
- **Instant Video/Audio Calling**: Jitsi Meet integration for direct and group calls with screen sharing, unlimited duration, and deterministic room naming.
- **Task Management**: Start/target dates, status tracking, priority levels, task assignment, real-time WebSocket updates, automated reminders, and a professional UI. Admins can view and filter all tasks.
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
-   **Jitsi Meet**: Integrated for video conferencing.
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer.
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`.