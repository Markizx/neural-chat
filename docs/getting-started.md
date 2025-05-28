# Getting Started with NeuralChat

This guide will help you set up and run NeuralChat locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (v7.0 or higher) or access to MongoDB Atlas
- **Redis** (v7.0 or higher) or access to Redis Cloud
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/NeuralChat-ai/NeuralChat-platform.git
cd NeuralChat-platform
2. Install Dependencies
bashnpm install
npm run bootstrap
This will install all dependencies for the monorepo and link the packages together.
3. Environment Configuration
Copy the example environment files:
bashcp .env.example .env
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env
cp packages/admin/.env.example packages/admin/.env
4. Configure Environment Variables
Edit the environment files with your configuration:
packages/api/.env
env# Database
MONGODB_URI=mongodb://localhost:27017/NeuralChat
REDIS_URL=redis://localhost:6379

# AI Services
ANTHROPIC_API_KEY=your-claude-api-key
GROK_API_KEY=your-grok-api-key

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@localhost

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=NeuralChat-uploads
AWS_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
packages/web/.env
envREACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
5. Database Setup
If using local MongoDB:
bash# Start MongoDB
mongod --dbpath /path/to/your/data

# The application will create collections automatically
If using MongoDB Atlas:

Create a cluster at cloud.mongodb.com
Get your connection string
Update MONGODB_URI in your .env file

6. Redis Setup
If using local Redis:
bash# Start Redis
redis-server
If using Redis Cloud:

Create an instance at redis.com
Get your connection URL
Update REDIS_URL in your .env file

Running the Application
Development Mode
To run all services in development mode:
bashnpm run dev
This will start:

API server on http://localhost:5000
Web application on http://localhost:3000
Admin panel on http://localhost:3001

Individual Services
You can also run services individually:
bash# API only
npm run dev:api

# Web only
npm run dev:web

# Admin only
cd packages/admin && npm run dev
Production Build
To build all packages for production:
bashnpm run build
To run in production mode:
bashnpm start
Using Docker
Development with Docker
bashdocker-compose up
Production with Docker
bashdocker-compose -f docker-compose.yml -f docker-compose.prod.yml up
Testing
Run all tests:
bashnpm test
Run tests for specific packages:
bashnpm run test:api
npm run test:web
Run tests in watch mode:
bashnpm run test:watch
Next Steps

Create an Account: Visit http://localhost:3000 and sign up
Explore Features: Try creating chats with Claude and Grok
Test Brainstorm Mode: Start a brainstorm session
Access Admin Panel: Visit http://localhost:3001 (requires admin role)

Common Issues
Port Already in Use
If you get a "port already in use" error:
bash# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
MongoDB Connection Failed
Ensure MongoDB is running and accessible:
bash# Test connection
mongosh mongodb://localhost:27017
Redis Connection Failed
Ensure Redis is running:
bash# Test connection
redis-cli ping
# Should return "PONG"
Getting Help
If you encounter issues:

Check the Troubleshooting Guide
Review the FAQ
Search existing GitHub Issues
Create a new issue with detailed information

What's Next?

Learn about the Architecture
Explore the API Documentation
Read the Frontend Guide
Set up Deployment


## 15. docs/architecture.md

```markdown
# Architecture Overview

NeuralChat is built with a modern, scalable microservices architecture designed for high availability and performance.

## System Architecture
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Client    │     │  Mobile Client  │     │  Admin Panel    │
│   (React)       │     │  (React Native) │     │  (Next.js)      │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
│                       │                         │
└───────────────────────┴─────────────────────────┘
│
┌────────┴────────┐
│                 │
│   API Gateway   │
│   (Express)     │
│                 │
└────────┬────────┘
│
┌───────────────────────┼───────────────────────┐
│                       │                       │
┌────────┴────────┐     ┌────────┴────────┐     ┌────────┴────────┐
│                 │     │                 │     │                 │
│   Auth Service  │     │  Chat Service   │     │ Admin Service   │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
│                       │                       │
└───────────────────────┴───────────────────────┘
│
┌───────────────┼───────────────┐
│               │               │
┌───────┴─────┐ ┌──────┴──────┐ ┌─────┴───────┐
│   MongoDB   │ │    Redis    │ │  AWS S3     │
│             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘

## Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Real-time**: Socket.io
- **File Storage**: AWS S3
- **Email**: SendGrid
- **Payment**: Stripe

### Frontend
- **Web**: React 18 with Material-UI
- **Admin**: Next.js 14 with Material-UI
- **Mobile**: React Native
- **State Management**: React Query, Zustand
- **Build Tool**: Create React App (Web), Next.js (Admin)
- **Styling**: Emotion, Material-UI

### Infrastructure
- **Container**: Docker
- **Orchestration**: AWS ECS with Fargate
- **CI/CD**: GitHub Actions, AWS CodeBuild
- **Monitoring**: AWS CloudWatch, Sentry
- **CDN**: CloudFront

## Key Components

### 1. API Gateway

The API Gateway serves as the single entry point for all client requests:

- **Authentication**: JWT-based auth with refresh tokens
- **Rate Limiting**: Protects against abuse
- **Request Validation**: Ensures data integrity
- **Response Formatting**: Consistent API responses
- **Error Handling**: Centralized error management

### 2. Microservices

#### Auth Service
- User registration and login
- JWT token management
- OAuth integration (Google, Apple)
- Password reset functionality
- 2FA support (future)

#### Chat Service
- Message processing and storage
- AI model integration (Claude, Grok)
- Real-time message streaming
- File attachment handling
- Artifact management

#### Brainstorm Service
- Orchestrates AI collaboration
- Manages conversation flow
- Generates summaries and insights
- Handles session state

#### Subscription Service
- Stripe integration
- Plan management
- Usage tracking
- Billing webhooks

### 3. Database Schema

#### Collections
- **Users**: User profiles and authentication
- **Chats**: Chat sessions and metadata
- **Messages**: Individual messages with content
- **Projects**: File organization and context
- **Subscriptions**: Billing and plan information
- **BrainstormSessions**: Collaborative AI sessions

### 4. Caching Strategy

Redis is used for:
- Session management
- API response caching
- Rate limiting counters
- Real-time presence
- Temporary file URLs

### 5. Security

- **Encryption**: All data encrypted in transit (TLS) and at rest
- **Authentication**: JWT with secure httpOnly cookies
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: Per-user and per-IP limits
- **CORS**: Strict origin policies
- **CSP**: Content Security Policy headers

## Scalability Considerations

### Horizontal Scaling
- Stateless services enable easy horizontal scaling
- Load balancing with AWS ALB
- Auto-scaling based on CPU and memory metrics

### Database Scaling
- MongoDB replica sets for high availability
- Read replicas for query distribution
- Sharding strategy for future growth

### Caching
- Redis cluster for distributed caching
- CDN for static assets
- Browser caching with proper headers

### Message Queue (Future)
- AWS SQS for asynchronous processing
- Separate workers for heavy operations
- Dead letter queues for failed messages

## Deployment Architecture

### Production Environment
┌─────────────────────────────────────────────────────┐
│                   AWS Cloud                         │
│                                                     │
│  ┌─────────────┐        ┌─────────────────────┐    │
│  │ CloudFront  │        │    Route 53         │    │
│  │    (CDN)    │        │     (DNS)           │    │
│  └──────┬──────┘        └──────────┬──────────┘    │
│         │                          │                │
│         └──────────────┬───────────┘                │
│                        │                            │
│              ┌─────────┴──────────┐                │
│              │   ALB              │                │
│              │ (Load Balancer)    │                │
│              └─────────┬──────────┘                │
│                        │                            │
│         ┌──────────────┼──────────────┐            │
│         │              │              │            │
│   ┌─────┴─────┐  ┌────┴──────┐  ┌───┴──────┐     │
│   │  ECS      │  │  ECS      │  │  ECS     │     │
│   │  Web      │  │  API      │  │  Admin   │     │
│   │  Fargate  │  │  Fargate  │  │  Fargate │     │
│   └───────────┘  └───────────┘  └──────────┘     │
│                                                    │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│   │ MongoDB    │  │ ElastiCache│  │   S3       │  │
│   │  Atlas     │  │  (Redis)   │  │            │  │
│   └────────────┘  └────────────┘  └────────────┘  │
│                                                    │
└─────────────────────────────────────────────────────┘

## Monitoring and Observability

### Metrics
- Application metrics with CloudWatch
- Custom metrics for business KPIs
- Performance monitoring with Web Vitals

### Logging
- Centralized logging with CloudWatch Logs
- Structured logging with correlation IDs
- Log retention policies

### Alerting
- CloudWatch Alarms for critical metrics
- PagerDuty integration for on-call
- Slack notifications for non-critical alerts

### Tracing
- Distributed tracing with AWS X-Ray
- Request flow visualization
- Performance bottleneck identification

## Development Workflow

### Local Development
```bash
# Start all services
npm run dev

# Individual services
npm run dev:api
npm run dev:web
npm run dev:admin
Testing

Unit tests with Jest
Integration tests for API endpoints
E2E tests with Cypress (future)
Load testing with K6

CI/CD Pipeline

Code Push: Developer pushes to feature branch
PR Creation: Pull request triggers checks
Automated Tests: Unit, integration tests run
Code Review: Manual review process
Merge: Approved PR merged to main
Build: Docker images built
Deploy: Automated deployment to staging
Smoke Tests: Automated verification
Production: Manual or automated promotion

Best Practices
Code Organization

Monorepo structure with Lerna
Shared types and utilities
Consistent naming conventions
Modular architecture

API Design

RESTful principles
Versioned endpoints
Consistent error responses
Comprehensive documentation

Security

Regular dependency updates
Security scanning in CI/CD
Penetration testing
OWASP compliance

Performance

Lazy loading for frontend
API response compression
Database query optimization
CDN for static assets


## 16. docs/api/README.md

```markdown
# API Documentation

NeuralChat provides a comprehensive RESTful API for all platform functionality.

## Base URL
Production: https://api.NeuralChat/api/v1
Staging: https://staging-api.NeuralChat/api/v1
Development: http://localhost:5000/api/v1

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting Started

1. Register a new account or login
2. Receive access and refresh tokens
3. Include the access token in all API requests

### Request Headers

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
API Reference
Authentication Endpoints
Register
httpPOST /auth/register
Request:
json{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
Response:
json{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
Login
httpPOST /auth/login
Request:
json{
  "email": "user@example.com",
  "password": "securepassword"
}
Chat Endpoints
Create Chat
httpPOST /chats
Request:
json{
  "type": "claude",
  "model": "claude-4-opus",
  "title": "New Chat"
}
Get Chats
httpGET /chats?page=1&limit=20&type=claude
Send Message
httpPOST /chats/:chatId/messages
Request:
json{
  "content": "Hello, Claude!",
  "attachments": []
}
Error Responses
All errors follow this format:
json{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
Common error codes:

UNAUTHORIZED - Invalid or missing token
VALIDATION_ERROR - Invalid request data
NOT_FOUND - Resource not found
RATE_LIMIT_EXCEEDED - Too many requests
INTERNAL_ERROR - Server error

Rate Limiting
API rate limits:

Free Plan: 100 requests per hour
Pro Plan: 1000 requests per hour
Business Plan: Unlimited

Rate limit headers:
httpX-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Webhooks
Configure webhooks for real-time events:

Go to Settings > Webhooks
Add your endpoint URL
Select events to subscribe to

Available events:

chat.created
message.sent
subscription.updated
user.updated

SDKs
Official SDKs available:

JavaScript/TypeScript
Python
Go

Example (JavaScript):
javascriptimport { NeuralChatAPI } from '@NeuralChat/sdk';

const client = new NeuralChatAPI({
  apiKey: 'your_api_key'
});

const response = await client.chats.create({
  type: 'claude',
  model: 'claude-4-opus'
});
Postman Collection
Download our Postman Collection for easy API testing.
API Changelog
v1.2.0 (2024-02-01)

Added Brainstorm Mode endpoints
Improved error responses
Added webhook support

v1.1.0 (2024-01-15)

Added file upload endpoints
Added project management
Performance improvements

v1.0.0 (2024-01-01)

Initial API release


## 17. docs/deployment/README.md

```markdown
# Deployment Guide

This guide covers deploying NeuralChat to production on AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed
- Domain name configured in Route 53

## Architecture Overview

NeuralChat uses the following AWS services:
- **ECS Fargate** - Container orchestration
- **ALB** - Load balancing
- **RDS/MongoDB Atlas** - Database
- **ElastiCache** - Redis caching
- **S3** - File storage
- **CloudFront** - CDN
- **Route 53** - DNS
- **Secrets Manager** - Secrets management
- **CloudWatch** - Monitoring

## Step-by-Step Deployment

### 1. Prepare AWS Resources

```bash
# Create ECR repositories
aws ecr create-repository --repository-name NeuralChat-api
aws ecr create-repository --repository-name NeuralChat-web
aws ecr create-repository --repository-name NeuralChat-admin

# Create S3 bucket for uploads
aws s3 mb s3://NeuralChat-uploads-production
2. Configure Secrets
Store sensitive data in AWS Secrets Manager:
bash# Create secrets
aws secretsmanager create-secret \
  --name NeuralChat/production/mongodb-uri \
  --secret-string "mongodb+srv://..."

aws secretsmanager create-secret \
  --name NeuralChat/production/jwt-secret \
  --secret-string "your-secret-key"

# Add all other secrets...
3. Build and Push Docker Images
bash# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
npm run docker:build
npm run docker:push
4. Deploy Infrastructure
Using AWS CDK (recommended) or CloudFormation:
bash# Install CDK
npm install -g aws-cdk

# Deploy infrastructure
cd infrastructure
cdk deploy NeuralChatStack
5. Configure ECS Task Definitions
Update aws/task-definition.json with your values:
json{
  "family": "NeuralChat-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/NeuralChat-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:NeuralChat/production/mongodb-uri"
        }
      ]
    }
  ]
}
6. Create ECS Service
bash# Register task definition
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json

# Create service
aws ecs create-service \
  --cluster NeuralChat-cluster \
  --service-name NeuralChat-service \
  --task-definition NeuralChat-production:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
7. Configure Load Balancer

Create Application Load Balancer
Configure target groups for each service
Set up path-based routing:

/api/* → API service
/admin/* → Admin service
/* → Web service



8. Set Up CloudFront
bash# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
9. Configure Auto Scaling
bash# Create scaling policy
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/NeuralChat-cluster/NeuralChat-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name NeuralChat-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/NeuralChat-cluster/NeuralChat-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
10. Set Up Monitoring
Configure CloudWatch dashboards and alarms:
bash# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name NeuralChat-Production \
  --dashboard-body file://cloudwatch-dashboard.json

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name NeuralChat-high-cpu \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
Environment-Specific Configuration
Production
envNODE_ENV=production
API_URL=https://api.NeuralChat
WEB_URL=https://NeuralChat
ADMIN_URL=https://admin.NeuralChat
Staging
envNODE_ENV=staging
API_URL=https://staging-api.NeuralChat
WEB_URL=https://staging.NeuralChat
ADMIN_URL=https://staging-admin.NeuralChat
CI/CD Pipeline
GitHub Actions Workflow
See .github/workflows/deploy.yml for the complete pipeline.
Key stages:

Test - Run unit and integration tests
Build - Build Docker images
Push - Push to ECR
Deploy - Update ECS service

Manual Deployment
bash# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:production
Rollback Procedure
If issues occur after deployment:
Automatic Rollback
ECS automatically rolls back if health checks fail.
Manual Rollback
bash# List task definition revisions
aws ecs list-task-definitions --family-prefix NeuralChat-production

# Update service to previous version
aws ecs update-service \
  --cluster NeuralChat-cluster \
  --service NeuralChat-service \
  --task-definition NeuralChat-production:PREVIOUS_VERSION
Health Checks
Configure health check endpoints:

API: GET /api/v1/health
Web: GET /health
Admin: GET /api/health

ALB health check configuration:

Interval: 30 seconds
Timeout: 5 seconds
Healthy threshold: 2
Unhealthy threshold: 3

SSL/TLS Configuration

Request certificate in ACM
Validate domain ownership
Attach to ALB listeners
Configure security policies

Database Migration
For production deployments:
bash# Run migrations
npm run migrate:production

# Rollback if needed
npm run migrate:rollback:production
Monitoring and Alerts
Key Metrics to Monitor

Application:

Request rate
Error rate
Response time
Active users


Infrastructure:

CPU utilization
Memory usage
Network throughput
Container health


Business:

Sign-ups
Messages sent
Revenue
Churn rate



Alert Configuration
Critical alerts:

API error rate > 1%
Response time > 2s
CPU > 80%
Memory > 90%
Database connections > 80%

Security Checklist

 All secrets in Secrets Manager
 Security groups properly configured
 WAF rules enabled
 VPC properly isolated
 Encryption at rest enabled
 Backup strategy in place
 Disaster recovery plan tested
 Penetration testing completed

Cost Optimization

Use Fargate Spot for non-critical workloads
Configure auto-scaling based on actual usage
Use S3 lifecycle policies for old files
Reserved capacity for predictable workloads
Regular cost analysis and optimization

Troubleshooting
Common Issues

Container fails to start

Check CloudWatch logs
Verify environment variables
Check task role permissions


High latency

Check CloudWatch metrics
Review ALB target health
Analyze slow queries


Out of memory

Increase task memory
Check for memory leaks
Optimize application code



Useful Commands
bash# View service logs
aws logs tail /ecs/NeuralChat-api --follow

# Describe service
aws ecs describe-services \
  --cluster NeuralChat-cluster \
  --services NeuralChat-service

# Force new deployment
aws ecs update-service \
  --cluster NeuralChat-cluster \
  --service NeuralChat-service \
  --force-new-deployment
Support
For deployment support:

Check Troubleshooting Guide
Contact DevOps team
Open a support ticket

