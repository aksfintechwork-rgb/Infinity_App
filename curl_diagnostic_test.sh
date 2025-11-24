#!/bin/bash
# SUPREMO TRADERS - Server-Side Diagnostic Script
# Based on cross-device login troubleshooting guide

echo "========================================"
echo "🔍 SUPREMO TRADERS - Server Diagnostics"
echo "========================================"
echo ""

API_URL="http://localhost:5000"

echo "1️⃣ Connectivity & Health Check"
echo "----------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  "$API_URL/api/auth/me" \
  -H "Authorization: Bearer dummy" || echo "Failed"
echo ""

echo "2️⃣ CORS Headers Check (simulated browser)"
echo "----------------------------------------"
curl -i "$API_URL/api/auth/login" \
  -H "Origin: http://localhost:5000" \
  -H "Content-Type: application/json" \
  --data '{"loginId":"admin","password":"admin123"}' 2>&1 | grep -E "(HTTP|Access-Control|Cache-Control|Set-Cookie)" || echo "No CORS headers (expected for same-origin)"
echo ""

echo "3️⃣ Preflight OPTIONS Check"
echo "----------------------------------------"
curl -i -X OPTIONS "$API_URL/api/auth/login" \
  -H "Origin: http://localhost:5000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>&1 | head -15
echo ""

echo "4️⃣ Login Test (admin)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  --data '{"loginId":"admin","password":"admin123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status: $HTTP_CODE OK"
  echo "Response: $BODY" | head -c 200
  echo "..."
else
  echo "❌ Status: $HTTP_CODE FAILED"
  echo "Response: $BODY"
fi
echo ""

echo "5️⃣ Test with Token"
echo "----------------------------------------"
TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo "Token received: ${TOKEN:0:30}..."
  curl -s "$API_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" | head -c 200
  echo "..."
else
  echo "❌ No token received"
fi
echo ""

echo "========================================"
echo "✅ Server diagnostic complete!"
echo "========================================"
