# Support KB RAG System

A production-ready Retrieval-Augmented Generation (RAG) system for customer support knowledge bases with multi-provider LLM support.

## Quick Start

```bash
# 1. Clone and navigate to project
git clone <repository>
cd support-kb-rag

# 2. Setup environment variables
# Navigate to the api directory and copy the sample environment file
cd api
cp .env.sample .env
# Edit .env file and add your API keys and configuration
cd ..

# 3. Set environment variables (optional for Docker Compose)
export GEMINI_API_KEY=your_gemini_key
export GROQ_API_KEY=your_groq_key

# 4. Start all services with Docker Compose
docker-compose up -d

# 5. Wait for services to be healthy (30 seconds)
sleep 30

# 6. Seed sample data
./seed.sh

# 7. Access the application
open http://localhost:3000
```

## Environment Configuration

### Setting up .env file

The project includes a `.env.sample` file in the `api` directory that contains all the required environment variables with placeholder values. To configure your environment:

1. Navigate to the `api` directory
2. Copy `.env.sample` to `.env`:
   ```bash
   cp .env.sample .env
   ```
3. Edit the `.env` file and replace the placeholder values with your actual configuration:
   - Add your MongoDB connection string
   - Add your Gemini API key (if using Google Gemini)
   - Add your Groq API key (if using Groq)
   - Adjust other settings as needed

## Environment Variables

### Required
- `MONGO_URI` - MongoDB connection string (default: provided in docker-compose)
- `PORT` - API server port (default: 4000)
- `NEXT_PUBLIC_API_URL` - Frontend API URL (default: http://localhost:4000)

### Optional LLM Providers
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key
- `DEFAULT_MODEL` - Default LLM provider: mock|gemini|groq (default: mock)
- `ENABLED_MODELS` - Comma-separated enabled models (default: mock,gemini,groq)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX` - Maximum requests per window (default: 60)

## Features

- **Multi-Provider Support**: Mock, Gemini, Groq LLM providers with automatic fallback
- **Document Processing**: PDF and Markdown ingestion with intelligent chunking
- **Semantic Search**: Vector embeddings for accurate knowledge retrieval
- **Citation Tracking**: Source attribution for all RAG responses
- **Ticket Management**: Import and search support tickets
- **Evaluation Framework**: Built-in accuracy and latency testing
- **Real-time Streaming**: Server-sent events for chat responses

## API Documentation

Swagger UI available at: http://localhost:4000/api-docs

## Seeding Data

The project includes sample data to help you get started quickly:

### Using the Seed Script (Recommended)
```bash
# After starting services with docker-compose
./seed.sh
```

This script will:
1. Upload a sample knowledge base document (`sample-data/sample-kb-document.md`)
2. Import sample support tickets (`sample-data/sample-tickets.csv`)
3. Populate the database with test data

### Manual Seeding
You can also seed data manually through the UI:
1. Navigate to http://localhost:3000/upload
2. Upload knowledge base documents (PDF or Markdown)
3. Navigate to http://localhost:3000/tickets
4. Import support tickets (CSV format)

### Sample Data Structure
- **Knowledge Base Document**: Contains FAQs, troubleshooting guides, and product information
- **Support Tickets**: CSV with columns: ticketId, subject, description, status, priority, createdAt, resolvedAt

## Development

```bash
# Install dependencies
npm install

# Run in development mode (without Docker)
npm run dev

# Run API only
npm run dev:api

# Run Web only
npm run dev:web
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow details.
