import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

interface UserCredential {
  name: string;
  loginId: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

const usersToCreate: UserCredential[] = [
  // 2 Admin Users
  { name: "Rajesh Kumar", loginId: "admin_rajesh", email: "rajesh.kumar@infinitytechnology.com", password: "admin123", role: "admin" },
  { name: "Priya Sharma", loginId: "admin_priya", email: "priya.sharma@infinitytechnology.com", password: "admin123", role: "admin" },
  
  // 10 Employee Users
  { name: "Amit Patel", loginId: "amit.patel", email: "amit.patel@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Sneha Desai", loginId: "sneha.desai", email: "sneha.desai@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Vikram Singh", loginId: "vikram.singh", email: "vikram.singh@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Anjali Rao", loginId: "anjali.rao", email: "anjali.rao@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Karan Mehta", loginId: "karan.mehta", email: "karan.mehta@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Pooja Gupta", loginId: "pooja.gupta", email: "pooja.gupta@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Rahul Verma", loginId: "rahul.verma", email: "rahul.verma@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Neha Joshi", loginId: "neha.joshi", email: "neha.joshi@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Arjun Nair", loginId: "arjun.nair", email: "arjun.nair@infinitytechnology.com", password: "user123", role: "user" },
  { name: "Divya Iyer", loginId: "divya.iyer", email: "divya.iyer@infinitytechnology.com", password: "user123", role: "user" },
];

async function createUsers() {
  console.log("Starting user creation...\n");
  
  const created: UserCredential[] = [];
  const skipped: string[] = [];
  
  for (const user of usersToCreate) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByLoginId(user.loginId);
      if (existingUser) {
        console.log(`⏭️  Skipped: ${user.name} (${user.loginId}) - already exists`);
        skipped.push(user.loginId);
        continue;
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(user.password);
      await storage.createUser({
        name: user.name,
        loginId: user.loginId,
        email: user.email,
        password: hashedPassword,
        role: user.role
      });
      
      console.log(`✅ Created: ${user.name} (${user.loginId}) - ${user.role.toUpperCase()}`);
      created.push(user);
    } catch (error: any) {
      console.error(`❌ Failed to create ${user.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created.length} users`);
  console.log(`   Skipped: ${skipped.length} users (already exist)`);
  console.log(`   Failed: ${usersToCreate.length - created.length - skipped.length} users`);
  
  // Generate markdown output
  let markdown = `# Infinity Technology - User Credentials\n\n`;
  markdown += `**Created:** ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  
  // Admin users
  markdown += `## Admin Users (${created.filter(u => u.role === 'admin').length + 1})\n\n`;
  markdown += `| Name | Login ID | Password | Email |\n`;
  markdown += `|------|----------|----------|-------|\n`;
  markdown += `| Admin User | admin | admin123 | admin@infinitytechnology.com |\n`;
  created.filter(u => u.role === 'admin').forEach(u => {
    markdown += `| ${u.name} | ${u.loginId} | ${u.password} | ${u.email} |\n`;
  });
  
  markdown += `\n---\n\n`;
  
  // Employee users
  markdown += `## Employee Users (${created.filter(u => u.role === 'user').length})\n\n`;
  markdown += `| Name | Login ID | Password | Email |\n`;
  markdown += `|------|----------|----------|-------|\n`;
  created.filter(u => u.role === 'user').forEach(u => {
    markdown += `| ${u.name} | ${u.loginId} | ${u.password} | ${u.email} |\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `## Notes\n\n`;
  markdown += `- All admin passwords are set to: **admin123**\n`;
  markdown += `- All employee passwords are set to: **user123**\n`;
  markdown += `- Users can change their passwords after first login from the user menu\n`;
  markdown += `- Keep this file secure and do not share publicly\n`;
  
  // Write to file
  const fs = await import('fs/promises');
  await fs.writeFile('USER_CREDENTIALS.md', markdown);
  console.log(`\n📄 Credentials saved to: USER_CREDENTIALS.md`);
}

createUsers().then(() => {
  console.log("\n✅ User creation completed!");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
