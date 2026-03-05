#!/bin/bash

# Fix Supabase authentication and deploy functions

PROJECT_REF="${SUPABASE_PROJECT_ID:?Please set SUPABASE_PROJECT_ID}"

echo "🔧 Fixing Supabase Setup..."
echo "=========================="

# Step 1: Generate access token
echo "📝 Generating Supabase access token..."
echo ""
echo "Please follow these steps:"
echo "1. Go to: https://app.supabase.com/account/tokens"
echo "2. Click 'Generate new token'"
echo "3. Give it a name like 'ekko-deploy'"
echo "4. Copy the token (starts with sbp_)"
echo ""
read -p "Paste your access token here: " SUPABASE_ACCESS_TOKEN

# Save token for future use
echo "export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN" > .supabase-token
echo "✅ Token saved to .supabase-token"

# Step 2: Login with token
echo ""
echo "🔐 Logging in to Supabase..."
npx supabase login --token $SUPABASE_ACCESS_TOKEN

# Step 3: Verify project link
echo ""
echo "🔗 Verifying project link..."
npx supabase projects list

# Step 4: Set secrets
echo ""
echo "🔑 Setting environment variables..."
npx supabase secrets set ELEVENLABS_API_KEY=$1 --project-ref $PROJECT_REF

if [ ! -z "$2" ]; then
    npx supabase secrets set OPENAI_API_KEY=$2 --project-ref $PROJECT_REF
fi

# Step 5: Deploy functions
echo ""
echo "📦 Deploying functions..."
echo "------------------------"

deploy_function() {
    local func_name=$1
    echo -n "  → Deploying $func_name... "
    
    if npx supabase functions deploy $func_name --project-ref $PROJECT_REF 2>/dev/null; then
        echo "✅"
    else
        echo "❌ Failed!"
        # Show actual error
        npx supabase functions deploy $func_name --project-ref $PROJECT_REF
    fi
}

deploy_function "voice-speak"
deploy_function "conversation-ai"
deploy_function "assessment-analyze"
deploy_function "assessment-complete"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Test your functions:"
echo "npx supabase functions list --project-ref $PROJECT_REF"
