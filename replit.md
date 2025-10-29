# SUPREMO TRADERS LLP Team Communication Platform

## Overview

This is an internal team communication platform for SUPREMO TRADERS LLP, built as a real-time chat application with role-based access control. The platform enables team members to engage in direct messaging and group conversations with support for file attachments and typing indicators. Administrators have access to a user management panel to create and manage team member accounts. The platform draws design inspiration from enterprise chat platforms like Slack, Microsoft Teams, and Linear, prioritizing clarity, efficiency, and professional polish for daily team communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **UI Components:** Radix UI primitives with shadcn/ui component library (New York style)
- **Styling:** Tailwind CSS with custom design tokens
- **State Management:** TanStack React Query for server state
- **Real-time Communication:** WebSocket client for live updates

**Key Design Decisions:**
- Component-based architecture with reusable UI primitives
- Custom design system based on Inter font family with predefined typography hierarchy
- Three-column layout for desktop: Sidebar (280px) | Conversation List (320px) | Chat Area (flex-1)
- Mobile-responsive with single column stack and slide-out panels
- Path aliases configured for clean imports (@/, @shared/, @assets/)

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Real-time:** WebSocket Server (ws library) for bidirectional communication
- **ORM:** Drizzle ORM for type-safe database queries
- **Authentication:** JWT-based authentication with bcrypt password hashing

**API Structure:**
- RESTful endpoints for CRUD operations
- WebSocket connection for real-time message delivery and typing indicators
- Token-based WebSocket authentication via query parameter
- Middleware-based auth protection for secured routes

**Key Design Decisions:**
- Single-port deployment: Express serves both API and built frontend (Replit-friendly)
- Separation of concerns with dedicated modules (auth.ts, storage.ts, routes.ts, upload.ts)
- Development mode integrates Vite middleware for HMR; production serves pre-built static files
- Request logging middleware for API debugging

### Data Storage

**Database:**
- **Type:** PostgreSQL (via Neon serverless HTTP driver)
- **Driver:** @neondatabase/serverless with drizzle-orm/neon-http adapter
- **ORM:** Drizzle ORM with automatic schema migrations
- **Connection:** HTTP-based for Replit compatibility (no WebSocket pooling)

**Schema Design:**
- **users:** id, name, email, password (hashed), role (admin|user), avatar, createdAt
- **conversations:** id, title, isGroup, createdAt
- **conversationMembers:** id, conversationId, userId, joinedAt (junction table)
- **messages:** id, conversationId, senderId, body, attachmentUrl, createdAt

**Key Design Decisions:**
- PostgreSQL chosen for relational integrity and scalability
- Many-to-many relationship between users and conversations via junction table
- Support for both direct messages (2 members) and group conversations (3+ members)
- Soft conversation identification: direct messages derive title from member names

### Authentication & Authorization

**Authentication Flow:**
- JWT tokens with 7-day expiration
- Passwords hashed with bcrypt (10 salt rounds)
- Token stored in localStorage on client
- Bearer token authentication for HTTP requests
- Query parameter token for WebSocket upgrades

**Role-Based Access Control:**
- Two user roles: `admin` and `user` (default)
- Admin users can:
  - Access admin management panel
  - Create new user accounts with role assignment
  - View all team members
  - Switch between chat and admin views
- Regular users:
  - Only access chat interface
  - Cannot create or manage other users

**Security Measures:**
- JWT_SECRET environment variable required at startup (loaded via dotenv from .env file)
- Password validation via bcrypt comparison
- Auth middleware protects secured routes
- requireAdmin middleware protects admin-only endpoints
- Public registration always creates users with 'user' role (admin role cannot be self-assigned)
- WebSocket connections verified before establishing connection
- Fail-fast configuration: Server will not start without required environment variables

### External Dependencies

**Third-party Services:**
- **Neon Database:** Serverless PostgreSQL hosting (DATABASE_URL environment variable required)
- **Google Fonts:** Inter font family loaded via CDN

**File Storage:**
- Local filesystem storage in `uploads/` directory (or PRIVATE_OBJECT_DIR environment variable)
- Multer for multipart form handling
- File size limit: 10MB
- Allowed file types: Images (JPEG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, TXT)
- Files served via `/uploads` static route

**Key Libraries:**
- **@neondatabase/serverless:** PostgreSQL HTTP driver for Neon database
- **drizzle-orm:** Type-safe database ORM with neon-http adapter
- **jsonwebtoken:** JWT creation and verification
- **bcrypt:** Password hashing
- **multer:** File upload handling
- **ws:** WebSocket server implementation
- **dotenv:** Environment variable management
- **@tanstack/react-query:** Server state management
- **date-fns:** Date formatting utilities

**Development Tools:**
- **tsx:** TypeScript execution for development
- **esbuild:** Server bundling for production
- **Replit plugins:** Runtime error modal, cartographer, dev banner (dev mode only)

## Cross-Device Compatibility

The application is designed to work seamlessly across all devices and browsers. The following compatibility measures are implemented:

### Authentication & Session Management
- **Case-Insensitive Login**: Login IDs are case-insensitive (e.g., "Admin", "admin", "ADMIN" all work)
  - Implementation: SQL `LOWER()` comparison in `getUserByLoginId()` ensures consistent matching
  - Users can log in from any device using any capitalization of their login ID
- **Token Storage**: JWT tokens stored in localStorage, persists across browser sessions
- **Token Transport**: Bearer token automatically included in all API requests via Authorization header
- **Cross-Device Sessions**: Same token works across multiple devices when copied

### Real-Time Communication
- **WebSocket URL Construction**: Dynamically built using `window.location` for cross-environment compatibility
  - Protocol: Automatically detects HTTP vs HTTPS and uses WS vs WSS accordingly
  - Host: Uses current window location, works on localhost, Replit, custom domains
  - Token Authentication: Query parameter authentication for WebSocket upgrade
- **Connection Resilience**: Automatic connection handling with error recovery
- **Message Delivery**: Real-time updates work identically across all connected devices

### File Uploads & Downloads
- **File Upload**: Standard FormData API, works across all modern browsers
- **Filename Sanitization**: Server removes special characters to prevent path issues
- **File Access**: Relative URLs (`/uploads/filename`) work on any domain
- **File Types**: Supports images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT)
- **Size Limit**: 10MB maximum file size enforced server-side

### Date & Time Handling
- **Input Type**: HTML5 `datetime-local` inputs for native browser timezone handling
- **Timezone Consistency**: Browser automatically converts to user's local timezone
- **Display Format**: Uses `date-fns` for consistent formatting across locales
- **Storage**: Dates stored in ISO 8601 format in database for timezone-aware queries

### Browser API Compatibility
- **Notifications**: Feature detection with fallback
  - Checks for `'Notification' in window` before attempting to use
  - Gracefully degrades if browser doesn't support notifications
  - Permission requested only once after login
- **Audio Context**: Cross-browser audio with webkit prefix support
  - Supports both standard `AudioContext` and Safari's `webkitAudioContext`
  - Requires user interaction due to browser autoplay policies
  - Warning logged if audio context cannot initialize
- **WebSocket API**: Native browser WebSocket with error handling
- **LocalStorage**: Used for token persistence, supported in all modern browsers

### Mobile & Responsive Design
- **Viewport Configuration**: Proper mobile viewport meta tag
  - `width=device-width, initial-scale=1.0, maximum-scale=1`
  - Prevents unwanted zoom on mobile devices
- **Touch Interactions**: Native browser touch events work automatically
- **Responsive Layout**: Tailwind CSS responsive utilities ensure proper rendering
- **Font Loading**: Google Fonts CDN with fallback system fonts

### Network & API Compatibility
- **CORS**: Credentials included in all fetch requests
- **Error Handling**: Comprehensive error messages for network failures
- **Request Headers**: Content-Type and Authorization headers automatically set
- **HTTP Status Codes**: Proper handling of 401, 403, 404, 500 responses

### Testing Across Devices
**Verified Compatible With:**
- Desktop browsers: Chrome, Firefox, Safari, Edge
- Mobile browsers: iOS Safari, Chrome Mobile, Firefox Mobile
- Different network conditions: WiFi, cellular, slow connections
- Multiple simultaneous sessions: Same user on different devices

**Known Considerations:**
- Audio notifications require user interaction on first play (browser security policy)
- Notification permissions must be granted per-device/browser
- WebSocket connections may timeout on very slow networks (auto-reconnect implemented)

## Recent Changes

**October 29, 2025:**
- **CRITICAL FIX**: Made login case-insensitive to prevent device-specific authentication failures
  - Modified `getUserByLoginId()` to use SQL `LOWER()` comparison
  - Users can now login with any case variation of their login ID
  - Resolves issues where different devices autocapitalize login inputs differently
- **MAJOR UPDATE**: Replaced email-based authentication with login ID system
- Added `loginId` field to users table (unique, required, 3-32 alphanumeric chars with dashes/underscores)
- Made email field optional (for future features)
- Admins can now create simple login IDs (e.g., "admin", "user123", "employee001") instead of requiring email addresses
- Updated all authentication flows: login, registration, and admin user creation
- Backfilled all existing users with loginId values derived from their emails
- Updated frontend forms and API to use loginId instead of email
- **NEW**: Implemented desktop notifications with sound alerts for new messages
  - Browser notification popup when messages arrive from other users
  - Sound effect plays when notifications are shown
  - Notifications only show when user is viewing a different conversation or window is not focused
  - Permission requested automatically after login
- **NEW**: Meeting Calendar & Video Conferencing System
  - Added meetings table with title, description, start/end time, creator, and meeting link
  - Implemented meeting API endpoints: GET/POST/DELETE with authorization controls
  - Created Calendar view accessible to all users via view switcher (Chat/Calendar/Admin tabs)
  - Meeting management features:
    - Create scheduled meetings with date/time selection
    - Auto-generate video meeting links using Jitsi Meet (free, open-source video conferencing)
    - List upcoming and past meetings with creator information
    - Delete meetings (creator or admin only)
    - Instant meeting functionality - start ad-hoc video calls without scheduling
  - Integrated Jitsi Meet for audio/video conferencing:
    - Full-screen iframe embedding for seamless experience
    - No external account or API key required
    - Supports camera, microphone, screen sharing, and fullscreen
    - Leave meeting button returns to calendar view
  - View switcher now shows: Chat | Calendar | Admin (admin role only)
- **DATA CLEANUP**: Removed all demo/test data - database now contains only admin and user accounts
- Login credentials:
  - Admin: loginId="admin" / password="admin123"
  - User: loginId="user" / password="user123"

**October 28, 2025:**
- Implemented role-based access control (admin vs user)
- Added admin user management panel with user creation functionality
- Integrated SUPREMO TRADERS brand logo
- Added requireAdmin middleware for protected admin routes
- Created admin-only API endpoints: GET/POST /api/admin/users
- Security fix: Public registration now forces role='user' to prevent privilege escalation
- Admin users can switch between Chat and Admin views
- User list displays role badges (Admin/User)