# ? Trial Banner Upgrade Button Fix

**Date:** 2025-11-01  
**Issue:** Upgrade button routing to landing page instead of pricing page

---

## ?? Problem

The "Upgrade" button on the trial banner was routing to:
```tsx
router.push('/#pricing')  // Landing page pricing section ?
```

This would take users to the home page's pricing section (hash link), not the dedicated pricing/upgrade page.

---

## ? Solution

Changed route to:
```tsx
router.push('/pricing')  // Dedicated pricing page ?
```

---

## ?? File Modified

**`web/src/app/dashboard/parent/page.tsx`** (Line 456)

**Before:**
```tsx
onClick={() => router.push('/#pricing')}
```

**After:**
```tsx
onClick={() => router.push('/pricing')}
```

---

## ?? Result

When users click "Upgrade" on the trial banner, they now go to:
- **`/pricing`** - The full pricing page with all plan details ?

Instead of:
- **`/#pricing`** - Landing page pricing section (wrong context) ?

---

## ?? Test

1. Log in as an independent parent with active trial
2. Trial banner should show at top of dashboard
3. Click "Upgrade" button
4. Should navigate to `/pricing` page ?
5. See full pricing plans with Parent-specific options

---

**Status:** ? Fixed & Ready to Test
