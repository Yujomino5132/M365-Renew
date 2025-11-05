#!/bin/bash

set -e

echo "Initializing BrowserWorker resources..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create D1 database
echo "Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create browser-worker-db)
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -n "$DB_ID" ]; then
    echo "Database created with ID: $DB_ID"
    
    # Update wrangler.jsonc with the actual database ID
    sed -i "s/REPLACE_WITH_ACTUAL_DATABASE_ID/$DB_ID/g" wrangler.jsonc
    echo "Updated wrangler.jsonc with database ID"
    
    # Apply migrations
    echo "Applying database migrations..."
    npx wrangler d1 migrations apply browser-worker-db
    
    echo "✅ Database setup complete!"
else
    echo "❌ Failed to extract database ID. Please manually update wrangler.jsonc"
fi

# Create Cloudflare secret for AES-GCM key
echo "Creating Cloudflare secret for AES-GCM key..."
echo "You will be prompted to enter the AES-GCM key value."
echo "You can generate one by calling the /api/admin/generate-key endpoint after deployment."
npx wrangler secret put AES_GCM_KEY --name browser-worker

echo ""
echo "🎉 Initialization complete!"
echo ""
echo "Next steps:"
echo "1. Deploy the worker: npm run deploy"
echo "2. Call /api/admin/generate-key to generate an AES key"
echo "3. Update the AES_GCM_KEY secret with the generated key"
echo "4. Start using the credential storage endpoints"
