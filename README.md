<div align="center">
  <h1>🤖 NeuralChat</h1>
  <p>Advanced AI Chat Platform with Claude and Grok Integration</p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.5+-blue)](https://www.typescriptlang.org/)
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 🌟 Features

### 💬 AI Chat Capabilities
- **Claude Integration** - Access to Claude 4 Opus, Sonnet, and 3.5 Sonnet models
- **Grok Integration** - Experience Grok's unique perspective with Grok 3 and Grok 2
- **Brainstorm Mode** 🆕 - Watch Claude and Grok collaborate on your ideas
- **Real-time Streaming** - Get instant responses with WebSocket support
- **File Attachments** - Upload images, documents, and code files
- **Artifacts Support** - Code blocks, React components, SVG, and more

### 📁 Project Management
- **Organize Chats** - Group related conversations in projects
- **Context Files** - Provide persistent context to AI assistants
- **Collaboration** - Share projects with team members
- **File Storage** - Secure cloud storage with AWS S3

### 💎 Premium Features
- **Flexible Plans** - Free, Pro ($19/mo), and Business ($49/mo) tiers
- **Usage Tracking** - Monitor your AI usage and costs
- **API Access** - Programmatic access for Business users
- **Priority Support** - Get help when you need it

### 🔐 Security & Privacy
- **End-to-End Encryption** - Your data is secure
- **OAuth Integration** - Sign in with Google or Apple
- **2FA Support** - Extra security for your account
- **GDPR Compliant** - Full data privacy compliance

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** - Fast and scalable API server
- **MongoDB Atlas** - Cloud-native database
- **Redis** - High-performance caching
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Secure authentication
- **AWS S3** - File storage
- **Stripe** - Payment processing

### Frontend
- **React 18** - Modern UI framework
- **Material-UI** - Beautiful components
- **TypeScript** - Type-safe development
- **React Query** - Powerful data synchronization
- **Socket.io Client** - Real-time updates

### Infrastructure
- **AWS Amplify** - Frontend hosting
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Cloudflare** - CDN and DDoS protection

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuralchat.git
   cd neuralchat

Run setup script
bashchmod +x scripts/setup.sh
./scripts/setup.sh

Configure environment variables
Edit packages/api/.env:
env# Database
MONGODB_URI=mongodb://localhost:27017/neuralchat
REDIS_URL=redis://localhost:6379

# AI Services
ANTHROPIC_API_KEY=your-claude-api-key
GROK_API_KEY=your-grok-api-key

# Add other required variables...
Edit packages/web/.env:
envREACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000

# Add other required variables...

Start development servers
bashnpm run dev

Access the application

Web: http://localhost:3000
API: http://localhost:5000



Project Structure
neuralchat/
├── packages/
│   ├── api/          # Backend API server
│   ├── web/          # React web application
│   └── shared/       # Shared types and utilities
├── scripts/          # Build and deployment scripts
├── docs/            # Documentation
└── README.md
🌐 Deployment
Production Deployment

Set up AWS services

Create AWS account
Set up Amplify for frontend hosting
Configure S3 for file storage
Set up CloudFront for CDN


Configure environment
bashexport AWS_PROFILE=your-profile
export ENVIRONMENT=production

Run deployment
bashchmod +x scripts/deploy.sh
./scripts/deploy.sh production


Environment Variables
See .env.example files in each package for required variables.
📖 API Documentation
Authentication
typescriptPOST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
Chat Operations
typescriptGET    /api/v1/chats
POST   /api/v1/chats
GET    /api/v1/chats/:id
PUT    /api/v1/chats/:id
DELETE /api/v1/chats/:id
Messages
typescriptGET    /api