# Parent Dashboard Audit - Pages & Actions

**Date:** 2025-11-01

---

## ?? Existing Pages

### **? Pages that EXIST:**
```
/dashboard/parent/
  ? ai-help
  ? calendar
  ? children
  ? claim-child
  ? homework
  ? lessons
  ? messages
  ? payments
  ? progress
  ? register-child
  ? settings
```

---

## ? QuickActionsGrid Links that 404

### **Homeschool Actions:**
```
? /dashboard/parent/curriculum (doesn't exist)
? /dashboard/parent/study-plan (doesn't exist)
? /dashboard/parent/progress (exists)
? /dashboard/parent/ai-tutor (doesn't exist - should be /ai-help)
? /dashboard/parent/worksheets (doesn't exist)
? /dashboard/parent/lesson-planner (doesn't exist)
```

### **Supplemental Actions:**
```
? /dashboard/parent/exam-prep (doesn't exist)
? /dashboard/parent/lessons (exists)
? /dashboard/parent/ai-tutor (doesn't exist - should be /ai-help)
? /dashboard/parent/assessment (doesn't exist)
? /dashboard/parent/games (doesn't exist)
? /dashboard/parent/study-guides (doesn't exist)
```

### **Exploring Actions:**
```
? /dashboard/parent/explore (doesn't exist)
? /dashboard/parent/curriculum (doesn't exist)
? /dashboard/parent/ai-tutor (doesn't exist - should be /ai-help)
? /dashboard/parent/reports (doesn't exist)
? /dashboard/parent/organizations (doesn't exist)
? /dashboard/parent/settings (exists)
```

### **Organization Actions:**
```
? /dashboard/parent/messages (exists)
? /dashboard/parent/calendar (exists)
? /dashboard/parent/progress (exists)
? /dashboard/parent/financials (doesn't exist - should be /payments)
```

---

## ?? Problems Found

### **1. Duplicate Quick Actions Sections**
- Line 674-677: NEW QuickActionsGrid component
- Line 704-720+: OLD hardcoded quick actions section
- **Result:** TWO sets of quick actions showing!

### **2. Most Links are 404ing**
- 90% of QuickActionsGrid links don't exist
- Users clicking ? 404 error
- Poor UX

### **3. Overview Section is School-Specific**
Lines 679-702:
```tsx
<div className="section">
  <div className="sectionTitle">Overview</div>
  <div className="grid2">
    <div>Unread Messages</div>      // School-specific
    <div>Homework Pending</div>      // School-specific
    <div>Attendance Rate</div>       // School-specific
    <div>Total Children</div>        // Ok for all
  </div>
</div>
```

**Should NOT show** for independent parents!

### **4. Old Quick Actions are School-Specific**
Lines 704-730+:
```tsx
<div className="section">
  <div className="sectionTitle">Quick Actions</div>
  <button>View Homework</button>        // School-specific
  <button>Check Attendance</button>     // School-specific
  <button>Messages</button>             // School-specific
  <button>View Fees</button>            // School-specific
</div>
```

**Should NOT show** for independent parents!

---

## ?? Proposed Solution

### **Option A: Map to Existing Pages Only**

Update QuickActionsGrid to ONLY link to pages that exist:

**For Independent/Homeschool:**
```
? My Children ? /dashboard/parent/children
? AI Help ? /dashboard/parent/ai-help
? Lessons ? /dashboard/parent/lessons
? Progress ? /dashboard/parent/progress
? Homework ? /dashboard/parent/homework
? Settings ? /dashboard/parent/settings
```

**For Organization-Linked:**
```
? Messages ? /dashboard/parent/messages
? Calendar ? /dashboard/parent/calendar
? Progress ? /dashboard/parent/progress
? Payments ? /dashboard/parent/payments
? My Children ? /dashboard/parent/children
? Settings ? /dashboard/parent/settings
```

---

### **Option B: Create Placeholder Pages (Later)**

For future features that don't exist yet:
- Create simple placeholder pages
- Show "Coming Soon" message
- Collect waitlist

---

### **Option C: Hybrid Approach (RECOMMENDED)**

1. **NOW:** Map to existing pages only
2. **Remove duplicate sections:**
   - Keep NEW QuickActionsGrid
   - Remove OLD hardcoded quick actions
3. **Conditional Overview section:**
   - Show for organization-linked parents
   - Hide for independent parents
4. **Later:** Build missing pages as needed

---

## ?? Recommended Changes

### **1. Update QuickActionsGrid - Use Existing Pages**

```tsx
case 'homeschool':
case 'independent':
case 'supplemental':
case 'exploring':
  return [
    { icon: Users, label: 'My Children', href: '/dashboard/parent/children', color: '#8b5cf6' },
    { icon: Sparkles, label: 'AI Help', href: '/dashboard/parent/ai-help', color: '#ec4899' },
    { icon: BookOpen, label: 'Lessons', href: '/dashboard/parent/lessons', color: '#10b981' },
    { icon: FileText, label: 'Homework', href: '/dashboard/parent/homework', color: '#f59e0b' },
    { icon: BarChart3, label: 'Progress', href: '/dashboard/parent/progress', color: '#06b6d4' },
    { icon: Settings, label: 'Settings', href: '/dashboard/parent/settings', color: '#6366f1' },
  ];
```

### **2. Remove Duplicate Quick Actions Section**

Delete lines 704-730+ (old hardcoded section)

### **3. Make Overview Conditional**

```tsx
{hasOrganization && (
  <div className="section">
    <div className="sectionTitle">Overview</div>
    {/* School-specific metrics */}
  </div>
)}
```

### **4. Hide School-Specific Widgets**

```tsx
// Only show for organization-linked parents
{hasOrganization && <CAPSActivitiesWidget />}
{hasOrganization && <ExamPrepWidget />}
```

---

## ?? Ideal Dashboard Structure

### **Independent Parents:**
```
1. Greeting
2. Trial Banner (7 days)
3. Empty Children State OR Children Cards
4. Quick Actions (6 actions - all working links)
5. CAPS Activities (universal)
6. Exam Prep (universal)
```

### **Organization-Linked Parents:**
```
1. Greeting
2. Trial Banner (if applicable)
3. Organization Card (compact purple)
4. Pending Requests Widget
5. Children Cards
6. Quick Actions (school-focused)
7. Overview Metrics (Messages, Homework, Attendance)
8. School-Specific Widgets
```

---

**Should I implement Option C (Recommended)?**
