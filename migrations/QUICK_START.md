# ⚡ Quick Start - Run Migrations in 2 Minutes

## Step 1: Set Password (30 seconds)

```bash
export PGPASSWORD='your-supabase-password'
```

💡 **Where to find password?**
- Supabase Dashboard → Project Settings → Database → "Database password"

---

## Step 2: Run Migrations (1 minute)

```bash
cd /workspace/migrations
./run_all_migrations.sh
```

**Expected Output**:
```
╔════════════════════════════════════════╗
║    EduDash Pro - Migration Runner     ║
╚════════════════════════════════════════╝

🔍 Testing database connection...
✅ Connection successful

📋 Found 2 pending migration(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running: 01_guest_mode_rate_limiting.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success: 01_guest_mode_rate_limiting.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running: 02_fix_trial_period_to_7_days.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success: 02_fix_trial_period_to_7_days.sql

╔════════════════════════════════════════╗
║          Migration Summary             ║
╚════════════════════════════════════════╝
✅ Successful: 2
❌ Failed: 0

🎉 All migrations completed successfully!
```

---

## Step 3: Verify (30 seconds)

```bash
# Check tables were created
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "\dt guest_usage_log"
```

**Expected**: Should show table details

---

## ✅ Done!

Your database is now updated with:
- ✅ Guest rate limiting (backend security)
- ✅ 7-day trial period (consistent across system)

---

## 🚨 If Something Goes Wrong

### "psql: command not found"
```bash
# Install PostgreSQL client
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Ubuntu
```

### "password authentication failed"
- Double-check password from Supabase dashboard
- Make sure you exported it: `echo $PGPASSWORD`

### "connection refused"
- Check internet connection
- Verify Supabase project is active

---

## 💡 Manual Method (If Script Fails)

```bash
# Run each migration manually
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f pending/01_guest_mode_rate_limiting.sql

psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f pending/02_fix_trial_period_to_7_days.sql
```

---

**Need more details?** See [README.md](./README.md)
