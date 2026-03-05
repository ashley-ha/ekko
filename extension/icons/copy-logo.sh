#!/bin/bash
# Copy existing Ekko logo as temporary icons

cd "$(dirname "$0")"

# Copy the existing logo for all icon sizes
if [ -f "/Users/ashleycha/dev/ekko/public/ekko-logo-small.png" ]; then
    echo "Copying Ekko logo for extension icons..."
    cp "/Users/ashleycha/dev/ekko/public/ekko-logo-small.png" "icon-16.png"
    cp "/Users/ashleycha/dev/ekko/public/ekko-logo-small.png" "icon-32.png"
    cp "/Users/ashleycha/dev/ekko/public/ekko-logo-small.png" "icon-48.png"
    cp "/Users/ashleycha/dev/ekko/public/ekko-logo-small.png" "icon-128.png"
    echo "Icons copied successfully!"
else
    echo "Logo file not found. Creating placeholder icons..."
    # Create empty placeholder files
    touch icon-16.png icon-32.png icon-48.png icon-128.png
    echo "Placeholder icons created. Replace them with actual icons later."
fi

echo ""
echo "Extension icons setup complete!"
echo "You can now load the extension in Chrome."
