import { storage } from "./storage";
import { hashPassword } from "./auth";

/**
 * Initialize the database with default admin user if database is empty.
 * This runs automatically on server startup.
 */
export async function initializeDatabase() {
  try {
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      console.log("[SEED] 🌱 Database is empty. Creating initial admin user...");
      
      const hashedPassword = await hashPassword("admin123");
      const adminUser = await storage.createUser({
        name: "Admin User",
        loginId: "admin",
        email: "admin@supremotraders.com",
        password: hashedPassword,
        role: "admin"
      });
      
      console.log(`[SEED] ✅ Initial admin user created successfully!`);
      console.log(`[SEED] 📝 Login credentials: admin / admin123`);
      console.log(`[SEED] 🔑 You can now login and create additional users from the Admin Panel`);
      
      return adminUser;
    } else {
      console.log(`[SEED] ℹ️  Database already initialized with ${users.length} user(s)`);
      return null;
    }
  } catch (error: any) {
    console.error("[SEED] ❌ Database initialization failed:", error.message);
    // Don't throw - let the server continue even if seeding fails
    return null;
  }
}
