#!/bin/bash
# Setup script for ShareMyAd database migrations

set -e

echo "🚀 Setting up ShareMyAd database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it:"
    echo "   npm install -g supabase"
    exit 1
fi

# Project details
PROJECT_REF="gnurilaiddffxfjujegu"
PROJECT_URL="https://gnurilaiddffxfjujegu.supabase.co"

echo ""
echo "📋 Project Information:"
echo "   URL: $PROJECT_URL"
echo "   Ref: $PROJECT_REF"
echo ""

# Check if already linked
if [ -f ".supabase/config.json" ]; then
    echo "✅ Project already linked"
else
    echo "🔗 Linking to Supabase project..."
    echo ""
    echo "⚠️  You need to authenticate first. Please follow these steps:"
    echo ""
    echo "1. Get your access token:"
    echo "   - Go to: https://supabase.com/dashboard/account/tokens"
    echo "   - Click 'Generate new token'"
    echo "   - Copy the token (starts with 'sbp_')"
    echo ""
    echo "2. Run this command with your token:"
    echo "   supabase link --project-ref $PROJECT_REF --password 'TSFBFlorida@Boy223!!'"
    echo ""
    echo "3. Then run this script again"
    exit 0
fi

# Apply migrations
echo "📦 Applying database migrations..."
cd "$(dirname "$0")/.."
supabase db push

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Install frontend dependencies: cd frontend && npm install"
echo "2. Start frontend dev server: npm run dev"
echo "3. Deploy edge functions: supabase functions deploy process-upload"
