# SUPREMO TRADERS LLP Team Communication Platform

## Overview

This is an internal team communication platform for SUPREMO TRADERS LLP. It is a real-time chat application with role-based access control, supporting direct messaging, group conversations, file attachments, typing indicators, and a user management panel for administrators. The platform also includes a meeting calendar with AI-powered summarization, video conferencing system, comprehensive task management, and fully functional user profile and settings management, aiming to provide an efficient and professional communication tool.

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
- **Mobile Navigation System**: Comprehensive mobile navigation ensuring users are never stuck:
  - Chat view (conversation list): Menu button opens Sheet for view switching (Chat/Tasks/Calendar)
  - Chat view (active conversation): Back button returns to conversation list, menu button opens Sheet for view switching
  - Tasks view: Dedicated mobile menu button in header for accessing Sheet navigation
  - Calendar view: Dedicated mobile menu button in header for accessing Sheet navigation
  - All mobile menu buttons use consistent icon-only design (hamburger icon) and are hidden on desktop
  - Floating Action Button (FAB) for quick access to new conversations on mobile
  - All navigation controls optimized for touch with proper sizing and spacing

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
- **Instant Video/Audio Calling**: Integrated Jitsi Meet video calling directly within chat conversations, supporting both direct and group calls with screen sharing capability. Deterministic room naming ensures all participants in the same conversation join the same call session. Features include:
  - Start Call button in chat header (desktop and mobile optimized)
  - Full Jitsi Meet interface with camera, microphone, and screen sharing controls
  - Leave Call functionality to return to normal chat view
  - Works for both one-on-one and group conversations
  - No additional setup required - instant access from any conversation
- **Task Management System**: Complete task management with start/target dates, remarks, status tracking (todo/in_progress/completed), priority levels (low/medium/high), task assignment, real-time WebSocket updates with authorization filtering (only creator and assignee receive updates), and colorful zen-themed UI. Admins can view all tasks created by any team member using the "All Tasks" filter.
  - **Smart Dashboard Features**:
    - Statistics cards showing overview metrics (Total Tasks, To Do, In Progress, Completed, Overdue)
    - Status filtering (All, To Do, In Progress, Done)
    - Sorting options (Recent, Due Date, Status)
    - Visual due date indicators (Overdue badges in rose/pink, Due Soon badges in amber for tasks within 3 days)
    - Enhanced task cards with gradient borders, colored top bars for urgent tasks, and improved visual hierarchy
  - **Automated Task Reminders**: Background service that monitors task deadlines and sends automated reminder messages via chat:
    - System user (ID: 25) automatically sends reminder messages to assigned team members
    - Reminders triggered for tasks due within 24 hours or already overdue
    - 24-hour cooldown period between reminders to prevent notification spam
    - Creates or reuses direct message conversations between system and user
    - Text-based headers: [TASK REMINDER], [URGENT - OVERDUE TASK], [TASK DUE SOON]
    - Service runs every 60 minutes checking all active tasks
    - Tracks reminder delivery via lastReminderSent timestamp in database
- **Chat Page UI Enhancements**: Clean, professional, and responsive chat interface with modern design:
  - **Clean Dashboard Layout**:
    - Simplified sidebar with consistent spacing and minimal distractions
    - Cleaner header design with smaller logo and status indicator
    - Reduced gradients and visual noise for better focus on content
    - Improved navigation buttons with better sizing and spacing
  - **Enhanced Conversation List**:
    - Colorful gradient avatars with 7 distinct color schemes based on user/group name
    - Online status indicators (green dot) for direct messages
    - Group badges with purple-to-blue gradient and Users icon
    - Enhanced visual hierarchy with bold text for unread messages
    - Read receipts with CheckCheck icons for read messages
    - Smart timestamp formatting (Today/Yesterday/Date format)
    - Smooth hover interactions
    - Enhanced unread badges with gradient backgrounds showing count (99+ for large numbers)
  - **Search & Actions**:
    - Clean search input with subtle styling
    - Gradient "New Conversation" button with purple-to-blue color scheme
    - Minimal empty state UI with icon and descriptive messaging
  - **Mobile Optimizations**:
    - Consistent visual enhancements in Sheet component for mobile
    - Touch-friendly button sizes using Shadcn variants
    - Responsive design that adapts gracefully across all viewport sizes
- **Pin Chat Feature**: Users can pin up to 3 important conversations to the top of their conversation list for quick access:
  - **Database**: `pinned_conversations` table with UNIQUE constraint on (user_id, conversation_id) to prevent duplicate pins
  - **3-Pin Limit**: Backend validation ensures each user can only pin a maximum of 3 conversations
  - **Authorization**: Users can only pin conversations they are members of
  - **Sorting**: Pinned conversations appear at the top of the list, sorted by pin timestamp (most recently pinned first)
  - **Visual Indicator**: Pin icon displayed on pinned conversations with hover interactions
  - **Pin/Unpin Controls**: Quick toggle buttons in conversation list for easy management
  - **API Endpoints**: GET /api/pinned-conversations, POST /api/conversations/:id/pin, DELETE /api/conversations/:id/unpin
  - **Real-time Updates**: React Query integration with optimistic updates for instant feedback
- **Password Management**: Self-service password change feature accessible from user menu, with validation, security checks, and password visibility toggles. Both admins and regular users can change their own passwords.
- **User Profile & Settings**:
  - **Profile Dialog**: View complete user profile information including name, login ID, email, role, and join date. Features loading state while fetching data and error handling for failed requests. Accessible from user menu.
  - **Settings Dialog**: Manage application preferences including dark mode toggle, desktop notifications, sound alerts, and auto-play video settings. All settings persist via localStorage and provide immediate visual feedback.
  - Clean, professional UI with loading states, error handling, and responsive design throughout.
- **Task Assignment & Remarks**: All users can create tasks with assignments and add remarks. Task creators can edit assignments and remarks for their own tasks, allowing them to reassign tasks to other team members and add/update notes. Admins can edit assignments and remarks for any task. The edit dialog is accessible from the task detail view and includes form validation.
- **Admin Tools**: 
  - Credential Verification Tool to aid in troubleshooting login issues
  - Admins can view all tasks from all team members for oversight and coordination
  - **Task Filtering by Team Member**: Admins can filter tasks to view only those related to a specific team member (tasks created by or assigned to them) using a dedicated dropdown filter. Includes validation to prevent invalid requests and seamless integration with existing filter buttons.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **OpenAI via Replit AI Integrations**: AI-powered meeting summarization using GPT-4o-mini model with multi-language translation support.
-   **Google Fonts**: Inter font family.
-   **Jitsi Meet**: Integrated for video conferencing.
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer for multipart form handling (10MB limit, specific file types).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`, `openai`.