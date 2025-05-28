# Quick Deploy Script for NeuralChat on AWS
# PowerShell version for Windows

param(
    [string]$Environment = "production",
    [string]$Region = "us-east-1",
    [switch]$SkipTests,
    [switch]$InfraOnly,
    [switch]$AppsOnly
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check AWS CLI
    try {
        aws --version | Out-Null
        Write-Success "AWS CLI is installed"
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Success "Docker is installed"
    }
    catch {
        Write-Error "Docker is not installed. Please install it first."
        exit 1
    }
    
    # Check Node.js
    try {
        node --version | Out-Null
        Write-Success "Node.js is installed"
    }
    catch {
        Write-Error "Node.js is not installed. Please install it first."
        exit 1
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
        Write-Success "AWS credentials are configured"
    }
    catch {
        Write-Error "AWS credentials are not configured. Run 'aws configure' first."
        exit 1
    }
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return
    }
    
    Write-Status "Running tests..."
    
    # Install dependencies
    Write-Status "Installing dependencies..."
    npm ci --legacy-peer-deps
    npm run bootstrap
    
    # Run linting
    Write-Status "Running linting..."
    npm run lint
    
    # Run tests
    Write-Status "Running unit tests..."
    npm run test
    
    # Build all packages
    Write-Status "Building packages..."
    npm run build --workspace=@neuralchat/shared
    npm run build --workspace=@neuralchat/ui-kit
    npm run build --workspace=@neuralchat/api
    npm run build --workspace=@neuralchat/web
    npm run build --workspace=@neuralchat/admin
    
    Write-Success "All tests passed!"
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Status "Deploying AWS infrastructure..."
    
    # Get certificate ARN from environment or prompt
    $CertArn = $env:SSL_CERTIFICATE_ARN
    if (-not $CertArn) {
        Write-Warning "SSL_CERTIFICATE_ARN environment variable not set"
        $CertArn = Read-Host "Please enter your SSL Certificate ARN"
    }
    
    # Deploy CloudFormation stack
    Write-Status "Deploying CloudFormation stack..."
    aws cloudformation deploy `
        --template-file aws/cloudformation/infrastructure.yml `
        --stack-name "$Environment-neuralchat-infrastructure" `
        --parameter-overrides `
            Environment=$Environment `
            DomainName=neuralchat.pro `
            CertificateArn=$CertArn `
        --capabilities CAPABILITY_IAM `
        --no-fail-on-empty-changeset `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Infrastructure deployed successfully!"
    } else {
        Write-Error "Infrastructure deployment failed!"
        exit 1
    }
}

# Deploy applications
function Deploy-Applications {
    Write-Status "Deploying applications..."
    
    # Get AWS account ID
    $AccountId = aws sts get-caller-identity --query Account --output text
    
    # Login to ECR
    Write-Status "Logging in to ECR..."
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"
    
    # Build and push API
    Write-Status "Building and pushing API..."
    npm run build --workspace=@neuralchat/shared
    npm run build --workspace=@neuralchat/api
    
    docker build -t "$AccountId.dkr.ecr.$Region.amazonaws.com/$Environment-neuralchat-api:latest" -f docker/api.Dockerfile .
    docker push "$AccountId.dkr.ecr.$Region.amazonaws.com/$Environment-neuralchat-api:latest"
    
    # Update ECS service
    Write-Status "Updating ECS service..."
    aws ecs update-service `
        --cluster "$Environment-neuralchat-cluster" `
        --service "$Environment-neuralchat-api-service" `
        --force-new-deployment `
        --region $Region
    
    # Deploy frontend apps via Amplify
    if ($env:AMPLIFY_APP_ID_WEB) {
        Write-Status "Triggering Amplify deployment for Web app..."
        aws amplify start-job `
            --app-id $env:AMPLIFY_APP_ID_WEB `
            --branch-name main `
            --job-type RELEASE `
            --region $Region
    }
    
    if ($env:AMPLIFY_APP_ID_ADMIN) {
        Write-Status "Triggering Amplify deployment for Admin app..."
        aws amplify start-job `
            --app-id $env:AMPLIFY_APP_ID_ADMIN `
            --branch-name main `
            --job-type RELEASE `
            --region $Region
    }
    
    Write-Success "Applications deployed successfully!"
}

# Main execution
function Main {
    Write-Status "Starting NeuralChat AWS Deployment"
    Write-Status "=================================="
    Write-Status "Environment: $Environment"
    Write-Status "Region: $Region"
    Write-Status ""
    
    Test-Prerequisites
    
    if (-not $AppsOnly) {
        Invoke-Tests
        Deploy-Infrastructure
    }
    
    if (-not $InfraOnly) {
        Deploy-Applications
    }
    
    Write-Success "🎉 Deployment completed successfully!"
    Write-Status ""
    Write-Status "Next steps:"
    Write-Host "  1. Check ECS service status in AWS Console" -ForegroundColor White
    Write-Host "  2. Verify Amplify deployments" -ForegroundColor White
    Write-Host "  3. Test application endpoints:" -ForegroundColor White
    Write-Host "     - Web: https://neuralchat.pro" -ForegroundColor White
    Write-Host "     - Admin: https://admin.neuralchat.pro" -ForegroundColor White
    Write-Host "     - API: https://api.neuralchat.pro" -ForegroundColor White
    Write-Host "  4. Monitor CloudWatch logs" -ForegroundColor White
}

# Run main function
try {
    Main
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
} 