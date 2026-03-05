#!/bin/bash

# Test if functions are already deployed and working

echo "🔍 Testing Ekko Edge Functions Status..."
echo "======================================="

# Configuration from environment
PROJECT_REF="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"
ANON_KEY="${SUPABASE_ANON_KEY:?Please set SUPABASE_ANON_KEY}"
BASE_URL="https://$PROJECT_REF.supabase.co/functions/v1"

echo "🌐 Testing endpoint: $BASE_URL"
echo ""

# Test each function
test_function() {
    local FUNCTION_NAME=$1
    local TEST_DATA=$2
    
    echo "📡 Testing $FUNCTION_NAME..."
    
    # Make request and capture both body and status code
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/$FUNCTION_NAME" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "$TEST_DATA" 2>/dev/null)
    
    # Extract status code (last line) and body (everything else)
    STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo "  ✅ Function is deployed and working! (HTTP $STATUS_CODE)"
        if [ "$FUNCTION_NAME" = "voice-speak" ]; then
            echo "  💾 Saving audio as test-$FUNCTION_NAME.mp3"
            curl -s -X POST "$BASE_URL/$FUNCTION_NAME" \
                -H "Authorization: Bearer $ANON_KEY" \
                -H "Content-Type: application/json" \
                -d "$TEST_DATA" \
                --output "test-$FUNCTION_NAME.mp3" 2>/dev/null
        fi
    elif [ "$STATUS_CODE" = "404" ]; then
        echo "  ❌ Function not deployed (HTTP 404)"
    elif [ "$STATUS_CODE" = "401" ]; then
        echo "  ⚠️  Function deployed but authentication failed"
        echo "     This might mean the ELEVENLABS_API_KEY secret is not set"
    elif [ "$STATUS_CODE" = "500" ]; then
        echo "  ⚠️  Function deployed but encountered an error"
        echo "     Response: $BODY"
    else
        echo "  ❓ Unexpected status: HTTP $STATUS_CODE"
        echo "     Response: $BODY"
    fi
    echo ""
}

# Test all functions
test_function "voice-speak" '{"text":"테스트","voiceId":"Anna Kim"}'
test_function "conversation-ai" '{"message":"안녕하세요","topic":"daily-life","level":"beginner"}'
test_function "assessment-analyze" '{"questionId":"test","response":"안녕하세요","confidence":0.8,"questionIndex":0}'
test_function "assessment-complete" '{"responses":["test"],"conversationHistory":[]}'

echo "======================================="
echo "📊 Summary:"
echo ""
echo "If functions show 404: They need to be deployed"
echo "If functions show 500: They're deployed but secrets might be missing"
echo "If functions show 200: Everything is working!"
echo ""
echo "🎯 Next steps based on results above:"
echo ""
echo "1. If not deployed (404), use the Dashboard:"
echo "   https://app.supabase.com/project/$PROJECT_REF/functions"
echo ""
echo "2. If deployed but failing (500), set secrets:"
echo "   Go to Edge Functions > Settings > Secrets"
echo "   Add: ELEVENLABS_API_KEY = your_key"
echo ""
echo "3. If working (200), test in your app!"
echo ""
