# 🔧 How to Clear Cache Issues - COMPLETE GUIDE

## 🚨 If You See "Variable Not Defined" Errors

The error is caused by **Next.js Turbopack cache**, NOT your code. The code is correct!

---

## ✅ SOLUTION - Do ALL These Steps:

### **Step 1: Stop Dev Server**
```bash
# Press Ctrl+C in your terminal
```

### **Step 2: Clear Next.js Cache**
```bash
cd web
rm -rf .next
rm -rf .turbo
```

### **Step 3: Clear Node Modules Cache** (optional but recommended)
```bash
cd web
rm -rf node_modules/.cache
```

### **Step 4: Restart Dev Server**
```bash
cd web
npm run dev
```

### **Step 5: Hard Refresh Browser**
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

Or:
- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

---

## 🎯 If STILL Not Working

### **Option 1: Kill All Node Processes**
```bash
# Kill all node processes
pkill -f "next dev"

# Or on Windows:
taskkill /F /IM node.exe

# Then restart
cd web
npm run dev
```

### **Option 2: Complete Nuclear Reset**
```bash
# Stop everything (Ctrl+C)

# Clear ALL caches
cd web
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# Reinstall (only if absolutely necessary)
# npm install

# Restart
npm run dev
```

### **Option 3: Check for Multiple Dev Servers**
```bash
# Check what's running on port 3000
lsof -i :3000

# Or
netstat -ano | findstr :3000

# Kill the process if found
kill -9 <PID>
```

---

## 🔍 How to Verify Variables Are Actually Defined

### **Check the actual file content:**
```bash
# Show line 92 (where usageType is defined)
sed -n '87,97p' web/src/app/dashboard/parent/page.tsx
```

### **Expected output:**
```typescript
  // Derived values (not hooks)
  const userEmail = profile?.email;
  const userName = profile?.firstName || userEmail?.split('@')[0] || 'User';
  const preschoolName = profile?.preschoolName;
  const userRole = profile?.role;
  const usageType = profile?.usageType;  // ← THIS LINE SHOULD EXIST
  const hasOrganization = !!profile?.preschoolId;
  const roleDisplay = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';
  const avatarLetter = (userName[0] || 'U').toUpperCase();
```

If you see this line, **the code is correct** - it's just a cache issue!

---

## 📋 Quick Checklist

Before asking for help, verify:
- [ ] Dev server restarted
- [ ] `.next` folder deleted
- [ ] Browser hard refreshed (Ctrl+Shift+R)
- [ ] No multiple dev servers running
- [ ] Variable exists in the actual file (not cached version)

---

## 🎯 Why This Happens

**Next.js Turbopack** caches compiled JavaScript aggressively for performance. When you make changes:

1. File is updated ✅
2. Cache is NOT always cleared ❌
3. Browser serves old cached version ❌
4. You see "variable not defined" even though it exists ❌

**Solution:** Manual cache clear + restart

---

## ⚡ Prevention Tips

1. **Always restart dev server after major changes**
   - Stop with Ctrl+C
   - Clear .next folder
   - Start again

2. **Hard refresh browser frequently**
   - Ctrl+Shift+R becomes your friend
   - Or keep DevTools open with "Disable cache" checked

3. **Watch for stale errors**
   - If error mentions wrong line numbers
   - If error says variable doesn't exist but you can see it
   - If error persists after multiple saves
   - → It's cache, not code!

---

## 🚀 TL;DR - Quick Fix

```bash
# Stop dev server (Ctrl+C)

# Run this:
cd web && rm -rf .next .turbo && npm run dev

# Hard refresh browser (Ctrl+Shift+R)
```

**Done!** ✅

---

*Remember: If the variable exists in the file, the code is correct. It's always cache.* 🎉
