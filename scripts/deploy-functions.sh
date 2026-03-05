#!/bin/bash

# Deploy all Supabase Edge Functions for Ekko

echo "🚀 Deploying Ekko Edge Functions..."
echo "================================"

# Check if logged in to Supabase
if ! npx supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run: npx supabase login"
    exit 1
fi

# Get project ID from environment
PROJECT_ID="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"

echo "📍 Deploying to project: $PROJECT_ID"
echo ""

# Check for required environment variables
echo "🔍 Checking environment variables..."

# Set the ElevenLabs API key if provided as argument
if [ ! -z "$1" ]; then
    echo "🔑 Setting ElevenLabs API key..."
    npx supabase secrets set ELEVENLABS_API_KEY=$1 --project-ref $PROJECT_ID
else
    echo "ℹ️  No ElevenLabs API key provided. Use: ./deploy-functions.sh YOUR_API_KEY"
fi

# Optional: Set OpenAI API key for enhanced assessment
if [ ! -z "$2" ]; then
    echo "🔑 Setting OpenAI API key for enhanced assessment..."
    npx supabase secrets set OPENAI_API_KEY=$2 --project-ref $PROJECT_ID
fi

echo ""
echo "📦 Deploying functions..."
echo "------------------------"

# Deploy each function with status checking
deploy_function() {
    local func_name=$1
    echo -n "  → Deploying $func_name... "
    
    if npx supabase functions deploy $func_name --project-ref $PROJECT_ID 2>/dev/null; then
        echo "✅"
    else
        echo "❌ Failed!"
        return 1
    fi
}

# Deploy all functions
deploy_function "voice-speak"
deploy_function "speech-recognize"
deploy_function "conversation-ai"
deploy_function "assessment-analyze"
deploy_function "assessment-complete"
deploy_function "analyze-pronunciation"
deploy_function "analyze-pronunciation-advanced"
deploy_function "extract-phrases"
deploy_function "extract-transcript-segments"

echo ""
echo "✅ All functions deployed successfully!"
echo "================================"
echo ""
echo "📝 Test Commands:"
echo ""
echo "1. Test voice synthesis:"
echo "   curl -X POST https://$PROJECT_ID.supabase.co/functions/v1/voice-speak \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"text\": \"안녕하세요\", \"voiceId\": \"Anna Kim\"}' \\"
echo "     --output test-audio.mp3"
echo ""
echo "2. Check function logs:"
echo "   npx supabase functions logs voice-speak --project-ref $PROJECT_ID"
echo ""
echo "3. Test conversation AI:"
echo "   curl -X POST https://$PROJECT_ID.supabase.co/functions/v1/conversation-ai \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"안녕하세요\", \"topic\": \"daily-life\", \"level\": \"beginner\"}'"
echo ""
echo "🎉 Deployment complete!"
