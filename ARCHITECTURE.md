# System Architecture

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        UI[React UI<br/>Port 3000]
        CS[Chat Interface]
        US[Upload Interface]
        TS[Tickets Interface]
    end
    
    subgraph "Backend - Express API"
        API[REST API<br/>Port 4000]
        MW[Middleware<br/>Rate Limiter, Metrics]
        
        subgraph "Services"
            RAG[RAG Service]
            CHUNK[Chunking Service]
            UPLOAD[Upload Pipeline]
            EVAL[Evaluation Service]
        end
        
        subgraph "Providers"
            MOCK[Mock Provider]
            GEMINI[Gemini Provider]
            GROQ[Groq Provider]
        end
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Port 27017)]
        DOCS[Documents]
        CHUNKS[Chunks + Embeddings]
        TICKETS[Tickets]
        EVALS[Evaluations]
    end
    
    UI --> API
    API --> MW
    MW --> RAG
    MW --> UPLOAD
    RAG --> CHUNK
    RAG --> MOCK
    RAG --> GEMINI
    RAG --> GROQ
    UPLOAD --> CHUNK
    CHUNK --> MONGO
    RAG --> MONGO
    MONGO --> DOCS
    MONGO --> CHUNKS
    MONGO --> TICKETS
    MONGO --> EVALS
```

## RAG Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant RAG
    participant Embeddings
    participant MongoDB
    participant LLM
    
    User->>Web: Submit Query
    Web->>API: POST /chat
    API->>RAG: performRAGQuery()
    
    RAG->>Embeddings: Generate query embedding
    Embeddings-->>RAG: Vector [n dimensions]
    
    RAG->>MongoDB: Find similar chunks
    Note over MongoDB: Cosine similarity search
    MongoDB-->>RAG: Top 5 chunks
    
    RAG->>RAG: Build context from chunks
    RAG->>LLM: Chat with context
    
    loop Streaming
        LLM-->>RAG: Token
        RAG-->>API: SSE Token
        API-->>Web: Stream Token
        Web-->>User: Display Token
    end
    
    RAG-->>API: Citations
    API-->>Web: Complete Response
    Web-->>User: Show Citations
```

## Document Processing Pipeline

```mermaid
flowchart LR
    A[Document Upload] --> B{File Type}
    B -->|PDF| C[PDF Extraction]
    B -->|Markdown| D[MD Processing]
    
    C --> E[Text Content]
    D --> E
    
    E --> F[Chunking Service]
    F --> G[Text Chunks<br/>500 chars, 50 overlap]
    
    G --> H[Embeddings Provider]
    H --> I[Vector Embeddings]
    
    I --> J[(Store in MongoDB)]
    J --> K[Ready for RAG]
```

## Key Components

### API Layer
- **Express Server**: RESTful API with Swagger documentation
- **Middleware**: Rate limiting (60 req/min), Prometheus metrics
- **Routes**: /chat, /upload, /tickets, /eval, /providers

### Service Layer
- **RAG Service**: Query orchestration, context building, citation extraction
- **Chunking Service**: Intelligent text segmentation with overlap
- **Upload Pipeline**: Multi-stage document processing
- **Evaluation Service**: Accuracy and latency benchmarking

### Provider Layer
- **Factory Pattern**: Dynamic provider selection with fallback
- **Mock Provider**: Development/testing with synthetic responses
- **Gemini Provider**: Google's Gemini API integration
- **Groq Provider**: Groq LLM API integration

### Data Models
- **Documents**: Uploaded files with processing status
- **Chunks**: Text segments with embeddings and metadata
- **Tickets**: Support tickets for similarity matching
- **Evaluations**: Test results for system performance

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API design enables multi-instance deployment
2. **Vector Database**: Migration path to dedicated vector DB (Pinecone/Weaviate)
3. **Caching Layer**: Redis integration for embedding cache
4. **Queue System**: Background job processing for large documents
5. **CDN Integration**: Static asset delivery optimization