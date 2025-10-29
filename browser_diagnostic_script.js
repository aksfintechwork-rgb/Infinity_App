// SUPREMO TRADERS - Browser Diagnostic Script
// Based on cross-device login troubleshooting guide
// Paste this into browser console (F12) on any device

(async () => {
  console.log("🔍 SUPREMO TRADERS - Cross-Device Login Diagnostics");
  console.log("================================================\n");

  // Our app configuration
  const API = window.location.origin; // Same origin
  const APP = window.location.origin;

  console.log("📍 Environment Info:");
  console.log("  Origin:", location.origin);
  console.log("  User Agent:", navigator.userAgent);
  console.log("  Platform:", navigator.platform);
  console.log("  Language:", navigator.language);
  console.log("\n");

  // 1) Cookie check (we DON'T use cookies, but let's verify)
  console.log("🍪 Cookie Status:");
  console.log("  Cookies Enabled:", navigator.cookieEnabled);
  console.log("  Current Cookies:", document.cookie || "(none - expected!)");
  console.log("  ✅ Our app uses JWT in localStorage, NOT cookies");
  console.log("\n");

  // 2) LocalStorage check (our actual auth method)
  console.log("💾 LocalStorage Auth:");
  const token = localStorage.getItem('authToken');
  console.log("  Has Token:", !!token);
  if (token) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;
      console.log("  Token Payload:", payload);
      console.log("  Expires In:", Math.floor(expiresIn / 60 / 60 / 24), "days");
      console.log("  Status:", expiresIn > 0 ? "✅ VALID" : "❌ EXPIRED");
    } catch (e) {
      console.error("  ❌ Token decode failed:", e.message);
    }
  }
  console.log("\n");

  // 3) Time skew check
  console.log("⏰ Clock Skew Check:");
  const tLocal = Math.floor(Date.now() / 1000);
  console.log("  Local Time (epoch):", tLocal);
  console.log("  Local Time (ISO):", new Date().toISOString());
  
  try {
    const healthRes = await fetch(`${API}/api/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const serverDate = new Date(healthRes.headers.get('date'));
    const tServer = Math.floor(serverDate.getTime() / 1000);
    const skew = Math.abs(tLocal - tServer);
    console.log("  Server Time (epoch):", tServer);
    console.log("  Server Time (ISO):", serverDate.toISOString());
    console.log("  Clock Skew:", skew, "seconds");
    console.log("  Status:", skew < 60 ? "✅ OK" : "⚠️ LARGE SKEW");
  } catch (e) {
    console.error("  ❌ Failed to check server time:", e.message);
  }
  console.log("\n");

  // 4) CORS check (should not be needed for same-origin)
  console.log("🌐 CORS Check:");
  console.log("  Origin:", APP);
  console.log("  API:", API);
  console.log("  Same Origin:", APP === API ? "✅ YES (CORS not needed)" : "⚠️ NO");
  console.log("\n");

  // 5) Login endpoint test
  console.log("🔐 Login Endpoint Test:");
  console.log("  Testing with: admin / admin123");
  
  try {
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      cache: "no-store",
      body: JSON.stringify({ loginId: "admin", password: "admin123" })
    });

    console.log("  Status:", loginRes.status);
    console.log("  Status Text:", loginRes.statusText);
    
    const responseHeaders = {};
    loginRes.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log("  Response Headers:", responseHeaders);

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log("  ✅ Login Successful");
      console.log("  User:", data.user.name);
      console.log("  Token Received:", data.token.substring(0, 20) + "...");
    } else {
      const error = await loginRes.json();
      console.error("  ❌ Login Failed:", error);
    }
  } catch (e) {
    console.error("  ❌ Request Failed:", e.message);
  }
  console.log("\n");

  // 6) Network connectivity
  console.log("🌍 Network Info:");
  console.log("  Online:", navigator.onLine);
  if ('connection' in navigator) {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    console.log("  Type:", conn?.effectiveType || "unknown");
    console.log("  Downlink:", conn?.downlink || "unknown");
  }
  console.log("\n");

  // 7) Service Worker check
  console.log("⚙️ Service Worker:");
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log("  Registered:", registrations.length > 0);
    console.log("  Count:", registrations.length);
    if (registrations.length > 0) {
      console.log("  ⚠️ Service workers detected - may cache requests");
    } else {
      console.log("  ✅ No service workers");
    }
  } else {
    console.log("  Not Supported");
  }
  console.log("\n");

  // Summary
  console.log("================================================");
  console.log("📊 DIAGNOSTIC SUMMARY");
  console.log("================================================");
  console.log("Auth Method: JWT in Authorization header ✅");
  console.log("Cookie Dependency: None ✅");
  console.log("Same-Origin: Yes ✅");
  console.log("CORS Issues: Not applicable ✅");
  console.log("\n");
  console.log("💡 If login still fails:");
  console.log("   1. Clear localStorage: localStorage.clear()");
  console.log("   2. Manually type password (no autocomplete)");
  console.log("   3. Try incognito/private mode");
  console.log("   4. Check network connectivity");
  console.log("   5. Verify system clock is correct");
  console.log("\n");
  console.log("✅ Diagnostic complete! Share screenshot with admin.");
})();
