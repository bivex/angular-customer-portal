#!/bin/bash

# Secure Production Build Script
# This script builds the Angular application with proper environment variable injection
# to prevent hardcoded secrets in the codebase.

set -e

echo "🔐 Building Angular application with secure environment variables..."
echo ""

# Required environment variables for production build
REQUIRED_VARS=(
  "API_URL"
  "AUTH0_DOMAIN"
  "AUTH0_CLIENT_ID"
  "AUTH0_REDIRECT_URI"
  "AUTH0_AUDIENCE"
  "SENTRY_DSN"
)

# Check if all required environment variables are set
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    MISSING_VARS+=("$var")
  fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
  echo "❌ ERROR: Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "💡 Set these variables before running the build:"
  echo "   export API_URL=https://your-api-domain.com"
  echo "   export AUTH0_DOMAIN=your-domain.auth0.com"
  echo "   export AUTH0_CLIENT_ID=your-client-id"
  echo "   export AUTH0_REDIRECT_URI=https://your-app.com"
  echo "   export AUTH0_AUDIENCE=your-api-audience"
  echo "   export SENTRY_DSN=https://your-sentry-dsn@sentry.io/project"
  exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Validate URLs
echo "🔍 Validating environment variable formats..."

# Validate API_URL
if ! [[ $API_URL =~ ^https?:// ]]; then
  echo "❌ ERROR: API_URL must be a valid HTTP/HTTPS URL"
  exit 1
fi

# Validate AUTH0_REDIRECT_URI
if ! [[ $AUTH0_REDIRECT_URI =~ ^https?:// ]]; then
  echo "❌ ERROR: AUTH0_REDIRECT_URI must be a valid HTTP/HTTPS URL"
  exit 1
fi

# Validate SENTRY_DSN
if ! [[ $SENTRY_DSN =~ ^https?:// ]]; then
  echo "❌ ERROR: SENTRY_DSN must be a valid HTTP/HTTPS URL"
  exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Create temporary environment file with actual values
TEMP_ENV_FILE="src/environments/environment.prod.temp.ts"

cat > "$TEMP_ENV_FILE" << EOF
// Production environment configuration
// This file is generated at build time - DO NOT EDIT MANUALLY
// Generated on: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

export const environment = {
  production: true,
  apiUrl: '$API_URL',
  version: '1.0.0',
  auth0: {
    domain: '$AUTH0_DOMAIN',
    clientId: '$AUTH0_CLIENT_ID',
    authorizationParams: {
      redirect_uri: '$AUTH0_REDIRECT_URI',
      audience: '$AUTH0_AUDIENCE',
    },
    errorPath: '/error',
  },
  sentry: {
    dsn: '$SENTRY_DSN',
  },
};
EOF

echo "📝 Generated temporary environment file: $TEMP_ENV_FILE"

# Backup original environment.prod.ts
cp src/environments/environment.prod.ts src/environments/environment.prod.ts.backup

# Replace with temporary file for build
cp "$TEMP_ENV_FILE" src/environments/environment.prod.ts

echo "🔨 Building Angular application..."

# Run Angular build
if npm run build -- --configuration=production; then
  echo "✅ Build completed successfully!"
else
  echo "❌ Build failed!"
  exit 1
fi

# Restore original environment.prod.ts
mv src/environments/environment.prod.ts.backup src/environments/environment.prod.ts

# Clean up temporary file
rm "$TEMP_ENV_FILE"

echo ""
echo "🎉 Production build completed with secure environment variables!"
echo "📦 Build output is in dist/keygen-customer-portal-frontend/"
echo ""
echo "🔒 Security notes:"
echo "   - No secrets were committed to version control"
echo "   - Environment variables were injected at build time"
echo "   - Original environment.prod.ts contains only placeholders"