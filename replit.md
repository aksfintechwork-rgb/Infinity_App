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
- **Real-time Communication**: Direct messages, group chats, file sharing, presence tracking, enhanced desktop notifications.
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