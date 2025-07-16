# WhatsApp Flow Backend

Backend middleware for WhatsApp Flow Builder - handles Meta API integration, validation, and flow management.

## Features

- 🔐 JWT-based authentication with role-based access control
- 🚀 Express.js API with TypeScript
- 📊 PostgreSQL, MongoDB, Redis, and Elasticsearch integration
- 🔄 Real-time collaboration via WebSocket
- 📝 Comprehensive logging and error handling
- 🧪 Test-driven development setup
- 🐳 Docker development environment
- 📈 Health checks and monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Development Setup

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development environment:**
```bash
npm run docker:dev
```

4. **Run the application:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### API Endpoints

- `GET /` - API information
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/flows` - Get user flows
- `POST /api/v1/flows` - Create new flow
- `POST /api/v1/flows/:id/deploy` - Deploy flow to Meta API

### Database Schema

The application uses multiple databases:

- **PostgreSQL**: User data, flows, analytics
- **MongoDB**: Templates, library items
- **Redis**: Caching, sessions, rate limiting
- **Elasticsearch**: Search functionality

### Architecture

```
src/
├── config/          # Database and service configurations
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # API route definitions
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── test/            # Test setup and utilities
```

## Development

### Adding New Features

1. Create feature branch
2. Add tests first (TDD approach)
3. Implement feature
4. Update documentation
5. Submit pull request

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Debugging

The development server runs with debugging enabled on port 9229. You can attach your debugger to this port.

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Start the server:
```bash
npm start
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Follow conventional commit messages

## License

MIT License - see LICENSE file for details