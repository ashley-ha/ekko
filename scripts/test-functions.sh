#!/bin/bash

# Test all Ekko Edge Functions

echo "🧪 Testing Ekko Edge Functions..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project details from environment
PROJECT_ID="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"
ANON_KEY="${SUPABASE_ANON_KEY:?Please set SUPABASE_ANON_KEY}"
BASE_URL="https://$PROJECT_ID.supabase.co/functions/v1"

# Test function
test_function() {
    local func_name=$1
    local data=$2
    local description=$3
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Function: $func_name"
    echo "Request: $data"
    
    response=$(curl -s -X POST "$BASE_URL/$func_name" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
        
        # Pretty print JSON if jq is available
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
}

# 1. Test voice synthesis
test_function "voice-speak" \
    '{"text": "안녕하세요! 반갑습니다.", "voiceId": "Anna Kim"}' \
    "Voice Synthesis (Korean greeting)"

# Save audio file if successful
if [ "$http_code" -eq 200 ]; then
    echo "Saving audio file..."
    curl -s -X POST "$BASE_URL/voice-speak" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"text": "안녕하세요! 반갑습니다.", "voiceId": "Anna Kim"}' \
        --output test-voice.mp3
    echo -e "${GREEN}Audio saved as test-voice.mp3${NC}"
fi

# 2. Test conversation AI
test_function "conversation-ai" \
    '{"message": "저는 한국 음식을 좋아해요", "topic": "food", "level": "beginner"}' \
    "Conversation AI (Food topic)"

# 3. Test assessment analysis
test_function "assessment-analyze" \
    '{"questionId": "greeting", "response": "안녕하세요, 저는 존입니다", "confidence": 0.85, "questionIndex": 0}' \
    "Assessment Analysis (Greeting response)"

# 4. Test assessment completion
test_function "assessment-complete" \
    '{
        "responses": ["안녕하세요", "좋아요", "하나, 둘, 셋"],
        "conversationHistory": [
            {
                "question": {"korean": "안녕하세요!", "english": "Hello!"},
                "response": "안녕하세요"
            }
        ]
    }' \
    "Assessment Completion"

echo -e "\n================================"
echo "🎯 Testing complete!"
echo ""
echo "Next steps:"
echo "1. Check if audio file was created: ls -la test-voice.mp3"
echo "2. Play the audio file: open test-voice.mp3"
echo "3. Check function logs: supabase functions logs voice-speak --tail"
echo ""
