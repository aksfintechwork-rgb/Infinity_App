# Infinity Technology Team Communication Platform - Local Setup Guide

This comprehensive guide will help you set up and run the Infinity Technology Team Communication Platform on your local machine.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [External Services Setup](#external-services-setup)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)
9. [Development Workflow](#development-workflow)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v20.x or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Recommended: Use Node Version Manager (nvm)
     ```bash
     # Install nvm (macOS/Linux)
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     
     # Install Node.js 20
     nvm install 20
     nvm use 20
     ```

2. **PostgreSQL** (v14 or higher)
   - **macOS**: `brew install postgresql@14`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - Verify installation: `psql --version`

3. **Git**
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

4. **Package Manager**: npm (comes with Node.js) or yarn
   - npm is included with Node.js
   - For yarn: `npm install -g yarn`

---

## System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2 recommended for Windows)
- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk Space**: At least 2GB free space
- **Internet Connection**: Required for initial setup and external API calls

---

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository (replace with your actual repository URL)
git clone <your-repository-url>
cd infinity-tech-platform

# Or if you have the project as a zip file
unzip infinity-tech-platform.zip
cd infinity-tech-platform
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# This will install both production and development dependencies including:
# - React, Express, TypeScript
# - Drizzle ORM, PostgreSQL drivers
# - UI libraries (Radix UI, Tailwind CSS)
# - Real-time libraries (WebSocket, Daily.co)
# - Authentication (JWT, bcrypt, Passport)
# - And 90+ other packages
```

**Note**: The installation may take 5-10 minutes depending on your internet connection.

---

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
# PostgreSQL connection string
# Format: postgresql://username:password@localhost:5432/database_name
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/infinity_tech_db

# ============================================
# AUTHENTICATION
# ============================================
# JWT secret for token generation (use a strong random string)
# Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# ============================================
# SERVER CONFIGURATION
# ============================================
# Application port (default: 5000)
PORT=5000

# Node environment (development or production)
NODE_ENV=development

# ============================================
# DAILY.CO VIDEO CONFERENCING
# ============================================
# Get your API key from: https://dashboard.daily.co/developers
DAILY_API_KEY=your_daily_api_key_here

# ============================================
# OPENAI AI INTEGRATION
# ============================================
# For AI meeting summaries
# Option 1: Direct OpenAI API
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-api-key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Option 2: Replit AI Integrations (if using Replit)
# These are automatically set on Replit, leave blank for local setup

# ============================================
# WEB PUSH NOTIFICATIONS
# ============================================
# Generate VAPID keys with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here

# ============================================
# GOOGLE DRIVE INTEGRATION (OPTIONAL)
# ============================================
# For Infinity Drive cloud sync feature
# These are typically managed through Replit integrations
# For local setup, you'll need to set up Google OAuth
REPLIT_CONNECTORS_HOSTNAME=https://connectors.replit.com
REPL_IDENTITY=your_repl_identity_token
WEB_REPL_RENEWAL=your_web_repl_renewal_token

# ============================================
# FILE STORAGE
# ============================================
# Local directory for file uploads
PRIVATE_OBJECT_DIR=./uploads
```

### 3. Generate Required Secrets

#### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Generate VAPID Keys for Push Notifications:
```bash
npx web-push generate-vapid-keys
```

Copy the output and add to your `.env` file.

---

## Database Setup

### 1. Start PostgreSQL Service

**macOS:**
```bash
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
PostgreSQL service should start automatically. If not, start it from Services.

### 2. Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE infinity_tech_db;

# Create user (optional, or use existing postgres user)
CREATE USER infinity_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE infinity_tech_db TO infinity_user;

# Exit psql
\q
```

### 3. Update DATABASE_URL

Update your `.env` file with the correct credentials:
```env
DATABASE_URL=postgresql://infinity_user:your_secure_password@localhost:5432/infinity_tech_db
```

### 4. Push Database Schema

This will create all necessary tables:

```bash
npm run db:push
```

**Expected output:**
```
✓ Pushing schema changes to database
✓ Created 15+ tables including:
  - users
  - conversations
  - messages
  - meetings
  - tasks
  - projects
  - files
  - todos
  - and more...
```

If you encounter data-loss warnings:
```bash
npm run db:push -- --force
```

**Note**: The application will automatically seed the database with:
- 1 Admin user (loginId: `admin`, password: `admin123`)
- 17 Demo users with various roles

---

## External Services Setup

### 1. Daily.co Setup (Video Conferencing)

**Required for video call features**

1. Visit: https://dashboard.daily.co/
2. Sign up for a free account
3. Go to "Developers" section
4. Copy your API key
5. Add to `.env`:
   ```env
   DAILY_API_KEY=your_daily_api_key_here
   ```

**Free Tier Limits**: 20 participants, 10 rooms

### 2. OpenAI Setup (AI Meeting Summaries)

**Optional, but recommended for AI features**

1. Visit: https://platform.openai.com/
2. Create an account
3. Go to API Keys section
4. Create a new API key
5. Add to `.env`:
   ```env
   AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-key-here
   ```

**Cost**: Pay-as-you-go, ~$0.01-0.03 per meeting summary

### 3. Google Drive Integration (Optional)

**For Infinity Drive cloud sync**

This is complex to set up locally as it's optimized for Replit. For local development:

1. Create a Google Cloud Project: https://console.cloud.google.com/
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Download credentials JSON
5. Implement OAuth flow (requires significant setup)

**Recommendation**: Skip this for local development unless specifically needed.

---

## Running the Application

### 1. Development Mode

Start the development server:

```bash
npm run dev
```

**What this does:**
- Starts Express backend server on port 5000
- Starts Vite frontend dev server with HMR
- Initializes WebSocket server for real-time features
- Seeds database with demo data (first run only)
- Starts reminder services for meetings/tasks

**Expected output:**
```
> rest-express@1.0.0 dev
> NODE_ENV=development tsx server/index.ts

[WebPush] VAPID keys configured
[express] serving on port 5000
[SEED] ℹ️  Database already initialized with 18 user(s)
[SEED] ✓ Admin account verified successfully
[express] Database initialized
[MeetingReminder] Started with 1 minute interval
[TaskReminder] Started with 60 minute interval
[TodoReminder] Started with 60 minute interval
```

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

**Default Admin Credentials:**
- Login ID: `admin`
- Password: `admin123`

**Demo User Credentials:**
- Login IDs: `sneha.desai`, `amit.sharma`, `priya.patel`, etc.
- Password: `password123` (for all demo users)

### 3. Production Build

Build the application for production:

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors

**Error:** `Error: DATABASE_URL, ensure the database is provisioned`

**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` is correct
- Test connection: `psql $DATABASE_URL`

#### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3000
```

#### 3. Module Not Found Errors

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. VAPID Keys Not Configured

**Warning:** `[WebPush] VAPID keys not configured`

**Solution:**
```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Add to .env file
```

#### 5. OpenAI API Errors

**Error:** `OpenAI API error: Invalid API key`

**Solution:**
- Verify your OpenAI API key is correct
- Check you have credits in your OpenAI account
- AI features will gracefully fail if not configured

#### 6. TypeScript Compilation Errors

**Solution:**
```bash
# Run type check
npm run check

# Build may still work even with warnings
```

#### 7. File Upload Issues

**Error:** Cannot save uploaded files

**Solution:**
```bash
# Create uploads directory
mkdir -p uploads

# Set permissions (Unix/Linux/macOS)
chmod 755 uploads
```

---

## Development Workflow

### Directory Structure

```
infinity-tech-platform/
├── client/                  # Frontend React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── ui/        # Shadcn UI components
│   │   ├── lib/           # Utilities and helpers
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database queries
│   ├── openai.ts          # AI integration
│   ├── googleDrive.ts     # Google Drive integration
│   └── index.ts           # Server entry point
├── shared/                # Shared code
│   └── schema.ts          # Database schema (Drizzle ORM)
├── uploads/               # File storage directory
├── .env                   # Environment variables
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── drizzle.config.ts      # Drizzle ORM configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Type checking
npm run check           # Run TypeScript type checking

# Database
npm run db:push         # Push schema changes to database
npm run db:push -- --force  # Force push (for data-loss warnings)

# Production
npm run build           # Build for production
npm start               # Start production server
```

### Making Database Changes

1. Edit `shared/schema.ts` to modify the database schema
2. Run `npm run db:push` to apply changes
3. **IMPORTANT**: Never manually write SQL migrations
4. Always use Drizzle ORM for schema changes

Example: Adding a new field
```typescript
// shared/schema.ts
export const users = pgTable("users", {
  // existing fields...
  phoneNumber: text("phone_number"), // Add new field
});
```

Then run:
```bash
npm run db:push
```

### Code Style and Guidelines

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI (shadcn/ui)
- **State Management**: TanStack React Query
- **Real-time**: WebSockets (ws library)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer

### Testing User Features

#### 1. Chat Messaging
- Login as two different users (in different browsers/incognito)
- Start a direct conversation
- Send messages, files, images
- Test real-time updates

#### 2. Video Calls
- Requires DAILY_API_KEY to be configured
- Click video call icon in chat
- Join meeting from another user

#### 3. Meetings Calendar
- Navigate to Calendar
- Create a meeting
- AI summary requires OpenAI API key

#### 4. Tasks Management
- Navigate to Tasks
- Create, assign, and track tasks
- Test reminder system

#### 5. Projects Dashboard
- Navigate to Projects
- Create project with team members
- Track progress

#### 6. File Storage (Infinity Drive)
- Navigate to Infinity Drive
- Upload files locally
- Google Drive sync requires additional setup

---

## Additional Configuration

### Email Configuration (Future Enhancement)

Currently, the system uses in-app notifications. To add email support:

1. Choose an email service (SendGrid, Mailgun, AWS SES)
2. Install nodemailer: `npm install nodemailer`
3. Configure SMTP settings in `.env`
4. Update reminder services to send emails

### Custom Domain (Local Development)

To test with a custom local domain:

1. Edit `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows)
2. Add: `127.0.0.1 infinity.local`
3. Access at: `http://infinity.local:5000`

### SSL/HTTPS for Local Development

```bash
# Install mkcert
brew install mkcert  # macOS
# or follow: https://github.com/FiloSottile/mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Update server to use HTTPS (requires code changes)
```

---

## Security Best Practices

### For Local Development

1. **Never commit `.env` file** to version control
2. Use strong JWT_SECRET in production
3. Change default admin password immediately
4. Keep dependencies updated: `npm audit fix`
5. Use HTTPS in production
6. Implement rate limiting for API endpoints
7. Validate all user inputs
8. Sanitize file uploads

### Production Deployment Checklist

- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Use strong database passwords
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable database connection pooling
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Implement rate limiting
- [ ] Review and update security headers

---

## Getting Help

### Resources

- **Project Documentation**: Check `replit.md` for architecture details
- **Database Schema**: Review `shared/schema.ts`
- **API Routes**: Check `server/routes.ts`

### Common Questions

**Q: Can I use a different database?**
A: The project is built for PostgreSQL. Switching to MySQL/MongoDB requires significant changes.

**Q: How do I add more users?**
A: Use the Admin panel → User Management, or directly via API.

**Q: Can I disable AI features?**
A: Yes, simply don't configure the OpenAI API key. Features will gracefully degrade.

**Q: How do I backup the database?**
```bash
pg_dump -U postgres infinity_tech_db > backup.sql
```

**Q: How do I restore from backup?**
```bash
psql -U postgres infinity_tech_db < backup.sql
```

---

## Company Information

**Infinity Technology**
- Location: J-446 Off Anukul Circle MIDC Bhosari Pune-411026
- Working Hours: Monday-Saturday, 9:00 AM - 7:00 PM
- Industry: Technology & Communication Solutions

---

## License

This project is proprietary software developed for Infinity Technology internal use.

---

## Version Information

- **Platform Version**: 1.0.0
- **Node.js**: >=20.x
- **PostgreSQL**: >=14.x
- **Last Updated**: November 2025

---

## Changelog

### Version 1.0.0 (Initial Release)
- Core messaging and chat features
- Video conferencing integration (Daily.co)
- Meeting calendar with AI summaries
- Task management system
- Project tracking dashboard
- File storage and Google Drive sync
- Web push notifications
- User management and authentication
- Daily work logs and to-do lists
- Performance analytics dashboard

---

**Setup Complete!** 🚀

You should now have a fully functional local development environment. Start the development server with `npm run dev` and access the application at `http://localhost:5000`.

For production deployment guidance, please contact the development team.
