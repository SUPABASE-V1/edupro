# 🗄️ Database Migrations

This directory contains all database migrations for EduDash Pro.

---

## 📁 Directory Structure

```
migrations/
├── pending/          # Migrations not yet run
├── completed/        # Successfully executed migrations
├── run_all_migrations.sh        # Run all pending migrations
├── run_single_migration.sh      # Run a single migration
├── migration_log.txt            # Execution log
└── README.md         # This file
```

---

## 🚀 Quick Start

### Option 1: Run All Pending Migrations (Recommended)

```bash
# Set your database password
export PGPASSWORD='your-supabase-password'

# Run all pending migrations
cd migrations
chmod +x run_all_migrations.sh
./run_all_migrations.sh
```

### Option 2: Run Single Migration

```bash
# Set your database password
export PGPASSWORD='your-supabase-password'

# Run specific migration
chmod +x run_single_migration.sh
./run_single_migration.sh pending/01_guest_mode_rate_limiting.sql
```

### Option 3: Manual psql Command

```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f pending/01_guest_mode_rate_limiting.sql
```

---

## 📋 Current Pending Migrations

1. **01_guest_mode_rate_limiting.sql**
   - Purpose: Backend rate limiting for guest users
   - Creates: `guest_usage_log` table
   - Functions: `check_guest_limit()`, `log_guest_usage()`
   - Impact: Security - prevents free tier abuse

2. **02_fix_trial_period_to_7_days.sql**
   - Purpose: Update trial period from 14 to 7 days
   - Updates: `create_trial_subscription()` function
   - Impact: Trial consistency across system

---

## 🔐 Database Connection Details

**Connection String**:
```
Host: aws-0-ap-southeast-1.pooler.supabase.com
Port: 6543
User: postgres.lvvvjywrmpcqrpvuptdi
Database: postgres
```

**Setting Password**:

**Bash/Linux/macOS**:
```bash
export PGPASSWORD='your-password'
```

**Windows CMD**:
```cmd
set PGPASSWORD=your-password
```

**Windows PowerShell**:
```powershell
$env:PGPASSWORD="your-password"
```

---

## 📝 Step-by-Step Instructions

### For Complete Beginners

1. **Install PostgreSQL Client** (if not installed):
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Get Your Database Password**:
   - Go to Supabase Dashboard
   - Project Settings → Database
   - Copy "Database password"

3. **Navigate to Migrations Folder**:
   ```bash
   cd /workspace/migrations
   ```

4. **Set Password in Terminal**:
   ```bash
   export PGPASSWORD='paste-your-password-here'
   ```

5. **Make Scripts Executable**:
   ```bash
   chmod +x run_all_migrations.sh
   chmod +x run_single_migration.sh
   ```

6. **Run Migrations**:
   ```bash
   ./run_all_migrations.sh
   ```

7. **Verify Success**:
   - Look for green ✅ messages
   - Check `migration_log.txt` for records
   - Migrations move from `pending/` to `completed/`

---

## ✅ Migration Checklist

Before running migrations:
- [ ] Backup database (optional but recommended)
- [ ] Have database password ready
- [ ] Verify connection (script does this automatically)
- [ ] Review migration files (read what they do)
- [ ] Run on staging first (if available)

After running migrations:
- [ ] Check for success messages
- [ ] Verify tables/functions created
- [ ] Test affected features
- [ ] Update documentation
- [ ] Notify team

---

## 🔍 Verifying Migrations

After running, verify with psql:

```bash
# Connect to database
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres

# Check if guest_usage_log table exists
\dt guest_usage_log

# Check if functions exist
\df check_guest_limit
\df log_guest_usage

# Check trial function
\df create_trial_subscription

# Exit psql
\q
```

---

## 🐛 Troubleshooting

### "psql: command not found"
Install PostgreSQL client (see step 1 above)

### "password authentication failed"
1. Check password is correct
2. Verify it's exported: `echo $PGPASSWORD`
3. Try setting it again

### "connection timed out"
1. Check internet connection
2. Verify Supabase project is active
3. Check firewall settings

### "relation already exists"
Migration was already run. Check `completed/` folder.

### "permission denied"
Run: `chmod +x *.sh` to make scripts executable

---

## 📊 Migration Log

All migrations are logged to `migration_log.txt`:

```
2025-11-01 10:30:15 - SUCCESS - 01_guest_mode_rate_limiting.sql
2025-11-01 10:30:47 - SUCCESS - 02_fix_trial_period_to_7_days.sql
```

---

## 🔄 Rollback (If Needed)

If a migration fails or causes issues:

1. **Check what was created**:
   ```sql
   \dt  -- List tables
   \df  -- List functions
   ```

2. **Manual rollback** (create rollback script):
   ```sql
   -- Example rollback
   DROP TABLE IF EXISTS guest_usage_log CASCADE;
   DROP FUNCTION IF EXISTS check_guest_limit(TEXT, TEXT, INT);
   DROP FUNCTION IF EXISTS log_guest_usage(TEXT, TEXT, TEXT, JSONB);
   ```

3. **Or restore from backup** (if you made one)

---

## 📞 Need Help?

1. Check `migration_log.txt` for error details
2. Review migration SQL file for what it does
3. Test connection: `psql -h ... -c "SELECT 1;"`
4. Contact dev team if still stuck

---

## 🎯 Quick Reference Commands

```bash
# Run all migrations
./run_all_migrations.sh

# Run single migration
./run_single_migration.sh pending/01_guest_mode_rate_limiting.sql

# Check connection
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT 1;"

# View migration log
cat migration_log.txt

# Count pending migrations
ls -1 pending/*.sql | wc -l

# Count completed migrations
ls -1 completed/*.sql | wc -l
```

---

**Last Updated**: Nov 1, 2025  
**Migration Count**: 2 pending  
**Status**: Ready to run ✅
