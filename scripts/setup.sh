#!/bin/bash

# SmartChat.ai Setup Script

set -e

echo "======================================"
echo "SmartChat.ai Setup Script"
echo "======================================"

# Check for required tools
check_requirements() {
    echo "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d v -f 2 | cut -d . -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
        exit 1
    fi
    echo "✅ Node.js $(node -v)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed."
        exit 1
    fi
    echo "✅ npm $(npm -v)"
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        echo "⚠️  MongoDB is not installed locally. Make sure you have MongoDB Atlas or a remote MongoDB instance."
    else
        echo "✅ MongoDB installed"
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        echo "⚠️  Redis is not installed locally. Make sure you have a Redis instance available."
    else
        echo "✅ Redis installed"
    fi
}

# Install dependencies
install_dependencies() {
    echo ""
    echo "Installing dependencies..."
    
    # Install root dependencies
    echo "Installing root dependencies..."
    npm install
    
    # Bootstrap all packages
    echo "Bootstrapping packages..."
    npm run bootstrap
    
    echo "✅ Dependencies installed"
}

# Setup environment files
setup_env_files() {
    echo ""
    echo "Setting up environment files..."
    
    # API environment
    if [ ! -f packages/api/.env ]; then
        cp packages/api/.env.example packages/api/.env
        echo "✅ Created packages/api/.env"
        echo "⚠️  Please update packages/api/.env with your configuration"
    else
        echo "ℹ️  packages/api/.env already exists"
    fi
    
    # Web environment
    if [ ! -f packages/web/.env ]; then
        cp packages/web/.env.example packages/web/.env
        echo "✅ Created packages/web/.env"
        echo "⚠️  Please update packages/web/.env with your configuration"
    else
        echo "ℹ️  packages/web/.env already exists"
    fi
}

# Create necessary directories
create_directories() {
    echo ""
    echo "Creating necessary directories..."
    
    # Create uploads directory for local development
    mkdir -p uploads
    echo "✅ Created uploads directory"
    
    # Create logs directory
    mkdir -p logs
    echo "✅ Created logs directory"
}

# Build shared packages
build_shared() {
    echo ""
    echo "Building shared packages..."
    
    # Build shared types
    cd packages/shared
    npm run build
    cd ../..
    
    echo "✅ Shared packages built"
}

# Database setup
setup_database() {
    echo ""
    echo "Database setup..."
    echo "⚠️  Make sure your MongoDB is running and accessible"
    echo "⚠️  Update MONGODB_URI in packages/api/.env"
    echo ""
    echo "To start MongoDB locally (if installed):"
    echo "  mongod --dbpath /path/to/data"
    echo ""
    echo "For MongoDB Atlas:"
    echo "  1. Create a cluster at https://cloud.mongodb.com"
    echo "  2. Get your connection string"
    echo "  3. Update MONGODB_URI in packages/api/.env"
}

# Redis setup
setup_redis() {
    echo ""
    echo "Redis setup..."
    echo "⚠️  Make sure your Redis is running and accessible"
    echo "⚠️  Update REDIS_URL in packages/api/.env"
    echo ""
    echo "To start Redis locally (if installed):"
    echo "  redis-server"
}

# Create test user
create_test_user() {
    echo ""
    read -p "Would you like to create a test user? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Creating test user..."
        echo "⚠️  This feature will be available after starting the server"
        echo "⚠️  Use the registration endpoint or UI to create a user"
    fi
}

# Instructions
print_instructions() {
    echo ""
    echo "======================================"
    echo "Setup Complete! 🎉"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure environment variables:"
    echo "   - Edit packages/api/.env"
    echo "   - Edit packages/web/.env"
    echo ""
    echo "2. Set up external services:"
    echo "   - MongoDB (local or Atlas)"
    echo "   - Redis"
    echo "   - Anthropic API key (for Claude)"
    echo "   - Grok API key"
    echo "   - Stripe API keys"
    echo "   - SendGrid API key"
    echo "   - AWS S3 (for file storage)"
    echo ""
    echo "3. Start development servers:"
    echo "   npm run dev"
    echo ""
    echo "4. Access the application:"
    echo "   - Web: http://localhost:3000"
    echo "   - API: http://localhost:5000"
    echo ""
    echo "5. API Documentation:"
    echo "   http://localhost:5000/api/v1"
    echo ""
    echo "For production deployment, see docs/deployment.md"
}

# Main execution
main() {
    check_requirements
    install_dependencies
    setup_env_files
    create_directories
    build_shared
    setup_database
    setup_redis
    create_test_user
    print_instructions
}

# Run main function
main