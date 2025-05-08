# Vision Forge Backend

Vision Forge is a comprehensive platform for creating, managing, and publishing AI-generated video content. This repository contains the backend services built with NestJS.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [License](#license)

## Features

- **User Authentication**: Support for local authentication strategy, JWT tokens, and Google OAuth
- **YouTube Integration**: Upload, analyze and manage YouTube videos
- **Content Management**: Handle videos, scripts, images, and audio files
- **Content Generation Flow**: Orchestrated process for generating video content
- **Publisher System**: Mechanisms to publish content to various platforms
- **Analytics**: Track performance of published content

## Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Queue Processing**: Bull with Redis
- **Authentication**: Passport.js with JWT, Local, and Google strategies
- **API Documentation**: Swagger
- **Testing**: Jest

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v20.x or higher)
- npm (v10.x or higher)
- Docker and Docker Compose (for running Redis and PostgreSQL)
- Git

## Installation

- 1. Clone the repository:

```bash
git clone <repository-url>
cd vision-forge-backend
```

- 2. Install dependencies:

```bash
npm install
```

- 3. Start the required services using Docker Compose:

```bash
docker-compose up -d
```

- 4. Set up the database:

```bash
npx prisma generate
npx prisma migrate dev
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vision_forge?schema=public"

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=60m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# AI Services
AI_API_URL=your_ai_service_url
AI_API_KEY=your_ai_service_key
```

Adjust these values according to your development environment.

## Running the Application

### Development Mode

```bash
# Start the development server with hot reload
npm run start:dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

This provides a comprehensive overview of all available endpoints and their usage.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

The application follows a modular architecture:

```
src/
├── app.module.ts            # Main application module
├── main.ts                  # Application entry point
├── modules/                 # Feature modules
│   ├── auth/                # Authentication module
│   ├── users/               # User management
│   ├── youtube/             # YouTube integration
│   ├── videos/              # Video management
│   ├── scripts/             # Script management
│   ├── images/              # Image management
│   ├── audios/              # Audio management
│   ├── flow/                # Content generation workflow
│   └── publisher/           # Publishing system
├── common/                  # Shared utilities, guards, etc.
├── config/                  # Configuration files
├── database/                # Database related files
└── ai/                      # AI integration
```

## License

[MIT](LICENSE)
