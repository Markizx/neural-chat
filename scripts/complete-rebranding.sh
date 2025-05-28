#!/bin/bash

# NeuralChat Rebranding Script
# This script completes the rebranding from SmartChat to NeuralChat

echo "🔄 Completing NeuralChat rebranding..."

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

# Replace remaining smartchat references in AWS task definition
echo "📝 Updating AWS task definition..."
replace_in_file "aws/task-definition.json" "smartchat/" "neuralchat/"
replace_in_file "aws/task-definition.json" "/ecs/smartchat-api" "/ecs/neuralchat-api"

# Replace in ECS service configuration
echo "📝 Updating ECS service configuration..."
replace_in_file "aws/ecs-service.json" "smartchat" "neuralchat"

# Replace in Terraform files
echo "📝 Updating Terraform configuration..."
if [ -f "aws/infrastructure/terraform/main.tf" ]; then
    replace_in_file "aws/infrastructure/terraform/main.tf" "smartchat" "neuralchat"
fi

# Replace in deployment scripts
echo "📝 Updating deployment scripts..."
replace_in_file "scripts/deploy.sh" "SmartChat" "NeuralChat"
replace_in_file "scripts/deploy.sh" "smartchat" "neuralchat"
replace_in_file "scripts/deploy.sh" "@smartchat/" "@neuralchat/"

# Replace in setup scripts
if [ -f "scripts/setup.sh" ]; then
    replace_in_file "scripts/setup.sh" "SmartChat" "NeuralChat"
    replace_in_file "scripts/setup.sh" "smartchat" "neuralchat"
fi

# Replace in DEPLOYMENT_AUDIT.md
echo "📝 Updating deployment documentation..."
replace_in_file "DEPLOYMENT_AUDIT.md" "smartchat/" "neuralchat/"
replace_in_file "DEPLOYMENT_AUDIT.md" "@smartchat/" "@neuralchat/"

# Replace in source files
echo "📝 Updating source files..."

# Update web package imports
find packages/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/@smartchat\//@neuralchat\//g' {} \;

# Update admin package imports  
find packages/admin/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/@smartchat\//@neuralchat\//g' {} \;

# Update API package imports
find packages/api/src -type f \( -name "*.js" -o -name "*.ts" \) -exec sed -i.bak 's/@smartchat\//@neuralchat\//g' {} \;

# Update constants and strings
find packages/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/SmartChat/NeuralChat/g' {} \;
find packages/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/smartchat/neuralchat/g' {} \;
find packages/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/smartchat\.ai/neuralchat\.pro/g' {} \;

# Update public files
echo "📝 Updating public files..."
replace_in_file "packages/web/public/index.html" "SmartChat" "NeuralChat"
replace_in_file "packages/web/public/index.html" "smartchat.ai" "neuralchat.pro"
replace_in_file "packages/web/public/manifest.json" "SmartChat" "NeuralChat"
replace_in_file "packages/web/public/robots.txt" "smartchat.ai" "neuralchat.pro"

# Update documentation
echo "📝 Updating documentation..."
if [ -d "docs" ]; then
    find docs -type f -name "*.md" -exec sed -i.bak 's/SmartChat/NeuralChat/g' {} \;
    find docs -type f -name "*.md" -exec sed -i.bak 's/smartchat/neuralchat/g' {} \;
    find docs -type f -name "*.md" -exec sed -i.bak 's/@smartchat\//@neuralchat\//g' {} \;
fi

# Clean up backup files
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -type f -delete

echo "✅ Rebranding complete!"
echo ""
echo "⚠️  Please manually check and update:"
echo "1. Any API keys or external service configurations"
echo "2. Domain-specific configurations in cloud providers"
echo "3. SSL certificates for neuralchat.pro"
echo "4. DNS records pointing to neuralchat.pro"
echo "5. Any hardcoded URLs in external services" 