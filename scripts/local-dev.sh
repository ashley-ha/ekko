#!/bin/bash

# Run Supabase functions locally for development

echo "🚀 Starting Ekko Local Development Environment..."
echo "=============================================="

# Check if Supabase is running locally
if ! supabase status &> /dev/null; then
    echo "⚡ Starting Supabase locally..."
    supabase start
fi

# Set local environment variables
echo "🔑 Setting local environment variables..."

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "Loading from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "Creating .env.local template..."
    cat > .env.local << EOF
# Local development environment variables
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EOF
    echo "✅ Created .env.local - please add your API keys"
    echo "⚠️  You need to add your actual API keys to .env.local before running functions"
fi

# Check if required environment variables are set
if [ -z "$ELEVENLABS_API_KEY" ] || [ "$ELEVENLABS_API_KEY" = "your_elevenlabs_api_key_here" ]; then
    echo "⚠️  Warning: ELEVENLABS_API_KEY not set or using placeholder value"
    echo "   Please update .env.local with your actual API key"
fi

# Serve functions locally
echo ""
echo "🔧 Serving functions locally..."
echo "Functions will be available at:"
echo "  http://localhost:54321/functions/v1/voice-speak"
echo "  http://localhost:54321/functions/v1/conversation-ai"
echo "  http://localhost:54321/functions/v1/assessment-analyze"
echo "  http://localhost:54321/functions/v1/assessment-complete"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Serve all functions
supabase functions serve --env-file .env.local
