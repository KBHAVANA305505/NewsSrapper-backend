# NewsHub Backend API

A modern, scalable backend for the NewsHub platform featuring automated news scraping, AI-powered content rewriting, plagiarism detection, and real-time content moderation.

## Features

- **Automated News Scraping**: RSS/HTML scraping from multiple sources every 5 minutes
- **AI Content Processing**: Automated content rewriting for neutral, factual reporting
- **Plagiarism Detection**: Advanced plagiarism checking with <20% threshold
- **Content Moderation**: AI-powered content moderation for harmful material
- **User Authentication**: JWT-based authentication with role-based access control
- **Real-time Processing**: Background job processing with BullMQ and Redis
- **Caching**: Redis caching for optimal performance
- **RESTful APIs**: Clean, well-documented REST APIs with Swagger documentation
- **Security**: Comprehensive security measures including rate limiting and input validation

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schema validation
- **AI Processing**: z-ai-web-dev-sdk integration
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Redis 6+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/newshub
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   AI_API_KEY=your-ai-api-key
   PLAGIARISM_API_KEY=your-plagiarism-api-key
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start services**
   
   **Option A: Local Development**
   ```bash
   # Start MongoDB and Redis (if not running)
   mongod
   redis-server
   
   # Build the project
   npm run build
   
   # Start the API server
   npm run dev
   
   # In another terminal, start the worker
   npm run worker
   ```
   
   **Option B: Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Access the API**
   - API Server: http://localhost:3001
   - Health Check: http://localhost:3001/health
   - API Documentation: http://localhost:3001/api-docs

## API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at `/api-docs` when the server is running.

### Key Endpoints

#### Public APIs
- `GET /api/public/health` - Health check
- `GET /api/public/articles` - List articles with filtering
- `GET /api/public/articles/:slug` - Get single article
- `GET /api/public/categories` - List categories
- `GET /api/public/trending` - Get trending articles
- `GET /api/public/ticker/active` - Get active tickers

#### Authentication APIs
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get user profile (requires auth)
- `POST /api/auth/me/save/:articleId` - Save article (requires auth)
- `POST /api/auth/me/history/:articleId` - Add to history (requires auth)

#### Admin/Editor APIs
- `POST /api/admin/articles` - Create article
- `PATCH /api/admin/articles/:id` - Update article
- `POST /api/admin/articles/:id/publish` - Publish article
- `POST /api/admin/sources` - Create/update source
- `GET /api/admin/sources` - List sources
- `POST /api/admin/ingest/run` - Trigger scraping

## Data Models

### User
```typescript
{
  email: string;
  passwordHash: string;
  role: 'reader' | 'editor' | 'admin';
  savedArticles: ObjectId[];
  readingHistory: ObjectId[];
}
```

### Article
```typescript
{
  title: string;
  slug: string;
  summary: string;
  content: string;
  images: string[];
  category: ObjectId;
  tags: string[];
  author: string;
  lang: string;
  sourceId: ObjectId;
  status: 'draft' | 'published' | 'rejected';
  aiInfo: {
    rewritten: boolean;
    plagiarismScore: number;
  };
  seo: {
    metaDescription: string;
    keywords: string[];
  };
  publishedAt?: Date;
  viewCount: number;
  hash: string;
}
```

### Category
```typescript
{
  key: string;
  label: string;
  icon: string;
  color: string;
  parent?: ObjectId;
  order: number;
}
```

### Source
```typescript
{
  name: string;
  url: string;
  rssUrls: string[];
  lang: string;
  categories: ObjectId[];
  active: boolean;
  lastScraped?: Date;
}
```

## Background Jobs

The system uses BullMQ for background job processing:

### Job Types
1. **Scraping** - Fetches news from RSS/HTML sources
2. **AI Rewriting** - Rewrites content for neutral tone
3. **Plagiarism Check** - Checks for plagiarism
4. **Content Moderation** - Moderates content for harmful material
5. **Publishing** - Publishes approved articles

### Job Schedule
- Scraping runs every 5 minutes automatically
- Other jobs are queued as needed based on article processing

### Worker Management
```bash
# Start worker
npm run worker

# View job queues (Redis CLI)
redis-cli
> KEYS bull:*
```

## Security Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Authorization**: Role-based access control (reader/editor/admin)
- **Rate Limiting**: IP-based rate limiting with configurable windows
- **Input Validation**: Zod schema validation for all inputs
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS policies
- **Input Sanitization**: Automatic input sanitization and XSS prevention

## Performance Optimization

- **Caching**: Redis caching for frequently accessed data
- **Database Indexes**: Optimized MongoDB indexes for queries
- **Pagination**: Efficient pagination for large datasets
- **Connection Pooling**: MongoDB and Redis connection pooling
- **Compression**: Gzip compression for responses
- **ETag Support**: Conditional requests for caching

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
- `tests/unit/` - Unit tests for services and utilities
- `tests/integration/` - Integration tests for API endpoints
- `tests/e2e/` - End-to-end tests (optional)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `AI_API_KEY` | AI service API key | Required |
| `PLAGIARISM_API_KEY` | Plagiarism check API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Docker Deployment

### Build and Run
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Service Architecture
- **API**: Main REST API server
- **Worker**: Background job processor
- **MongoDB**: Primary database
- **Redis**: Caching and job queue
- **Nginx**: Reverse proxy (optional)

## Monitoring and Logging

### Logging
- Winston logger with multiple transports
- Log levels: error, warn, info, debug
- File and console outputs
- Structured logging with JSON format

### Health Checks
- `/health` endpoint for service health
- Docker health checks for containers
- Database connection monitoring

### Job Monitoring
- BullMQ dashboard for job monitoring
- Job logs in MongoDB collection
- Redis-based job metrics

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers
│   ├── jobs/           # Background job processors
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── index.ts        # Main application
│   └── worker.ts       # Background worker
├── tests/              # Test files
├── scripts/            # Database scripts
├── logs/               # Log files
├── docker-compose.yml  # Docker configuration
├── Dockerfile         # Docker configuration
└── package.json       # Dependencies
```

### Adding New Features

1. **New API Endpoint**
   - Add route in appropriate route file
   - Create controller method
   - Add service method if needed
   - Update Swagger documentation
   - Write tests

2. **New Background Job**
   - Add job processor in `jobs/`
   - Update BullMQ configuration
   - Add job scheduling logic
   - Write tests

3. **New Data Model**
   - Create model in `models/`
   - Update indexes as needed
   - Add validation schemas
   - Update seed script

## Production Deployment

### Prerequisites
- MongoDB cluster (Atlas or self-hosted)
- Redis cluster (ElastiCache or self-hosted)
- Load balancer (Nginx, ALB, etc.)
- SSL/TLS certificates
- Monitoring and logging system

### Environment Setup
1. Set production environment variables
2. Configure SSL/TLS
3. Set up monitoring and alerts
4. Configure backup strategies
5. Set up CI/CD pipeline

### Scaling Considerations
- Horizontal scaling for API servers
- Redis cluster for job queues
- MongoDB read replicas
- CDN for static assets
- Database sharding for large datasets

## Troubleshooting

### Common Issues

**MongoDB Connection Issues**
```bash
# Check MongoDB status
mongod --status

# Verify connection string
mongo "mongodb://user:pass@host:port/dbname"
```

**Redis Connection Issues**
```bash
# Check Redis status
redis-cli ping

# Verify connection
redis-cli -h host -p port
```

**Job Queue Issues**
```bash
# Check Redis queues
redis-cli KEYS "bull:*"

# Monitor job stats
redis-cli HGETALL bull:scraping:meta
```

### Performance Issues
- Monitor memory usage
- Check database query performance
- Review job queue backlog
- Analyze response times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

---

**NewsHub Backend** - A modern, scalable news platform backend with AI-powered content processing.