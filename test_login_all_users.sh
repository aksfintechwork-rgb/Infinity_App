#!/bin/bash
# Comprehensive Login Test Script for All Users
# Tests all 7 user accounts with their standard passwords

API_URL="http://localhost:5000/api/auth/login"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="login_test_results_${TIMESTAMP}.log"

echo "========================================" | tee -a "$LOG_FILE"
echo "SUPREMO TRADERS LOGIN TEST SUITE" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Test credentials array
declare -a users=(
  "admin:admin123:Admin User:admin"
  "user:user123:Regular User:user"
  "Shubham:shubham123:Shubham Khamitker:user"
  "Ravi:ravi123:Ravi Mule:user"
  "atul:atul123:Atul:user"
  "Pratik:pratik123:Pratik:user"
  "testuser:test123:Test Employee:user"
)

SUCCESS=0
FAILED=0

for user_data in "${users[@]}"; do
  IFS=':' read -r loginId password expectedName expectedRole <<< "$user_data"
  
  echo "Testing: $loginId" | tee -a "$LOG_FILE"
  echo "----------------------------------------" | tee -a "$LOG_FILE"
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:5000" \
    --data "{\"loginId\":\"$loginId\",\"password\":\"$password\"}")
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS - HTTP $http_code" | tee -a "$LOG_FILE"
    echo "   Response: $body" | tee -a "$LOG_FILE"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "❌ FAILED - HTTP $http_code" | tee -a "$LOG_FILE"
    echo "   LoginID: $loginId" | tee -a "$LOG_FILE"
    echo "   Password Length: ${#password}" | tee -a "$LOG_FILE"
    echo "   Response: $body" | tee -a "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi
  
  echo "" | tee -a "$LOG_FILE"
done

echo "========================================" | tee -a "$LOG_FILE"
echo "TEST SUMMARY" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "✅ Successful: $SUCCESS" | tee -a "$LOG_FILE"
echo "❌ Failed: $FAILED" | tee -a "$LOG_FILE"
echo "Total Tests: $((SUCCESS + FAILED))" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Completed: $(date)" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"

if [ $FAILED -eq 0 ]; then
  echo "" | tee -a "$LOG_FILE"
  echo "🎉 ALL TESTS PASSED! Server is fully operational." | tee -a "$LOG_FILE"
  exit 0
else
  echo "" | tee -a "$LOG_FILE"
  echo "⚠️  Some tests failed. Check log for details." | tee -a "$LOG_FILE"
  exit 1
fi
