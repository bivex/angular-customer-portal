# Angular Customer Portal

Enterprise-grade user management. Single Page Application built with Angular.

## Architecture

The project consists of two main components:

- **Frontend** - Angular SPA with Tailwind CSS
- **Backend** (`keygen-customer-portal-backend/`) - Node.js API server with key management

## Getting Started

### Backend

```bash
cd keygen-customer-portal-backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### Frontend

```bash
npm install
npm start
```

## Environment Setup

See `keygen-customer-portal-backend/.env.example` for required environment variables. Refer to `keygen-customer-portal-backend/SECURITY-ENV-README.md` for security configuration details.

## License

See [LICENSE](LICENSE) for details.
