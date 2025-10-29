# SUPREMO TRADERS LLP Team Communication Platform

## Overview

This is an internal team communication platform for SUPREMO TRADERS LLP, designed as a real-time chat application with role-based access control. It supports direct messaging, group conversations, file attachments, typing indicators, and a user management panel for administrators. The platform also includes a meeting calendar and video conferencing system, drawing inspiration from enterprise chat platforms like Slack, Microsoft Teams, and Linear to provide a clear, efficient, and professional communication tool.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite, Radix UI (shadcn/ui), Tailwind CSS, TanStack React Query, WebSocket client.
- **Design**: Component-based, custom design system with Inter font, three-column desktop layout (Sidebar, Conversation List, Chat Area), mobile-responsive, path aliases.

### Backend Architecture
- **Technology Stack**: Node.js with TypeScript, Express.js, WebSocket Server (ws), Drizzle ORM, JWT-based authentication with bcrypt.
- **API Structure**: RESTful endpoints, WebSocket for real-time, token-based authentication, middleware for security.
- **Design Decisions**: Single-port deployment, separation of concerns, development/production modes, request logging.

### Data Storage
- **Database**: PostgreSQL via Neon serverless HTTP driver, Drizzle ORM for schema migrations.
- **Schema**: `users`, `conversations`, `conversationMembers`, `messages`, `meetings` (id, title, description, start/end time, creator, link).
- **Design Decisions**: PostgreSQL for relational integrity, many-to-many relationships, support for direct and group messages.

### Authentication & Authorization
- **Authentication**: JWT tokens (7-day expiration), bcrypt hashing, localStorage for client tokens, Bearer token for HTTP, query parameter for WebSocket. Login IDs are case-insensitive.
- **Role-Based Access Control**: `admin` and `user` roles. Admins manage users and access admin panel; regular users access chat only.
- **Security**: JWT_SECRET environment variable, password validation, auth/admin middleware, public registration defaults to 'user' role, WebSocket connection verification.

### Cross-Device Compatibility
- Designed for seamless operation across all devices and browsers with automatic WebSocket reconnection, dynamic URL construction for real-time communication, and robust file handling.
- Implemented desktop notifications with sound alerts for new messages and a meeting calendar with integrated video conferencing (Jitsi Meet).

## External Dependencies

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Google Fonts**: Inter font family.
-   **Jitsi Meet**: Integrated for video conferencing (auto-generated meeting links).
-   **File Storage**: Local filesystem (`uploads/` directory) with Multer for multipart form handling (10MB limit, specific file types).
-   **Key Libraries**: `@neondatabase/serverless`, `drizzle-orm`, `jsonwebtoken`, `bcrypt`, `multer`, `ws`, `dotenv`, `@tanstack/react-query`, `date-fns`, `cors`.

## Recent Changes

**October 29, 2025:**
- **UI UPDATE**: Added official SUPREMO TRADERS logo to login page
  - Logo displayed prominently at the top of the login screen
  - Maintains professional branding across the platform
  - Centered layout with "Team Communication Platform" subtitle
- **NEW FEATURE**: Added Credential Verification Tool to Admin Panel
  - **Purpose**: Help troubleshoot user login issues and verify credentials quickly
  - **Features**: 
    - Display current standard passwords (admin123, user123, shubham123, ravi123)
    - Test any login credentials in real-time without affecting the system
    - Visual feedback (green for valid, red for invalid) with detailed messages
    - Troubleshooting guide for helping users with browser autocomplete issues
  - **Location**: Admin Panel → Credential Tester section
  - **Implementation**: Uses existing login API to verify credentials, shows user info on success
- **CRITICAL FIX**: Implemented comprehensive cross-device login compatibility
  - **Added CORS middleware**: Server now accepts requests from all origins with credentials support
  - **Cache-control headers**: API endpoints prevent browser caching of authentication data  
  - **Enhanced login logging**: Shows exact loginId, password length, and validation steps with emoji indicators
  - **Cross-device testing**: Verified successful login from mobile (iPhone), tablet (iPad), and desktop browsers
  - **Token persistence**: JWT tokens work seamlessly across any device type or network
  - **Implementation**: Installed `cors` package and configured Express middleware for full cross-origin support
  - Tested successful simultaneous logins from multiple devices (admin on mobile, shubham on tablet, ravi on desktop)
  - All existing features preserved - real-time messaging, WebSocket, notifications all work perfectly
- **Previous fixes**: Case-insensitive login, WebSocket auto-reconnection, desktop notifications, meeting calendar with video conferencing