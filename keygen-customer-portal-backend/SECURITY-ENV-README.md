# 🔐 Security Environment Configuration Guide

## Overview

This guide explains how to securely configure environment variables for the Keygen Customer Portal to prevent security vulnerabilities related to hardcoded credentials.

## 🚨 Security Requirements

### Critical Security Variables (Required)
These variables **MUST** be set in production and should **NEVER** be hardcoded:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Authentication (Required - minimum 32 characters)
JWT_SECRET=your-super-secure-random-jwt-secret-here

# Server Configuration
HOST=your-domain.com
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Optional Security Variables
```bash
# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Additional JWT settings
JWT_EXPIRES_IN=24h
```

## 🛠️ Setup Instructions

### 1. Development Setup
```bash
# Run the secure setup script
./setup-env.sh

# This will generate secure random secrets and create a .env file
```

### 2. Production Setup

#### Option A: Environment Variables (Recommended)
Set environment variables directly in your deployment platform:

**Docker:**
```dockerfile
ENV DATABASE_URL=postgresql://...
ENV JWT_SECRET=your-secure-secret
ENV NODE_ENV=production
```

**Kubernetes:**
```yaml
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: database-url
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: jwt-secret
```

**Vercel/Netlify:**
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

#### Option B: Secrets Management Services
Use enterprise-grade secrets management:

- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **HashiCorp Vault**
- **Doppler, Infisical**

Example with AWS Secrets Manager:
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

## 🔍 Security Validation

### Automated Validation
The application automatically validates environment variables at startup:

```typescript
// In src/shared/config.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // ... other validations
});
```

### Manual Validation
```bash
# Test JWT secret strength
node -e "console.log(process.env.JWT_SECRET.length >= 32 ? '✅ JWT_SECRET is secure' : '❌ JWT_SECRET too short')"

# Test database URL format
node -e "try { new URL(process.env.DATABASE_URL); console.log('✅ DATABASE_URL is valid') } catch { console.log('❌ DATABASE_URL invalid') }"
```

## 📋 Security Checklist

### Environment Setup
- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Environment variables validated at startup
- [ ] Secrets are randomly generated (not predictable)

### Production Deployment
- [ ] Secrets managed by dedicated service
- [ ] Environment variables set in deployment platform
- [ ] No `.env` files in production containers
- [ ] Secrets rotated regularly

### Monitoring & Auditing
- [ ] Secret leakage monitoring enabled
- [ ] Audit logs for environment access
- [ ] Regular security scans performed

## 🚫 Common Security Mistakes to Avoid

### ❌ Don't Do This:
```typescript
// WRONG: Hardcoded secrets
const JWT_SECRET = 'my-secret-key';

// WRONG: Default secrets in production
JWT_SECRET: process.env.JWT_SECRET || 'default-secret'
```

### ✅ Do This:
```typescript
// CORRECT: Required environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
```

## 🔄 Secret Rotation

### Automated Rotation
```bash
# Generate new JWT secret
NEW_SECRET=$(openssl rand -base64 32)

# Update environment
export JWT_SECRET=$NEW_SECRET

# Restart application
docker-compose restart app
```

### Zero-Downtime Rotation
1. Deploy new version with both old and new secrets
2. Update environment variable
3. Remove old secret support after grace period

## 📊 Security Metrics

Monitor these security indicators:

- Environment variable validation errors
- Failed authentication attempts
- Unusual rate limiting patterns
- Secret leakage alerts

## 🆘 Troubleshooting

### "Environment variable X is required"
- Check that all required environment variables are set
- Verify variable names match exactly (case-sensitive)
- Ensure no extra whitespace in values

### "JWT_SECRET too short"
- Generate a secure 32+ character random string
- Use `openssl rand -base64 32` for generation
- Never use predictable patterns

### Database connection fails
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Ensure database server is accessible
- Check firewall and network settings

## 📚 Additional Resources

- [OWASP Environment Configuration](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/)
- [12 Factor App Config](https://12factor.net/config)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Remember**: Security is an ongoing process. Regularly audit your environment configuration and update secrets according to your organization's security policy.