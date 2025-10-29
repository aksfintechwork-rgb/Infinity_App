# SUPREMO TRADERS LLP Team Communication Platform

## Overview

This is an internal team communication platform for SUPREMO TRADERS LLP. It is a real-time chat application with role-based access control, supporting direct messaging, group conversations, file attachments, typing indicators, and a user management panel for administrators. The platform also includes a meeting calendar and video conferencing system, aiming to provide an efficient and professional communication tool.

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
- **Schema**: Includes `users`, `conversations`, `conversationMembers`, `messages`, `meetings`, `tasks`, and `task_support_requests`.
- **Design Decisions**: PostgreSQL for relational integrity, supporting many-to-many relationships for direct and group messages. Task assignments use foreign key relationships to users table.

### Authentication & Authorization
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, Bearer token for HTTP, query parameter for WebSocket. Login IDs are case-insensitive and support Unicode normalization for cross-device compatibility.
- **Role-Based Access Control**: `admin` and `user` roles, with administrators managing users and accessing the admin panel, while regular users access chat features.
- **Security**: JWT_SECRET environment variable, password validation, auth/admin middleware, public registration defaults to 'user' role, and WebSocket connection verification. Includes an auto-healing admin password system for production robustness.

### Cross-Device Compatibility
- Designed for seamless operation across all devices and browsers with automatic WebSocket reconnection, dynamic URL construction for real-time communication, robust file handling, and desktop notifications with sound alerts. Features mobile keyboard compatibility fixes for login.

### Key Features
- **Group Conversation Management**: Required group names, ability to add members to existing groups with optional access to message history.
- **Admin Features**: User deletion and real-time user list updates across clients.
- **Meeting Calendar**: Integrated with video conferencing (Jitsi Meet).
- **Task Management System**: Complete task management with start/target dates, remarks, status tracking (todo/in_progress/completed), priority levels (low/medium/high), task assignment, real-time WebSocket updates with authorization filtering (only creator and assignee receive updates), and colorful zen-themed UI.
- **Password Management**: Self-service password change feature accessible from user menu, with validation, security checks, and password visibility toggles. Both admins and regular users can change their own passwords.
- **Admin Tools**: Credential Verification Tool to aid in troubleshooting login issues.

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Google Fonts**: Inter font family.
-   **Jitsi Meet**: Integrated for video conferencing.
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer for multipart form handling (10MB limit, specific file types).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`.