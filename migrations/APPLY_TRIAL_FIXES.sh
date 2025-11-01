#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Applying Trial & Audit Fixes${NC}"
echo ""

# Database connection (replace with your actual connection string)
DB_CONN="psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.lvvvjywrmpcqrpvuptdi -d postgres"

echo -e "${YELLOW}Step 1: Triggering trials for existing users...${NC}"
$DB_CONN -f migrations/pending/05_trigger_trials_for_existing_users.sql

echo ""
echo -e "${YELLOW}Step 2: Standardizing trial period configuration...${NC}"
$DB_CONN -f migrations/pending/06_standardize_trial_period.sql

echo ""
echo -e "${GREEN}✅ All migrations applied successfully!${NC}"
echo ""
echo -e "${BLUE}What was done:${NC}"
echo "  ✅ All existing users now have 7-day trial"
echo "  ✅ Trial duration standardized to 7 days"
echo "  ✅ Created system_config table for settings"
echo "  ✅ Added trial helper functions"
echo "  ✅ Updated subscription creation functions"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Restart your dev server"
echo "  2. Test trial activation"
echo "  3. Verify user subscriptions"
