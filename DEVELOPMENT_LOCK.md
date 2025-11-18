# Development Lock - Infinity Technology Platform

## Current Stable Version
**Lock Date:** November 14, 2025  
**Status:** ✅ Production Ready - All Features Working

## Critical Data Preservation Rules

### 🔒 MANDATORY REQUIREMENTS FOR ALL FUTURE UPDATES

1. **DATABASE SCHEMA CHANGES**
   - ❌ NEVER delete existing tables or columns
   - ❌ NEVER change primary key ID types (keep existing serial/varchar patterns)
   - ❌ NEVER modify existing column types that would break data
   - ✅ ONLY add new tables or columns (backward compatible)
   - ✅ Use `npm run db:push` or `npm run db:push --force` for schema sync
   - ✅ Test on staging clone with production data snapshot first

2. **DATA MIGRATION POLICY**
   - All schema changes must be additive (new columns/tables only)
   - Default values required for new columns to preserve existing records
   - Nullable columns preferred over required fields for backward compatibility
   - Migration testing mandatory on cloned database before production

3. **API BACKWARDS COMPATIBILITY**
   - Existing API endpoints must maintain current request/response structure
   - New fields can be added but existing fields cannot be removed
   - WebSocket message formats must remain compatible
   - Authentication flow must preserve current JWT structure

4. **FILE STORAGE INTEGRITY**
   - Never modify existing file paths in `uploads/` directory
   - Preserve all Google Drive sync metadata and IDs
   - Maintain folder structure and ownership validation

## Current Production State

### Database Tables (15+ tables)
- ✅ users - User accounts with role-based access
- ✅ conversations - Chat conversations (DM and group)
- ✅ conversationMembers - Conversation participants
- ✅ messages - All chat messages with replies
- ✅ pinnedConversations - User pinned chats
- ✅ meetings - Calendar events with Daily.co links
- ✅ meetingParticipants - Meeting attendees
- ✅ tasks - Task management with reminders
- ✅ projects - Project tracking with progress
- ✅ driveFolders - Infinity Drive folders
- ✅ driveFiles - File storage with Google Drive sync
- ✅ activeCallParticipants - Video call tracking
- ✅ missedCalls - Missed call notifications
- ✅ todos - Personal to-do lists
- ✅ pushSubscriptions - Web push notifications

### Database Indexes (25+ indexes)
All foreign keys and frequently-queried columns are indexed for ultra-fast performance.

### Core Features (All Working)
- ✅ Real-time chat with file sharing (up to 50MB)
- ✅ Video conferencing with Daily.co integration
- ✅ Meeting calendar with AI summaries (GPT-4o)
- ✅ Task management with Excel import/export
- ✅ Project tracking dashboard
- ✅ Performance analytics dashboard
- ✅ Infinity Drive with Google Drive sync
- ✅ Web Push Notifications (calls + messages)
- ✅ Admin user management
- ✅ Automated reminders (from Admin account)
- ✅ Message replies and deletion
- ✅ Presence tracking
- ✅ Daily work logging

### Performance Optimizations (Active)
- ✅ 25+ database indexes on all foreign keys
- ✅ React Query caching (5min staleTime, 10min gcTime)
- ✅ Message pagination (50-message default)
- ✅ Component memoization (ConversationItem)

## Testing Requirements for Future Updates

### Pre-Deployment Checklist
- [ ] All existing features tested and working
- [ ] Database migration tested on staging clone
- [ ] Backward compatibility verified
- [ ] No data loss confirmed
- [ ] Performance benchmarks maintained
- [ ] WebSocket connections stable
- [ ] File upload/download working
- [ ] Google Drive sync operational
- [ ] Daily.co video calls functional
- [ ] Push notifications delivering

### Rollback Plan
- Maintain database backups before any schema changes
- Keep previous deployment version tagged in Git
- Document rollback steps for each major change
- Test rollback procedure on staging

## Integration Dependencies

### External Services (Must Remain Compatible)
- **Neon PostgreSQL** - Production database
- **Daily.co API** - Video conferencing
- **OpenAI API** - AI meeting summaries
- **Google Drive API** - File sync
- **Web Push Service** - Notifications

### Environment Variables (Required)
```
DATABASE_URL
DAILY_API_KEY
SESSION_SECRET
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

## Code Quality Standards

### Protected Files (Critical - Modify with Extreme Caution)
- `shared/schema.ts` - Database schema definition
- `server/storage.ts` - Data access layer
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Database initialization
- `server/auth.ts` - Authentication logic

### Review Requirements
- Schema changes: Architect review + staging test
- API changes: Backward compatibility check
- Storage changes: Data preservation verification
- Integration changes: Service contract validation

## Deployment Safety

### Before Deploying Updates
1. Create Git tag for current stable version
2. Backup production database
3. Test migration on staging clone with real data
4. Run full regression test suite
5. Verify all integrations operational
6. Document rollback procedure

### After Deploying Updates
1. Monitor application logs for errors
2. Check database performance metrics
3. Verify WebSocket connections stable
4. Test critical user flows
5. Confirm integrations working
6. Monitor notification delivery

## Emergency Contacts

### If Something Breaks
1. Check application logs: `/tmp/logs/`
2. Review database connections
3. Verify external service status
4. Test rollback procedure if needed

## Version History

### v1.0 - Stable Production Release (Nov 14, 2025)
- All core features operational
- Performance optimizations complete
- 25+ database indexes active
- Admin-based reminder system
- Ultra-fast response times achieved

---

**REMEMBER:** The platform is working perfectly right now. Any changes must preserve this stable state and all existing data. When in doubt, test on staging first!
