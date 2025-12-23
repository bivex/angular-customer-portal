# Keygen Customer Portal Backend

A REST API backend for the Keygen Customer Portal built with [Elysia.js](https://elysiajs.com/) and [Bun](https://bun.com).

## Features

### Core Architecture
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **Hexagonal Architecture**: Ports and adapters pattern for testability and maintainability
- **CQRS Pattern**: Command Query Responsibility Segregation for optimal performance

### Advanced Security
- **Multi-layered Authentication**: JWT v1 (HS256) and JWT v2 (RS256) support with automatic key rotation
- **Attribute-Based Access Control (ABAC)**: Fine-grained permissions with dynamic policy evaluation
- **Risk Assessment Engine**: Real-time risk scoring based on IP reputation, geolocation, device fingerprinting, and user behavior
- **Session Management**: Secure session tracking with automatic cleanup and anomaly detection
- **Security Headers**: Comprehensive security headers middleware (CSP, HSTS, XSS protection)
- **Input Sanitization**: Automatic input validation and sanitization against XSS and injection attacks

### Monitoring & Observability
- **Built-in Health Checks**: Comprehensive system health monitoring with detailed metrics
- **Performance Monitoring**: Request/response timing, throughput, and error rate tracking
- **Sentry Integration**: Advanced error tracking with context and breadcrumbs
- **Custom Metrics**: Business logic metrics and security event monitoring
- **Structured Logging**: Pino-based logging with configurable levels and formats

### Database & Data Management
- **PostgreSQL with Drizzle ORM**: Type-safe database operations with migrations
- **Connection Pooling**: Efficient database connection management
- **Audit Logging**: Comprehensive audit trails for security and compliance
- **Data Validation**: Zod-based schema validation for all data operations

### API & Documentation
- **RESTful API Design**: Well-structured endpoints with consistent patterns
- **OpenAPI 3.0 Documentation**: Auto-generated interactive API documentation
- **JWKS Endpoint**: Public key distribution for JWT verification
- **Rate Limiting**: Configurable request rate limiting with sliding window
- **CORS Support**: Cross-origin resource sharing configuration

### Testing & Quality Assurance
- **Comprehensive Test Suite**: Unit tests, integration tests, and edge case testing
- **API Specification Testing**: Schemathesis-based specification compliance testing
- **Security Testing Scripts**: Automated security validation and penetration testing
- **Performance Testing**: Load testing and performance benchmarking tools

## Quick Start

### Install dependencies

```bash
bun install
```

### Environment Setup

**🔒 Security Note:** Never commit secrets to version control. Use the secure setup script:

```bash
# Automated secure setup (recommended)
./setup-env.sh

# Or manually copy the example
cp .env.example .env
```

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (must be valid URL format)
- `JWT_SECRET`: Cryptographically secure secret key for JWT v1 token signing (min 32 characters)
- `HOST`: Server host (default: localhost)
- `PORT`: Server port (default: 3000)

**JWT v2 Configuration (RS256):**
- `JWT_ACCESS_TOKEN_TTL`: Access token time-to-live in seconds (default: 900 - 15 minutes)
- `JWT_REFRESH_TOKEN_TTL`: Refresh token time-to-live in seconds (default: 604800 - 7 days)
- `JWT_ISSUER`: JWT issuer claim (default: keygen-portal)
- `JWT_AUDIENCE`: JWT audience claim (default: keygen-portal-api)
- `JWT_ALGORITHM`: JWT signing algorithm (default: RS256, options: HS256, RS256)
- `JWT_CLOCK_SKEW_TOLERANCE`: Clock skew tolerance in seconds (default: 60)

**Optional Environment Variables:**
- `NODE_ENV`: Environment mode (development/test/production, default: development)
- `JWT_EXPIRES_IN`: JWT v1 token expiration time (default: 24h)
- `SENTRY_DSN`: Sentry DSN for error tracking (optional)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 1000)

**🔐 Security Best Practices:**
- Use cryptographically secure random secrets (256+ bits)
- Store production secrets in a secure vault (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate secrets regularly
- Use different secrets for each environment (dev/staging/prod)
- Monitor for secret leakage in logs and code

### Database Setup

Generate and run database migrations:

```bash
bun run db:generate
bun run db:migrate
```

### Start Development Server

```bash
bun run dev
```

The server will start on `http://localhost:3000`.

## API Documentation

### Interactive Documentation

When running the server, visit `http://localhost:3000/openapi` to access the interactive Swagger UI documentation.

### OpenAPI Specification

The API automatically generates OpenAPI 3.0 specification based on route definitions:

- **JSON format**: `http://localhost:3000/openapi/json`
- **YAML format**: `http://localhost:3000/openapi/yaml`
- **Swagger UI**: `http://localhost:3000/openapi`

### Generate Static Files (Optional)

To generate static OpenAPI specification files for external use:

```bash
# Start the server first
bun run dev

# In another terminal, generate the specs
bun run api:docs
```

This will create `openapi.json` and `openapi.yaml` files in the project root.

## API Endpoints

### Authentication (Legacy - JWT v1)
- `POST /auth/login` - User login with email/password
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user information (requires authentication)
- `POST /auth/logout` - User logout (requires authentication)

### Authentication (Advanced - JWT v2 with Sessions)
- `POST /auth/v2/login` - Enhanced login with device fingerprinting and risk assessment
- `POST /auth/v2/register` - Enhanced registration with security validation
- `POST /auth/v2/refresh` - Refresh access tokens using refresh tokens
- `GET /auth/v2/sessions` - List active user sessions
- `DELETE /auth/v2/sessions/:sessionId` - Terminate specific session
- `GET /auth/v2/test-delete/:sessionId` - Test session deletion (development only)
- `GET /auth/v2/sessions/debug` - Debug session information (development only)

### Security & Identity
- `GET /.well-known/jwks.json` - JSON Web Key Set for JWT v2 token verification
- `POST /auth/v2/change-password` - Change user password with validation
- `PUT /auth/v2/update-user` - Update user profile information

### License Management
- `GET /protected/license` - Get user license information (requires authentication)
- `POST /protected/license` - Create or update license (requires authentication and proper permissions)

### System & Monitoring
- `GET /` - API information and version details
- `GET /health` - Comprehensive health check with system metrics
- `GET /metrics` - Performance metrics and monitoring data
- `GET /protected` - Example protected route demonstrating authentication

### Administration (Development/Testing)
- `GET /admin/debug/sessions` - Debug all active sessions (development only)
- `GET /admin/debug/users` - Debug user information (development only)

## Architecture

The codebase follows **Domain-Driven Design (DDD)** principles with **Hexagonal Architecture** and **CQRS** patterns:

```
src/
├── application/           # Application layer - use cases and services
│   ├── services/          # Application services (permissions, risk scoring, PDP)
│   └── use-cases/         # Use case implementations
├── domain/               # Domain layer - business logic and models
│   └── models/           # Domain entities and value objects
├── infrastructure/       # Infrastructure layer - external concerns
│   ├── auth/             # Authentication services (JWT v1/v2)
│   ├── crypto/           # Cryptographic operations and key management
│   ├── database/         # Data persistence layer
│   │   ├── repositories/ # Repository implementations
│   │   └── schema.ts     # Database schema definitions
│   └── crypto/           # Key management and encryption
├── shared/               # Shared kernel - cross-cutting concerns
│   ├── config.ts         # Environment configuration and validation
│   ├── logger.ts         # Structured logging
│   ├── monitoring.ts     # Health checks and metrics
│   ├── rate-limiter.ts   # Rate limiting logic
│   ├── sanitization.ts   # Input sanitization utilities
│   ├── sentry.ts         # Error tracking integration
│   └── session-cleanup-job.ts # Background session management
└── web/                  # Presentation layer - HTTP interface
    ├── controllers/      # HTTP request handlers
    ├── middleware/       # HTTP middleware (auth, security, rate limiting)
    └── routes/           # Route definitions
```

### Security Architecture

**Attribute-Based Access Control (ABAC):**
- **Policy Decision Point (PDP)**: Evaluates authorization requests against policies
- **Policy Enforcement Point (PEP)**: Enforces authorization decisions at endpoints
- **Permission Service**: Manages user permissions and role assignments
- **Risk Assessment**: Real-time security scoring for authentication decisions

**Authentication Flow:**
- **JWT v1 (HS256)**: Legacy symmetric key authentication
- **JWT v2 (RS256)**: Advanced asymmetric key authentication with key rotation
- **Session Management**: Secure session tracking with automatic cleanup
- **Device Fingerprinting**: Enhanced security through device identification

**Security Middleware Stack:**
1. **Rate Limiting**: Prevents brute force and DoS attacks
2. **Security Headers**: Comprehensive HTTP security headers
3. **Input Sanitization**: XSS and injection attack prevention
4. **Risk Assessment**: Behavioral analysis and anomaly detection
5. **Authorization**: ABAC-based permission checking

## Security Features

### Advanced Authentication
- **Dual JWT Support**: HS256 (symmetric) and RS256 (asymmetric) algorithms
- **Automatic Key Rotation**: Secure key management with configurable rotation
- **Session Management**: Secure session tracking with device fingerprinting
- **Multi-factor Risk Assessment**: Real-time security scoring during authentication

### Risk Assessment Engine
The system includes a comprehensive risk scoring engine that evaluates:

- **IP Reputation**: Blacklist/whitelist checking and geolocation analysis
- **Geolocation Anomalies**: Detection of unusual login locations
- **Time-based Patterns**: Analysis of login times and frequency
- **User Behavior**: Historical login patterns and account age analysis
- **Device Fingerprinting**: Browser and device characteristic analysis
- **Session Anomalies**: Detection of suspicious session patterns
- **Failed Attempt Tracking**: Brute force prevention and account lockout

### Attribute-Based Access Control (ABAC)
- **Dynamic Permissions**: Role-based and attribute-based permission evaluation
- **Policy Decision Point**: Centralized authorization logic
- **Fine-grained Control**: Object-level and operation-level permissions
- **Audit Logging**: Comprehensive security event logging

### Security Monitoring
- **Real-time Alerts**: Security event monitoring and alerting
- **Audit Trails**: Complete audit logging for compliance
- **Performance Monitoring**: Security-related performance metrics
- **Threat Detection**: Automated detection of suspicious activities

### Data Protection
- **Input Validation**: Comprehensive input sanitization and validation
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: HTML sanitization and content security policies
- **Cryptographic Security**: Secure password hashing and encryption

## Scripts

### Development & Production
- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production

### Database
- `bun run db:generate` - Generate database migrations from schema
- `bun run db:migrate` - Run pending database migrations
- `bun run db:push` - Push schema changes directly to database

### Testing & Validation
- `bun run test` - Run unit and integration tests
- `bun run api:docs` - Generate OpenAPI specification files

### Utility Scripts
- `node test-refresh-token-integration.js` - Test refresh token integration
- `node test-edge-cases.js` - Test edge cases and error scenarios
- `node validate-openapi.js` - Validate OpenAPI specification compliance
- `node add-default-permissions.js` - Initialize default permission structure

## Technologies

- **Runtime**: [Bun](https://bun.com)
- **Framework**: [Elysia.js](https://elysiajs.com/)
- **Database**: PostgreSQL with [Drizzle ORM](https://drizzle.team/)
- **Authentication**: JWT with bcrypt
- **Monitoring**: Custom metrics + [Sentry](https://sentry.io/)
- **API Documentation**: Auto-generated [OpenAPI 3.0](https://swagger.io/) via [@elysiajs/openapi](https://github.com/elysiajs/elysia-openapi)
- **API Testing**: [Schemathesis](https://schemathesis.io/) for specification compliance

## License

Licensed under the MIT License. See LICENSE file for details.
