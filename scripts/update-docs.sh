#!/bin/bash

# Update documentation files
echo "📝 Updating documentation..."

# Function to replace text in files
replace_in_file() {
    local file=$1
    local search=$2
    local replace=$3
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|$search|$replace|g" "$file"
    else
        # Linux
        sed -i "s|$search|$replace|g" "$file"
    fi
}

# Update getting-started.md
echo "Updating getting-started.md..."
replace_in_file "docs/getting-started.md" "SmartChat.ai" "NeuralChat"
replace_in_file "docs/getting-started.md" "SmartChat" "NeuralChat"
replace_in_file "docs/getting-started.md" "smartchat.ai" "neuralchat.pro"
replace_in_file "docs/getting-started.md" "smartchat-ai/smartchat-platform" "neuralchat/neuralchat-platform"
replace_in_file "docs/getting-started.md" "smartchat-platform" "neuralchat-platform"
replace_in_file "docs/getting-started.md" "smartchat/" "neuralchat/"
replace_in_file "docs/getting-started.md" "@smartchat/" "@neuralchat/"

# Update any other markdown files in docs
find docs -name "*.md" -type f -exec sed -i.bak 's/SmartChat/NeuralChat/g' {} \;
find docs -name "*.md" -type f -exec sed -i.bak 's/smartchat/neuralchat/g' {} \;
find docs -name "*.md" -type f -exec sed -i.bak 's/@smartchat\//@neuralchat\//g' {} \;

# Clean up backup files
find docs -name "*.bak" -type f -delete

echo "✅ Documentation updated!" 