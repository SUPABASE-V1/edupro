# 📍 Where Are The Migrations?

## ✅ Location

```
your-project/
├── migrations/          👈 HERE!
│   ├── pending/
│   │   ├── 01_guest_mode_rate_limiting.sql
│   │   └── 02_fix_trial_period_to_7_days.sql
│   ├── run_all_migrations.sh
│   ├── run_single_migration.sh
│   ├── README.md
│   └── QUICK_START.md
```

---

## 🔍 How to Find Them

### From Your Local Machine:

```bash
# Navigate to project root
cd /path/to/your/project

# List migrations folder
ls -la migrations/

# See pending migrations
ls -la migrations/pending/
```

**Expected output**:
```
01_guest_mode_rate_limiting.sql
02_fix_trial_period_to_7_days.sql
```

---

## 🚀 How to Run Them

### Option 1: Automated Script

```bash
cd migrations
export PGPASSWORD='your-supabase-password'
./run_all_migrations.sh
```

### Option 2: Manual psql

```bash
# From project root
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/01_guest_mode_rate_limiting.sql

psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/02_fix_trial_period_to_7_days.sql
```

---

## ❓ Still Can't Find Them?

### Check if you pulled the right branch:

```bash
git branch --show-current
```

**Should show**: `cursor/implement-customizable-exam-duration-13e3` or `main`

### Check if files exist:

```bash
find . -name "*guest_mode_rate_limiting.sql"
```

**Should show**: `./migrations/pending/01_guest_mode_rate_limiting.sql`

### Verify git history:

```bash
git log --oneline -3
```

**Should show**: Commits about migrations and 7-day trial

---

## 🔄 If Files Are Missing

### Pull again:

```bash
git fetch origin
git pull origin cursor/implement-customizable-exam-duration-13e3
```

### Or checkout specific commit:

```bash
git checkout 744fe8a  # Migration commit
```

---

## 📂 Full Path Examples

If your project is at:
- `/Users/yourname/projects/edudash-pro/` (Mac)
- `C:\Users\yourname\projects\edudash-pro\` (Windows)
- `/home/yourname/edudash-pro/` (Linux)

Then migrations are at:
- `/Users/yourname/projects/edudash-pro/migrations/` (Mac)
- `C:\Users\yourname\projects\edudash-pro\migrations\` (Windows)
- `/home/yourname/edudash-pro/migrations/` (Linux)

---

## ✅ Quick Test

```bash
# From project root
cat migrations/pending/01_guest_mode_rate_limiting.sql | head -5
```

**Should show**:
```sql
-- Guest Mode Rate Limiting
-- Prevents abuse of free exam generation...
```

If you see this, migrations are there! ✅

---

## 🆘 If Still Stuck

1. **Check which folder you're in**:
   ```bash
   pwd
   ```

2. **List all folders**:
   ```bash
   ls -la
   ```

3. **Search entire project**:
   ```bash
   find . -name "run_all_migrations.sh"
   ```

4. **Verify git files**:
   ```bash
   git ls-files | grep migration
   ```

---

## 💡 Common Issues

### Issue 1: Wrong directory
**Problem**: You're in `/workspace` but migrations are elsewhere  
**Solution**: `cd /actual/project/path`

### Issue 2: Branch not merged
**Problem**: Old branch without migrations  
**Solution**: `git pull origin main` or the correct branch

### Issue 3: Files not committed
**Problem**: Migrations weren't in the commit  
**Solution**: Check git log: `git log --name-status -3`

---

**Need more help?** Share the output of:
```bash
pwd
ls -la
git branch --show-current
```
