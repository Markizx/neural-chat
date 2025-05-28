#!/bin/bash

# AWS Deployment Script for NeuralChat
# This script deploys the application to AWS using multiple services

set -e

echo "🚀 Starting AWS deployment for NeuralChat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
IMAGE_TAG=${IMAGE_TAG:-latest}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env_vars() {
    print_status "Checking required environment variables..."
    
    required_vars=(
        "AWS_ACCOUNT_ID"
        "AWS_REGION"
        "IMAGE_REPO_NAME_API"
        "IMAGE_REPO_NAME_WEB"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "All required environment variables are set"
}

# Login to ECR
ecr_login() {
    print_status "Logging in to Amazon ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    print_success "Successfully logged in to ECR"
}

# Build and push Docker images
build_and_push() {
    print_status "Building and pushing Docker images..."
    
    # Build shared package first
    print_status "Building shared package..."
    npm run build --workspace=@neuralchat/shared
    
    # Build and push API
    print_status "Building API Docker image..."
    docker build -t $IMAGE_REPO_NAME_API:$IMAGE_TAG -f docker/api.Dockerfile .
    docker tag $IMAGE_REPO_NAME_API:$IMAGE_TAG $ECR_REGISTRY/$IMAGE_REPO_NAME_API:$IMAGE_TAG
    
    print_status "Pushing API image to ECR..."
    docker push $ECR_REGISTRY/$IMAGE_REPO_NAME_API:$IMAGE_TAG
    
    # Build and push Web
    print_status "Building Web Docker image..."
    docker build -t $IMAGE_REPO_NAME_WEB:$IMAGE_TAG -f docker/web.Dockerfile .
    docker tag $IMAGE_REPO_NAME_WEB:$IMAGE_TAG $ECR_REGISTRY/$IMAGE_REPO_NAME_WEB:$IMAGE_TAG
    
    print_status "Pushing Web image to ECR..."
    docker push $ECR_REGISTRY/$IMAGE_REPO_NAME_WEB:$IMAGE_TAG
    
    print_success "All images built and pushed successfully"
}

# Deploy to ECS (if using ECS)
deploy_ecs() {
    if [ ! -z "$ECS_CLUSTER" ] && [ ! -z "$ECS_SERVICE" ]; then
        print_status "Deploying to ECS..."
        aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
        print_success "ECS deployment initiated"
    else
        print_warning "ECS deployment skipped (ECS_CLUSTER or ECS_SERVICE not set)"
    fi
}

# Deploy Amplify apps
deploy_amplify() {
    if [ ! -z "$AMPLIFY_APP_ID_WEB" ]; then
        print_status "Triggering Amplify deployment for Web app..."
        aws amplify start-job --app-id $AMPLIFY_APP_ID_WEB --branch-name main --job-type RELEASE
        print_success "Amplify Web deployment triggered"
    fi
    
    if [ ! -z "$AMPLIFY_APP_ID_ADMIN" ]; then
        print_status "Triggering Amplify deployment for Admin app..."
        aws amplify start-job --app-id $AMPLIFY_APP_ID_ADMIN --branch-name main --job-type RELEASE
        print_success "Amplify Admin deployment triggered"
    fi
}

# Main deployment flow
main() {
    print_status "Starting NeuralChat AWS Deployment"
    print_status "=================================="
    
    check_env_vars
    ecr_login
    build_and_push
    deploy_ecs
    deploy_amplify
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Next steps:"
    echo "  1. Check ECS service status in AWS Console"
    echo "  2. Verify Amplify deployments"
    echo "  3. Test application endpoints"
    echo "  4. Monitor CloudWatch logs"
}

# Run main function
main "$@" 