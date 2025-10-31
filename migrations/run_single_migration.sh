#!/bin/bash

# Single Migration Runner
# Usage: ./run_single_migration.sh path/to/migration.sql

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection
DB_HOST="${DB_HOST:-aws-0-ap-southeast-1.pooler.supabase.com}"
DB_PORT="${DB_PORT:-6543}"
DB_USER="${DB_USER:-postgres.lvvvjywrmpcqrpvuptdi}"
DB_NAME="${DB_NAME:-postgres}"

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No migration file specified${NC}"
    echo -e "Usage: $0 <migration_file.sql>"
    exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Running migration: $(basename "$MIGRATION_FILE")${NC}"
echo ""

# Check for password
if [ -z "$PGPASSWORD" ]; then
    echo -e "${RED}⚠️  PGPASSWORD not set${NC}"
    echo -e "Set it with: export PGPASSWORD='your-password'"
    echo ""
fi

# Run migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
