# SUPREMO TRADERS LLP Team Communication Platform

## Overview
This project is an internal, real-time communication platform for SUPREMO TRADERS LLP, designed to enhance collaboration and productivity. It provides core communication features like direct messaging, group chats, and file sharing, alongside advanced tools such as a meeting calendar with AI summarization, robust video conferencing, comprehensive task management, and a project tracking dashboard. The platform prioritizes data preservation and integrity across all updates.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Technology Stack**: React with TypeScript, Vite, Radix UI (shadcn/ui), Tailwind CSS, TanStack React Query, WebSocket client.
- **Design**: Component-based architecture, custom design system, three-column desktop layout, mobile-responsive with sheet-based navigation. Features a professional UI with an ICICI Bank-inspired banking aesthetic using orange/coral primary colors (#C54E1F) and warm beige backgrounds (#F5F0E8). Adheres to a "NO gradients, NO emojis" policy and meets WCAG AA accessibility standards.

### Backend
- **Technology Stack**: Node.js with TypeScript, Express.js, WebSocket Server (ws), Drizzle ORM.
- **API Structure**: RESTful endpoints and WebSocket for real-time communication.
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, case-insensitive login IDs.
- **Authorization**: Role-Based Access Control (`admin` and `user` roles).

### Data Storage
- **Database**: PostgreSQL via Neon serverless HTTP driver, managed with Drizzle ORM.
- **Schema**: Comprehensive schema for users, conversations, messages, meetings (with AI summaries), tasks, projects, active calls, and standalone to-dos.
- **Data Preservation**: All existing data must be preserved; schema changes must be backward compatible and non-destructive.

### Core Features
- **Real-time Communication**: Direct messages, group chats, file sharing (Excel, images, video, audio up to 50MB), presence tracking, enhanced desktop notifications with on-screen toast pop-ups for ALL incoming messages, message replies, and sender-only message deletion. Automatic URL detection and clickable links in chat messages. Chat auto-scrolls to latest messages while respecting user scroll position for reading history.
- **Meeting Management**: Meeting calendar with scheduling, recurring meetings, auto-generated Daily.co links, reminders, one-click "Start Meeting Now" with instant shareable link dialog, "Quick Join," and shareable meeting links for external guests.
- **AI Integration**: GPT-4o for structured, multi-language AI meeting summaries.
- **Video Conferencing**: Instant one-click audio/video calls using Daily.co with camera off by default (privacy-first), direct join, robust incoming/outgoing call notifications, active call management with participant tracking, invitation system with shareable meeting links. All meeting URLs include `video=false` parameter to ensure cameras start disabled. Supports Web Push Notifications with sound and vibration for both incoming calls AND new messages on mobile/desktop, even when app is closed or in background. Notifications only sent to offline users.
- **Task Management**: Start/target dates, status tracking, progress bars, real-time updates, automated reminders, and admin-only Excel import/export.
- **Project Tracking Dashboard**: Full project lifecycle management with auto-generated IDs, detailed tracking (status, progress, responsible persons, issues, dependencies, target dates), color-coded indicators, and CRUD operations with real-time updates.
- **Performance Dashboard**: Admin-only analytics dashboard with comprehensive visualizations including overall statistics cards (total tasks, completion rate, active projects, team size), task completion trend charts, user performance bar charts, task distribution pie charts, detailed user statistics table, and project performance tracking. Features period-based filtering (week, month, quarter, year) with empty state handling and banking theme-aligned chart colors.
- **User Productivity Tools**: Daily Work Log and a standalone private To-Do List with priority levels, completion tracking, and reminder system.
- **User Management**: Admin tools for user deletion and task oversight.
- **Security & Access**: Role-based access control, secure file management with ownership validation, and self-service password change.

## External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI via Replit AI Integrations**: GPT-4o for AI meeting summarization.
- **Daily.co**: Video conferencing platform.
- **Google Fonts**: Inter font family.
- **File Storage**: Local filesystem (`uploads/` directory).
- **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`, `xlsx`, `web-push`, `nanoid`, `recharts`.