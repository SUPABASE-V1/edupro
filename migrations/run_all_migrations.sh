#!/bin/bash

# Migration Runner Script
# Runs all pending migrations against Supabase database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="${DB_HOST:-aws-0-ap-southeast-1.pooler.supabase.com}"
DB_PORT="${DB_PORT:-6543}"
DB_USER="${DB_USER:-postgres.lvvvjywrmpcqrpvuptdi}"
DB_NAME="${DB_NAME:-postgres}"

# Migration directory
MIGRATIONS_DIR="$(dirname "$0")/pending"
COMPLETED_DIR="$(dirname "$0")/completed"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    EduDash Pro - Migration Runner     ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Create completed directory if it doesn't exist
mkdir -p "$COMPLETED_DIR"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo -e "  macOS: brew install postgresql"
    echo -e "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if password is set
if [ -z "$PGPASSWORD" ]; then
    echo -e "${YELLOW}⚠️  PGPASSWORD not set in environment${NC}"
    echo -e "${YELLOW}You will be prompted for password for each migration${NC}"
    echo -e "${BLUE}Tip: Set it with: export PGPASSWORD='your-password'${NC}"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Test database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed${NC}"
    echo -e "${YELLOW}Check your credentials and network connection${NC}"
    exit 1
fi
echo ""

# Count migrations
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No pending migrations found${NC}"
    exit 0
fi

echo -e "${BLUE}📋 Found $MIGRATION_COUNT pending migration(s)${NC}"
echo ""

# Run each migration
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        migration_name=$(basename "$migration_file")
        
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Running: ${migration_name}${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Run migration
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
            echo -e "${GREEN}✅ Success: ${migration_name}${NC}"
            
            # Move to completed
            mv "$migration_file" "$COMPLETED_DIR/"
            
            # Record success
            echo "$(date '+%Y-%m-%d %H:%M:%S') - SUCCESS - $migration_name" >> "$(dirname "$0")/migration_log.txt"
            
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}❌ Failed: ${migration_name}${NC}"
            
            # Record failure
            echo "$(date '+%Y-%m-%d %H:%M:%S') - FAILED - $migration_name" >> "$(dirname "$0")/migration_log.txt"
            
            FAIL_COUNT=$((FAIL_COUNT + 1))
            
            # Ask if continue
            echo -e "${YELLOW}Migration failed. Continue with remaining migrations? (y/n)${NC}"
            read -p "" -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${RED}Aborting remaining migrations${NC}"
                break
            fi
        fi
        
        echo ""
    fi
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Migration Summary             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some migrations failed. Check the output above.${NC}"
    exit 1
fi
