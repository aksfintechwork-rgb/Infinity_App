#!/bin/bash

# Multi-Tenant Migration Runner
# This script safely migrates the application to multi-tenant architecture in two phases

set -e  # Exit on any error

echo "🚀 Starting Multi-Tenant Migration Process"
echo "==========================================="
echo ""

# Phase 1: Add nullable companyId columns
echo "📋 PHASE 1: Adding nullable companyId columns..."
echo "- This allows existing data to have NULL companyId temporarily"
npm run db:push --force
echo "✅ Phase 1 complete: Nullable companyId columns added"
echo ""

# Phase 2: Backfill data
echo "📋 PHASE 2: Backfilling companyId for all existing data..."
echo "- Creating SUPREMO company"
echo "- Assigning all existing records to SUPREMO"
echo "- Creating super_admin user"
tsx server/migrate-multi-tenant.ts
echo "✅ Phase 2 complete: All data backfilled"
echo ""

# Phase 3: Enforce NOT NULL (requires manual schema update + push)
echo "📋 PHASE 3: Manual step required"
echo "⚠️  Next steps:"
echo "   1. Uncomment the .notNull() calls in shared/schema.ts"
echo "   2. Run 'npm run db:push --force' to enforce NOT NULL constraints"
echo ""

echo "🎉 Migration phases 1-2 completed successfully!"
echo "   Please complete Phase 3 manually as described above."
