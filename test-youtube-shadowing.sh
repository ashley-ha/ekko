#!/bin/bash
# test-youtube-shadowing.sh
# Quick test script for YouTube shadowing functionality

echo "🎬 YouTube Shadowing Test Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if the server is running
check_server() {
    echo -e "${YELLOW}Checking if dev server is running...${NC}"
    if curl -s http://localhost:5173 > /dev/null; then
        echo -e "${GREEN}✓ Dev server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Dev server is not running${NC}"
        echo "Starting dev server..."
        npm run dev &
        SERVER_PID=$!
        sleep 5
        return 1
    fi
}

# Open browser with test page
open_test_page() {
    echo -e "${YELLOW}Opening test pages...${NC}"
    
    # Try different commands based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:5173/youtube-shadowing"
        open "file://$PWD/test-keyboard.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "http://localhost:5173/youtube-shadowing" 2>/dev/null || echo "Please open http://localhost:5173/youtube-shadowing manually"
        xdg-open "file://$PWD/test-keyboard.html" 2>/dev/null || echo "Please open test-keyboard.html manually"
    else
        # Windows or other
        echo "Please open these URLs manually:"
        echo "1. http://localhost:5173/youtube-shadowing"
        echo "2. file://$PWD/test-keyboard.html"
    fi
}

# Run tests
run_tests() {
    echo -e "${YELLOW}Running component tests...${NC}"
    npm test test/youtube-shadowing.test.tsx
}

# Check database
check_database() {
    echo -e "${YELLOW}Checking database connection...${NC}"
    
    # Create a simple Node.js script to test Supabase
    cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('shadowing_sessions')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log('❌ Database connection failed:', error.message);
        } else {
            console.log('✅ Database connection successful');
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }
    process.exit(0);
}

testConnection();
EOF

    node test-supabase.js
    rm test-supabase.js
}

# Main execution
echo -e "${YELLOW}Starting YouTube Shadowing tests...${NC}\n"

# 1. Check server
check_server
SERVER_STARTED=$?

# 2. Check database
check_database

# 3. Open test pages
open_test_page

# 4. Show test instructions
echo -e "\n${GREEN}Test Instructions:${NC}"
echo "1. In the YouTube Shadowing page:"
echo "   - Load a Korean video with captions"
echo "   - Press SPACE to play segment"
echo "   - Press ← → to navigate"
echo "   - Check that captions update"
echo ""
echo "2. In the keyboard test page:"
echo "   - Press keys and check the log"
echo "   - Verify keys are captured"
echo ""
echo "3. Check browser console for errors"
echo ""
echo "4. Run component tests with: npm test"

# 5. Monitor logs
echo -e "\n${YELLOW}Monitoring console output...${NC}"
echo "Press Ctrl+C to stop"

# Keep script running if we started the server
if [ $SERVER_STARTED -eq 1 ]; then
    wait $SERVER_PID
fi