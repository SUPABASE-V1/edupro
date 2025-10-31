# 🚀 Run Migrations NOW - Copy & Paste Commands

## ⚡ Method 1: Automated Script (Easiest)

```bash
# 1. Set your password
export PGPASSWORD='your-supabase-password'

# 2. Navigate to migrations
cd /workspace/migrations

# 3. Run all migrations
./run_all_migrations.sh
```

**Done!** ✅ Script handles everything automatically.

---

## 🔧 Method 2: Manual psql Commands

If the script doesn't work, run these commands directly:

### Step 1: Set Password
```bash
export PGPASSWORD='your-supabase-password'
```

### Step 2: Run Migration 1 - Guest Rate Limiting
```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f /workspace/migrations/pending/01_guest_mode_rate_limiting.sql
```

### Step 3: Run Migration 2 - Fix Trial to 7 Days
```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f /workspace/migrations/pending/02_fix_trial_period_to_7_days.sql
```

---

## ✅ Verify Migrations Succeeded

```bash
# Check if guest_usage_log table exists
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT COUNT(*) FROM guest_usage_log;"

# Check if trial function was updated
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT prosrc FROM pg_proc WHERE proname = 'create_trial_subscription';" \
     | grep "7 days"
```

**Expected Results**:
- First command: Shows `0` (table exists but empty)
- Second command: Shows `7 days` in the function code

---

## 📋 What Each Migration Does

### Migration 1: `01_guest_mode_rate_limiting.sql`
**Purpose**: Secure guest mode to prevent abuse

**Creates**:
- ✅ `guest_usage_log` table - Tracks IP addresses
- ✅ `check_guest_limit()` function - Validates daily limits
- ✅ `log_guest_usage()` function - Records usage
- ✅ RLS policies - Protects data

**Impact**: Stops unlimited free exam generation (saves ~R10k/month)

---

### Migration 2: `02_fix_trial_period_to_7_days.sql`
**Purpose**: Update trial period to 7 days (from 14)

**Updates**:
- ✅ `create_trial_subscription()` function
- ✅ Sets `trial_end_date = NOW() + INTERVAL '7 days'`

**Impact**: Consistent 7-day trial across entire system

---

## 🐛 Troubleshooting

### Error: "psql: command not found"
**Solution**: Install PostgreSQL client

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

---

### Error: "password authentication failed"
**Solutions**:
1. Get correct password from Supabase Dashboard → Settings → Database
2. Make sure you exported it: `echo $PGPASSWORD`
3. Try typing it inline:
```bash
PGPASSWORD='your-password' psql -h ... -f migration.sql
```

---

### Error: "connection refused" or "timeout"
**Solutions**:
1. Check internet connection
2. Verify Supabase project is active (not paused)
3. Check if IP is whitelisted (if IP restrictions enabled)
4. Try from different network

---

### Error: "relation already exists"
**Solution**: Migration already ran successfully. Check:
```bash
ls /workspace/migrations/completed/
```
If files are there, migrations succeeded previously.

---

### Error: "permission denied for schema public"
**Solution**: You need superuser access. Contact database admin or use Supabase service key.

---

## 🔍 Check Migration Status

```bash
# See what's pending
ls /workspace/migrations/pending/

# See what's completed
ls /workspace/migrations/completed/

# View migration log
cat /workspace/migrations/migration_log.txt
```

---

## 📊 After Migration Checklist

- [ ] Check migration log for success messages
- [ ] Verify tables created with `\dt` in psql
- [ ] Test guest mode limit (try creating 2 exams)
- [ ] Check trial function updated to 7 days
- [ ] Update team that migrations are live
- [ ] Monitor error logs for issues

---

## 🎯 One-Liner (For the Brave)

```bash
export PGPASSWORD='your-password' && \
cd /workspace/migrations && \
./run_all_migrations.sh
```

---

## 💡 Pro Tips

1. **Always backup before migrations** (optional but smart)
2. **Run on staging first** if available
3. **Keep terminal open** during migration
4. **Check logs after** for any warnings
5. **Test affected features** immediately

---

## 📞 Need Help?

1. Check `migration_log.txt` for details
2. Review error message carefully
3. Try manual psql commands (Method 2)
4. Contact dev team with error output

---

## 🎉 Success Indicators

You'll know migrations succeeded when:
- ✅ Script shows green checkmarks
- ✅ Files moved from `pending/` to `completed/`
- ✅ Log shows "SUCCESS" for each migration
- ✅ Verification queries return data
- ✅ Guest mode enforces 1/day limit
- ✅ New trials show 7 days in database

---

**Time to Run**: ~2 minutes  
**Difficulty**: Easy (copy/paste commands)  
**Risk**: Low (migrations are tested)  
**Impact**: HIGH (fixes critical issues)

---

**Ready? Let's go!** 🚀

Copy the commands from **Method 1** and paste into your terminal.
