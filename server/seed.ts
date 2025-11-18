import { storage } from "./storage";
import { hashPassword, comparePassword } from "./auth";

/**
 * Initialize the database with default admin user if database is empty.
 * Also verifies and heals the admin password to ensure it's always "admin123".
 * This runs automatically on server startup.
 */
export async function initializeDatabase() {
  try {
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      // Database is empty - create initial admin user
      console.log("[SEED] 🌱 Database is empty. Creating initial admin user...");
      
      const hashedPassword = await hashPassword("admin123");
      const adminUser = await storage.createUser({
        name: "Admin User",
        loginId: "admin",
        email: "admin@infinitysolutions.com",
        password: hashedPassword,
        role: "admin"
      });
      
      console.log(`[SEED] ✅ Initial admin user created successfully!`);
      console.log(`[SEED] 📝 Login credentials: admin / admin123`);
      console.log(`[SEED] 🔑 You can now login and create additional users from the Admin Panel`);
      
      return adminUser;
    } else {
      // Database has users - verify admin account exists and has correct password
      console.log(`[SEED] ℹ️  Database already initialized with ${users.length} user(s)`);
      
      const adminUser = await storage.getUserByLoginId("admin");
      
      if (!adminUser) {
        // Admin doesn't exist - create it
        console.log("[SEED] ⚠️  Admin user not found. Creating admin user...");
        const hashedPassword = await hashPassword("admin123");
        const newAdmin = await storage.createUser({
          name: "Admin User",
          loginId: "admin",
          email: "admin@infinitysolutions.com",
          password: hashedPassword,
          role: "admin"
        });
        console.log(`[SEED] ✅ Admin user created. Login with: admin / admin123`);
        return newAdmin;
      } else {
        // Admin exists - verify password is correct
        const passwordMatches = await comparePassword("admin123", adminUser.password);
        
        if (!passwordMatches) {
          // Password is wrong - heal it
          console.log("[SEED] 🔧 Admin password mismatch detected. Healing admin password...");
          const hashedPassword = await hashPassword("admin123");
          await storage.updateUserPassword(adminUser.id, hashedPassword);
          console.log(`[SEED] ✅ Admin password restored to default: admin123`);
          console.log(`[SEED] 🔒 IMPORTANT: Please change the admin password after login for security!`);
        } else {
          console.log(`[SEED] ✓ Admin account verified successfully`);
        }
        return null;
      }
    }
  } catch (error: any) {
    console.error("[SEED] ❌ Database initialization failed:", error.message);
    // Don't throw - let the server continue even if seeding fails
    return null;
  }
}
