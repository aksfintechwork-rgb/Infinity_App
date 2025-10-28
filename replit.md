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

## Recent Changes

**October 28, 2025:**
- Implemented role-based access control (admin vs user)
- Added admin user management panel with user creation functionality
- Integrated SUPREMO TRADERS brand logo
- Added requireAdmin middleware for protected admin routes
- Created admin-only API endpoints: GET/POST /api/admin/users
- Security fix: Public registration now forces role='user' to prevent privilege escalation
- Admin users can switch between Chat and Admin views
- User list displays role badges (Admin/User)