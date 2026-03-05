#!/bin/bash

# Simple deployment script using npx

echo "🚀 Deploying Ekko Edge Functions (Simple Version)..."
echo "================================================"

# Project details
PROJECT_REF="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"
ELEVENLABS_KEY="${ELEVENLABS_API_KEY:-$1}"

if [ -z "$ELEVENLABS_KEY" ]; then
    echo "❌ No ElevenLabs API key provided!"
    echo ""
    echo "Usage: ./simple-deploy.sh YOUR_ELEVENLABS_KEY"
    echo "Or set environment variable:"
    echo "   export ELEVENLABS_API_KEY=your_key"
    exit 1
fi

echo "📍 Project: $PROJECT_REF"
echo "🔑 Using ElevenLabs key: ${ELEVENLABS_KEY:0:10}..."
echo ""

# Step 1: Set secrets
echo "🔑 Setting ElevenLabs API key..."
npx supabase secrets set ELEVENLABS_API_KEY=$ELEVENLABS_KEY --project-ref $PROJECT_REF

echo ""
echo "📦 Deploying functions one by one..."
echo ""

# Deploy each function
echo "1️⃣ Deploying voice-speak..."
npx supabase functions deploy voice-speak --project-ref $PROJECT_REF

echo ""
echo "2️⃣ Deploying conversation-ai..."
npx supabase functions deploy conversation-ai --project-ref $PROJECT_REF

echo ""
echo "3️⃣ Deploying assessment-analyze..."
npx supabase functions deploy assessment-analyze --project-ref $PROJECT_REF

echo ""
echo "4️⃣ Deploying assessment-complete..."
npx supabase functions deploy assessment-complete --project-ref $PROJECT_REF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Verify deployment:"
echo "npx supabase functions list --project-ref $PROJECT_REF"
echo ""
echo "📊 Check logs:"
echo "npx supabase functions logs voice-speak --project-ref $PROJECT_REF"
echo ""
echo "🧪 Test voice function:"
echo "Run the test script: ./scripts/test-functions.sh"
