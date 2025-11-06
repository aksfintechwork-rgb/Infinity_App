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
- **Professional UI Design**: Clean, responsive interface with a professional blue palette.
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