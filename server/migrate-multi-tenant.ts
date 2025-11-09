import { db } from "./db";
import { companies, users, conversations, conversationMembers, pinnedConversations, conversationReadStatus, messages, meetings, meetingParticipants, tasks, taskSupportRequests, dailyWorksheets, projects, driveFolders, driveFiles, activeCalls, activeCallParticipants, todos, pushSubscriptions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Multi-Tenant Migration Script
 * 
 * This script migrates the existing single-tenant SUPREMO data to a multi-tenant architecture:
 * 1. Creates the default SUPREMO company
 * 2. Backfills companyId for all existing records
 * 3. Creates the super_admin user for managing multiple companies
 */

async function migrateToMultiTenant() {
  console.log("🚀 Starting multi-tenant migration...\n");

  try {
    // Step 1: Create the default SUPREMO TRADERS company
    console.log("Step 1: Creating SUPREMO TRADERS company...");
    const [supremoCompany] = await db
      .insert(companies)
      .values({
        name: "SUPREMO TRADERS LLP",
        subdomain: "supremo",
        logo: null,
        primaryColor: "#C54E1F", // Orange/coral primary color
        backgroundColor: "#F5F0E8", // Warm beige background
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!supremoCompany) {
      // Company already exists, fetch it
      const existing = await db
        .select()
        .from(companies)
        .where(eq(companies.subdomain, "supremo"))
        .limit(1);
      
      if (existing.length === 0) {
        throw new Error("Failed to create or find SUPREMO company");
      }
      
      console.log(`✅ SUPREMO company already exists (ID: ${existing[0].id})\n`);
      var companyId = existing[0].id;
    } else {
      console.log(`✅ Created SUPREMO company (ID: ${supremoCompany.id})\n`);
      var companyId = supremoCompany.id;
    }

    // Step 2: Backfill companyId for all existing records
    // Note: Neon HTTP driver doesn't support transactions, so we run sequentially
    console.log("Step 2: Backfilling companyId for existing data...");
    
    const tablesToUpdate = [
      { table: users, name: "users" },
      { table: conversations, name: "conversations" },
      { table: conversationMembers, name: "conversationMembers" },
      { table: pinnedConversations, name: "pinnedConversations" },
      { table: conversationReadStatus, name: "conversationReadStatus" },
      { table: messages, name: "messages" },
      { table: meetings, name: "meetings" },
      { table: meetingParticipants, name: "meetingParticipants" },
      { table: tasks, name: "tasks" },
      { table: taskSupportRequests, name: "taskSupportRequests" },
      { table: dailyWorksheets, name: "dailyWorksheets" },
      { table: projects, name: "projects" },
      { table: driveFolders, name: "driveFolders" },
      { table: driveFiles, name: "driveFiles" },
      { table: activeCalls, name: "activeCalls" },
      { table: activeCallParticipants, name: "activeCallParticipants" },
      { table: todos, name: "todos" },
      { table: pushSubscriptions, name: "pushSubscriptions" },
    ];

    for (const { table, name } of tablesToUpdate) {
      // Update all records that don't have a companyId yet
      await db
        .update(table)
        .set({ companyId })
        .where(sql`${table.companyId} IS NULL`);
      
      console.log(`  ✓ Updated ${name}`);
    }
    
    console.log("✅ Backfill completed\n");

    // Step 3: Create super_admin user if it doesn't exist
    console.log("Step 3: Creating super_admin user...");
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("superadmin123", 10);
    
    try {
      const [superAdmin] = await db
        .insert(users)
        .values({
          name: "Super Admin",
          loginId: "superadmin",
          email: "superadmin@multitenantapp.com",
          password: hashedPassword,
          role: "super_admin",
          companyId: null, // Super admin is company-agnostic
        })
        .onConflictDoNothing()
        .returning();

      if (superAdmin) {
        console.log(`✅ Created super_admin user (loginId: superadmin, password: superadmin123)\n`);
      } else {
        console.log(`✅ super_admin user already exists\n`);
      }
    } catch (error) {
      console.log(`⚠ Could not create super_admin:`, (error as Error).message);
    }

    console.log("🎉 Migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Company: ${supremoCompany?.name || "SUPREMO TRADERS LLP"} (ID: ${companyId})`);
    console.log(`   - All existing data assigned to SUPREMO company`);
    console.log(`   - Super admin credentials: superadmin / superadmin123`);
    console.log("\n✨ You can now create new companies and manage the multi-tenant platform!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateToMultiTenant()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
