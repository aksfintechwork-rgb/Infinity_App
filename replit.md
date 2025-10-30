# SUPREMO TRADERS LLP Team Communication Platform

## Overview

This is an internal team communication platform for SUPREMO TRADERS LLP. It is a real-time chat application with role-based access control, supporting direct messaging, group conversations, file attachments, typing indicators, and a user management panel for administrators. The platform also includes a meeting calendar with AI-powered summarization, video conferencing system, and comprehensive task management, aiming to provide an efficient and professional communication tool.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite, Radix UI (shadcn/ui), Tailwind CSS, TanStack React Query, WebSocket client.
- **Design**: Component-based, custom design system using Inter font, three-column desktop layout (Sidebar, Conversation List, Chat Area), mobile-responsive, and path aliases. Mobile UI uses sheet-based navigation and touch-optimized elements.

### Backend Architecture
- **Technology Stack**: Node.js with TypeScript, Express.js, WebSocket Server (ws), Drizzle ORM, JWT-based authentication with bcrypt.
- **API Structure**: RESTful endpoints, WebSocket for real-time communication, token-based authentication, and middleware for security.
- **Design Decisions**: Single-port deployment, separation of concerns, development/production modes, and request logging.

### Data Storage
- **Database**: PostgreSQL via Neon serverless HTTP driver, utilizing Drizzle ORM for schema migrations.
- **Schema**: Includes `users`, `conversations`, `conversationMembers`, `messages`, `meetings` (with `summary` and `summaryLanguage` fields), `meetingParticipants`, `tasks`, and `task_support_requests`.
- **Design Decisions**: PostgreSQL for relational integrity, supporting many-to-many relationships for direct and group messages. Task assignments use foreign key relationships to users table. Meeting participants stored in separate table with cascade delete for data integrity. Meeting summaries stored with language code for multi-language support.

### Authentication & Authorization
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, Bearer token for HTTP, query parameter for WebSocket. Login IDs are case-insensitive and support Unicode normalization for cross-device compatibility.
- **Role-Based Access Control**: `admin` and `user` roles, with administrators managing users and accessing the admin panel, while regular users access chat features.
- **Security**: JWT_SECRET environment variable, password validation, auth/admin middleware, public registration defaults to 'user' role, and WebSocket connection verification. Includes an auto-healing admin password system for production robustness.

### Cross-Device Compatibility
- Designed for seamless operation across all devices and browsers with automatic WebSocket reconnection, dynamic URL construction for real-time communication, robust file handling, and desktop notifications with enhanced loud sound alerts. Features mobile keyboard compatibility fixes for login.
- **Mobile-Optimized Interface**: All touch targets meet minimum accessibility guidelines (44-48px), larger fonts and inputs for better readability, responsive spacing and layouts, improved mobile navigation with wider sheet menus (90vw), and zoom-friendly viewport configuration for accessibility.

### Real-Time Presence Tracking
- **Online/Offline Status**: WebSocket-based user presence system that accurately tracks which users are currently connected
- **Multi-Tab Support**: Backend maintains deduplicated online user roster and only broadcasts `user_offline` when the final connection for a user closes
- **Visual Indicators**: Green dot indicators on direct message conversations show when the other user is truly online
- **WebSocket Events**: `online_users` (initial list on connect), `user_online`, and `user_offline` events for real-time presence updates

### Enhanced Notifications
- **Desktop Notifications**: Browser notifications with attention-grabbing triple-beep sound pattern
- **Loud Sound Alert**: Ascending melodic pattern (A5→C6→E6 frequencies) with increased volume (0.5-0.6 gain) for better noticeability
- **AudioContext Management**: Automatic audio context initialization and handling of browser autoplay policies

### Key Features
- **Group Conversation Management**: Required group names, ability to add members to existing groups with optional access to message history.
- **Admin Features**: User deletion and real-time user list updates across clients.
- **Meeting Calendar**: Integrated with video conferencing (Jitsi Meet), team member participation tracking, recurring meeting schedules (daily/weekly/monthly with customizable frequency and end date), and AI-powered meeting summarization.
- **AI Meeting Summaries**: Automatic generation of professional meeting summaries using OpenAI (via Replit AI Integrations), with support for 20+ languages including English (default), Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, and Indian languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi). Summaries can be copied and shared with team members in any language.
- **Task Management System**: Complete task management with start/target dates, remarks, status tracking (todo/in_progress/completed), priority levels (low/medium/high), task assignment, real-time WebSocket updates with authorization filtering (only creator and assignee receive updates), and colorful zen-themed UI. Admins can view all tasks created by any team member using the "All Tasks" filter.
  - **Smart Dashboard Features**:
    - Statistics cards showing overview metrics (Total Tasks, To Do, In Progress, Completed, Overdue)
    - Status filtering (All, To Do, In Progress, Done)
    - Sorting options (Recent, Due Date, Status)
    - Visual due date indicators (Overdue badges in rose/pink, Due Soon badges in amber for tasks within 3 days)
    - Enhanced task cards with gradient borders, colored top bars for urgent tasks, and improved visual hierarchy
- **Chat Page UI Enhancements**: Smart, attractive, and responsive chat interface with modern design elements:
  - **Enhanced Conversation List**:
    - Colorful gradient avatars with 7 distinct color schemes based on user/group name
    - Online status indicators (green dot) for direct messages
    - Group badges with purple-to-blue gradient and Users icon
    - Enhanced visual hierarchy with bold text for unread messages
    - Read receipts with CheckCheck icons for read messages
    - Smart timestamp formatting (Today/Yesterday/Date format)
    - Gradient hover overlays for smooth interactions
    - Enhanced unread badges with gradient backgrounds showing count (99+ for large numbers)
  - **Header Design**:
    - Purple-to-blue gradient branding on company logo and title
    - Logo with rounded corners, shadow, and ring effects
    - Online status indicator on logo
    - Gradient container backgrounds for navigation
    - Enhanced navigation buttons with proper Shadcn sizing and shadow effects
  - **Search & Actions**:
    - Styled search input with focus ring effects (purple glow on focus)
    - Gradient "New Conversation" button with purple-to-blue color scheme
    - Empty state UI with icon and descriptive messaging
  - **Mobile Optimizations**:
    - Consistent visual enhancements in Sheet component for mobile
    - Touch-friendly button sizes using Shadcn variants
    - Responsive design that adapts gracefully across all viewport sizes
- **Password Management**: Self-service password change feature accessible from user menu, with validation, security checks, and password visibility toggles. Both admins and regular users can change their own passwords.
- **Admin Tools**: 
  - Credential Verification Tool to aid in troubleshooting login issues
  - Admins can view all tasks from all team members for oversight and coordination
  - **Task Filtering by Team Member**: Admins can filter tasks to view only those related to a specific team member (tasks created by or assigned to them) using a dedicated dropdown filter. Includes validation to prevent invalid requests and seamless integration with existing filter buttons.
  - **Task Assignment & Remark Editing**: Admins can edit task assignments and add/update remarks for any task. This allows administrators to reassign tasks to different team members and add administrative notes or instructions. The edit dialog is accessible from the task detail view and includes form validation.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **OpenAI via Replit AI Integrations**: AI-powered meeting summarization using GPT-4o-mini model with multi-language translation support.
-   **Google Fonts**: Inter font family.
-   **Jitsi Meet**: Integrated for video conferencing.
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer for multipart form handling (10MB limit, specific file types).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`.