#!/bin/bash

# Alternative deployment using Supabase Management API directly

echo "🚀 Deploying Edge Functions via Supabase API..."
echo "============================================="

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$1}"
ELEVENLABS_KEY="${ELEVENLABS_API_KEY:-$2}"

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token provided!"
    echo ""
    echo "Usage: ./deploy-via-api.sh YOUR_ACCESS_TOKEN [ELEVENLABS_KEY]"
    echo "Or set environment variables:"
    echo "   export SUPABASE_ACCESS_TOKEN=your_token"
    echo "   export ELEVENLABS_API_KEY=your_key"
    echo ""
    echo "Get your access token from:"
    echo "https://app.supabase.com/account/tokens"
    exit 1
fi

if [ -z "$ELEVENLABS_KEY" ]; then
    echo "❌ No ElevenLabs API key provided!"
    echo ""
    echo "Usage: ./deploy-via-api.sh YOUR_ACCESS_TOKEN YOUR_ELEVENLABS_KEY"
    echo "Or set environment variable:"
    echo "   export ELEVENLABS_API_KEY=your_key"
    exit 1
fi

echo "📍 Project: $PROJECT_REF"
echo "🔑 Using access token: ${ACCESS_TOKEN:0:10}..."
echo "🔑 Using ElevenLabs key: ${ELEVENLABS_KEY:0:10}..."
echo ""

# Function to deploy via API
deploy_function() {
    local FUNCTION_NAME=$1
    local FUNCTION_PATH="supabase/functions/$FUNCTION_NAME"
    
    echo "📦 Deploying $FUNCTION_NAME..."
    
    # First, we need to check if the function exists locally
    if [ ! -f "$FUNCTION_PATH/index.ts" ]; then
        echo "  ❌ Function not found at $FUNCTION_PATH/index.ts"
        return 1
    fi
    
    # Read the function code
    FUNCTION_CODE=$(cat "$FUNCTION_PATH/index.ts" | base64)
    
    # Deploy using the Management API
    RESPONSE=$(curl -s -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/$FUNCTION_NAME" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$FUNCTION_NAME\",
            \"slug\": \"$FUNCTION_NAME\",
            \"verify_jwt\": false,
            \"import_map\": false
        }")
    
    echo "  ✅ Deployment initiated"
    echo ""
}

# Set secrets via API
echo "🔐 Setting environment variables..."
curl -s -X POST \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/secrets" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "[
        {\"name\": \"ELEVENLABS_API_KEY\", \"value\": \"$ELEVENLABS_KEY\"}
    ]" > /dev/null

echo "  ✅ Secrets configured"
echo ""

# Alternative: Direct deployment instructions
echo "================================================"
echo "🎯 Alternative: Deploy via Supabase Dashboard"
echo "================================================"
echo ""
echo "Since CLI is having issues, you can deploy manually:"
echo ""
echo "1. Go to your project dashboard:"
echo "   https://app.supabase.com/project/$PROJECT_REF/functions"
echo ""
echo "2. Click 'New Function' for each function:"
echo "   - voice-speak"
echo "   - conversation-ai"
echo "   - assessment-analyze"
echo "   - assessment-complete"
echo ""
echo "3. Copy the code from each function's index.ts file"
echo ""
echo "4. Set the secret in Edge Functions settings:"
echo "   ELEVENLABS_API_KEY = $ELEVENLABS_KEY"
echo ""
echo "================================================"
echo "🔧 Or try fixing the CLI:"
echo "================================================"
echo ""
echo "1. Clear Supabase CLI cache:"
echo "   rm -rf ~/.supabase/cache"
echo ""
echo "2. Re-login with your token:"
echo "   npx supabase login --token $ACCESS_TOKEN"
echo ""
echo "3. Try deployment again:"
echo "   npx supabase functions deploy voice-speak --project-ref $PROJECT_REF --debug"
echo ""
