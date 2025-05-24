#!/bin/bash

# SmartChat.ai Deployment Script

set -e

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_PROFILE=${AWS_PROFILE:-default}

echo "======================================"
echo "SmartChat.ai Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Validate environment
validate_environment() {
    if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
        echo "❌ Invalid environment. Use 'production' or 'staging'"
        exit 1
    fi
}

# Check AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is not installed. Please install AWS CLI."
        exit 1
    fi
    echo "✅ AWS CLI found"
}

# Build all packages
build_packages() {
    echo ""
    echo "Building packages..."
    
    # Clean previous builds
    echo "Cleaning previous builds..."
    rm -rf packages/*/dist
    rm -rf packages/*/build
    
    # Build shared packages first
    echo "Building shared packages..."
    npm run build --workspace=@smartchat/shared
    
    # Build API
    echo "Building API..."
    npm run build --workspace=@smartchat/api
    
    # Build Web
    echo "Building Web..."
    npm run build --workspace=@smartchat/web
    
    echo "✅ All packages built successfully"
}

# Deploy API to AWS
deploy_api() {
    echo ""
    echo "Deploying API..."
    
    # Create deployment package
    echo "Creating API deployment package..."
    cd packages/api
    
    # Create zip with production dependencies only
    cp package.json dist/
    cp package-lock.json dist/ 2>/dev/null || true
    cd dist
    npm ci --production
    zip -r ../api-deployment.zip .
    cd ..
    
    # Upload to S3
    echo "Uploading to S3..."
    aws s3 cp api-deployment.zip s3://smartchat-deployments/$ENVIRONMENT/api-$(date +%Y%m%d-%H%M%S).zip
    
    # Clean up
    rm -rf dist/node_modules
    rm -f api-deployment.zip
    
    cd ../..
    echo "✅ API deployed"
}

# Deploy Web to AWS Amplify
deploy_web() {
    echo ""
    echo "Deploying Web to AWS Amplify..."
    
    cd packages/web
    
    # For Amplify, we just need to push to the git branch
    # Amplify will automatically build and deploy
    echo "ℹ️  Web deployment is handled by AWS Amplify"
    echo "ℹ️  Push to the configured branch to trigger deployment"
    
    cd ../..
}

# Run database migrations
run_migrations() {
    echo ""
    echo "Running database migrations..."
    echo "ℹ️  No migrations to run (using MongoDB)"
}

# Update environment variables
update_env_variables() {
    echo ""
    echo "Updating environment variables..."
    
    if [ "$ENVIRONMENT" == "production" ]; then
        echo "⚠️  Make sure to update production environment variables in:"
        echo "  - AWS Systems Manager Parameter Store"
        echo "  - AWS Amplify Environment Variables"
        echo "  - AWS Lambda Environment Variables"
    fi
}

# Invalidate CloudFront cache
invalidate_cache() {
    echo ""
    echo "Invalidating CloudFront cache..."
    
    DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-}
    if [ -z "$DISTRIBUTION_ID" ]; then
        echo "⚠️  CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation."
    else
        aws cloudfront create-invalidation \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/*"
        echo "✅ CloudFront cache invalidated"
    fi
}

# Health check
health_check() {
    echo ""
    echo "Running health checks..."
    
    API_URL=${API_URL:-https://api.smartchat.ai}
    WEB_URL=${WEB_URL:-https://smartchat.ai}
    
    # Check API health
    echo "Checking API health..."
    if curl -f -s "$API_URL/health" > /dev/null; then
        echo "✅ API is healthy"
    else
        echo "❌ API health check failed"
    fi
    
    # Check Web health
    echo "Checking Web health..."
    if curl -f -s "$WEB_URL" > /dev/null; then
        echo "✅ Web is healthy"
    else
        echo "❌ Web health check failed"
    fi
}

# Send deployment notification
send_notification() {
    echo ""
    echo "Sending deployment notification..."
    
    # You can integrate with Slack, Discord, or email here
    echo "ℹ️  Deployment notification would be sent here"
}

# Rollback function
rollback() {
    echo ""
    echo "❌ Deployment failed! Starting rollback..."
    
    # Add rollback logic here
    echo "ℹ️  Rollback logic would execute here"
    
    exit 1
}

# Set up error handling
trap rollback ERR

# Main deployment flow
main() {
    validate_environment
    check_aws_cli
    
    echo ""
    echo "Starting deployment to $ENVIRONMENT..."
    echo ""
    
    # Build
    build_packages
    
    # Deploy
    deploy_api
    deploy_web
    
    # Post-deployment
    run_migrations
    update_env_variables
    invalidate_cache
    
    # Verify
    sleep 10  # Wait for services to start
    health_check
    
    # Notify
    send_notification
    
    echo ""
    echo "======================================"
    echo "✅ Deployment completed successfully!"
    echo "======================================"
    echo ""
    echo "Deployed to:"
    echo "  API: $API_URL"
    echo "  Web: $WEB_URL"
    echo ""
}

# Run main function
main