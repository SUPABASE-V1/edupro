# ??? Parent Dashboard Refactoring Plan

**Date:** 2025-11-01  
**Current State:** 838 lines (violates WARP.md 500-line limit)  
**Target:** <500 lines with proper modular architecture

---

## ?? Current Issues

### **1. File Size Violation**
- Current: 838 lines
- WARP.md limit: 500 lines for screens
- Over by: 338 lines (67% over limit)

### **2. usage_type Not Saved**
- Database shows `usage_type: null`
- Should be 'k12_school' after signup
- Signup flow doesn't save to `profiles` table correctly

### **3. Purple Banner Logic Issue**
- Banner condition: `{hasOrganization && preschoolName && (...)}`
- `hasOrganization = !!profile?.preschoolId` should be `false`
- But banner still shows - indicates caching or fetch issue

### **4. Mixed Responsibilities**
Current file does:
- Auth management
- Profile fetching
- Children data
- Trial status
- Pending requests
- AI widget state
- Rendering (20+ sections)

---

## ? Refactoring Strategy

### **Architecture Pattern: Container/Hook Separation**

```
web/src/app/dashboard/parent/
??? page.tsx (250 lines) - Main orchestrator
??? components/
?   ??? ParentDashboardHeader.tsx (80 lines)
?   ??? TrialBanner.tsx (100 lines)
?   ??? OrganizationBanner.tsx (80 lines)
?   ??? ChildrenSection.tsx (150 lines)
?   ??? OverviewMetrics.tsx (120 lines)
?   ??? styles.ts (100 lines)
??? hooks/
    ??? useParentDashboardData.ts (200 lines)
```

---

## ?? Component Breakdown

### **1. Hook: `useParentDashboardData.ts`** (200 lines)
**Responsibility:** All data fetching and state management

```tsx
export function useParentDashboardData() {
  // Auth
  const [userId, setUserId] = useState<string>();
  const [authLoading, setAuthLoading] = useState(true);
  
  // Profile & children
  const { profile, loading: profileLoading } = useUserProfile(userId);
  const { childrenCards, activeChildId, setActiveChildId } = useChildrenData(userId);
  
  // Trial status
  const [trialStatus, setTrialStatus] = useState(null);
  
  // Derived values
  const hasOrganization = !!profile?.preschoolId;
  const usageType = profile?.usage_type;
  
  // Effects for auth, trial fetching, etc.
  
  return {
    userId,
    profile,
    hasOrganization,
    usageType,
    childrenCards,
    activeChildId,
    setActiveChildId,
    trialStatus,
    loading: authLoading || profileLoading,
  };
}
```

### **2. Component: `TrialBanner.tsx`** (100 lines)
**Responsibility:** Display trial status with upgrade CTA

```tsx
interface TrialBannerProps {
  trialStatus: TrialStatus | null;
  onUpgrade: () => void;
}

export function TrialBanner({ trialStatus, onUpgrade }: TrialBannerProps) {
  if (!trialStatus?.is_trial) return null;
  
  const daysLeft = trialStatus.days_remaining;
  const color = daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'orange' : 'green';
  
  return (
    <div className="trial-banner" style={{ background: `linear-gradient(...)` }}>
      <Clock size={18} />
      <span>{daysLeft} Days Left ? {trialStatus.plan_name} Trial</span>
      {daysLeft <= 7 && (
        <button onClick={onUpgrade}>Upgrade</button>
      )}
    </div>
  );
}
```

### **3. Component: `OrganizationBanner.tsx`** (80 lines)
**Responsibility:** Show org info (ONLY if hasOrganization)

```tsx
interface OrganizationBannerProps {
  hasOrganization: boolean;
  preschoolName?: string;
  userId: string;
  onNavigate: () => void;
}

export function OrganizationBanner({
  hasOrganization,
  preschoolName,
  userId,
  onNavigate
}: OrganizationBannerProps) {
  // Don't render if no organization
  if (!hasOrganization || !preschoolName) {
    return null;
  }
  
  return (
    <div className="org-banner" onClick={onNavigate}>
      <span>?? {preschoolName}</span>
      <TierBadge userId={userId} size="sm" />
    </div>
  );
}
```

### **4. Component: `ChildrenSection.tsx`** (150 lines)
**Responsibility:** Children cards + empty state

```tsx
interface ChildrenSectionProps {
  children: Child[];
  activeChildId?: string;
  onSelectChild: (id: string) => void;
  onAddChild: () => void;
  loading: boolean;
  usageType?: string;
}

export function ChildrenSection({
  children,
  activeChildId,
  onSelectChild,
  onAddChild,
  loading,
  usageType
}: ChildrenSectionProps) {
  if (loading) return <LoadingState />;
  
  if (children.length === 0) {
    return <EmptyChildrenState usageType={usageType} onAddChild={onAddChild} />;
  }
  
  return (
    <div className="children-section">
      {children.map(child => (
        <ChildCard
          key={child.id}
          child={child}
          active={child.id === activeChildId}
          onClick={() => onSelectChild(child.id)}
        />
      ))}
    </div>
  );
}
```

### **5. Main: `page.tsx`** (250 lines)
**Responsibility:** Orchestration + layout

```tsx
export default function ParentDashboard() {
  const router = useRouter();
  const {
    userId,
    profile,
    hasOrganization,
    usageType,
    childrenCards,
    activeChildId,
    setActiveChildId,
    trialStatus,
    loading,
  } = useParentDashboardData();
  
  if (loading) return <LoadingScreen />;
  
  return (
    <ParentShell
      userEmail={profile?.email}
      hasOrganization={hasOrganization}
    >
      <div className="container">
        {/* Header */}
        <ParentDashboardHeader userName={profile?.firstName} />
        
        {/* Trial Banner */}
        <TrialBanner
          trialStatus={trialStatus}
          onUpgrade={() => router.push('/pricing')}
        />
        
        {/* Organization Banner */}
        <OrganizationBanner
          hasOrganization={hasOrganization}
          preschoolName={profile?.preschoolName}
          userId={userId}
          onNavigate={() => router.push('/dashboard/parent/preschool')}
        />
        
        {/* Pending Requests (org only) */}
        {hasOrganization && <PendingRequestsWidget userId={userId} />}
        
        {/* Children Section */}
        <ChildrenSection
          children={childrenCards}
          activeChildId={activeChildId}
          onSelectChild={setActiveChildId}
          onAddChild={() => router.push('/dashboard/parent/children/add')}
          loading={loading}
          usageType={usageType}
        />
        
        {/* Quick Actions */}
        <QuickActionsGrid
          usageType={usageType}
          hasOrganization={hasOrganization}
        />
        
        {/* Overview (org only) */}
        {hasOrganization && <OverviewMetrics />}
        
        {/* Activity Widgets */}
        <CAPSActivitiesWidget />
        <ExamPrepWidget />
      </div>
    </ParentShell>
  );
}
```

---

## ?? Fix #1: usage_type Not Saving

### **Problem:**
Signup creates auth user with metadata, but database trigger doesn't copy `usage_type` to `profiles` table.

### **Check Database Trigger:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check trigger function
\sf create_profile_for_new_user
```

### **Fix: Update Trigger**
```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    usage_type,  -- ADD THIS
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'usage_type',  -- ADD THIS
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ?? Fix #2: Purple Banner Caching

### **Issue:**
`useUserProfile` hook might be caching old data or fetching incorrectly.

### **Add Debug to Hook:**
```tsx
// In useUserProfile.ts
useEffect(() => {
  console.log('?? [useUserProfile] Fetching for userId:', userId);
  console.log('?? [useUserProfile] Query result:', {
    preschool_id: profileData?.preschool_id,
    usage_type: profileData?.usage_type,
    preschoolName: preschoolData?.name
  });
}, [userId, profileData]);
```

### **Force Fresh Fetch:**
Add `refetch()` function to `useUserProfile` and call on mount:

```tsx
const { profile, loading, refetch } = useUserProfile(userId);

useEffect(() => {
  if (userId) {
    refetch(); // Force fresh fetch
  }
}, [userId]);
```

---

## ?? Implementation Steps

### **Phase 1: Extract Hook (30 min)**
1. Create `hooks/useParentDashboardData.ts`
2. Move all state and data fetching logic
3. Test that data flows correctly

### **Phase 2: Extract Components (1 hour)**
1. Create `TrialBanner.tsx`
2. Create `OrganizationBanner.tsx`
3. Create `ChildrenSection.tsx`
4. Create `OverviewMetrics.tsx`
5. Create `ParentDashboardHeader.tsx`

### **Phase 3: Refactor Main Page (30 min)**
1. Import all new components
2. Use hook for data
3. Clean up to <500 lines
4. Remove old code

### **Phase 4: Fix Database Issues (20 min)**
1. Update `create_profile_for_new_user` trigger
2. Manually fix existing user:
   ```sql
   UPDATE profiles
   SET usage_type = 'k12_school'
   WHERE email = 'davecon12martin@outlook.com';
   ```

### **Phase 5: Test (20 min)**
1. Fresh signup ? verify usage_type saved
2. Independent parent ? verify NO purple banner
3. Org parent ? verify purple banner shows
4. Check all quick actions work

---

## ? Success Criteria

- [x] `page.tsx` under 500 lines
- [x] All logic in custom hook
- [x] UI components under 200 lines each
- [x] Purple banner ONLY shows when `hasOrganization === true`
- [x] `usage_type` saves correctly on signup
- [x] Trial banner works for independent users
- [x] No duplicate sections
- [x] All links work (no 404s)

---

## ?? Benefits

1. **WARP.md Compliant:** File sizes within limits
2. **Maintainable:** Each component has single responsibility
3. **Testable:** Components can be tested in isolation
4. **Debuggable:** Clear data flow, easy to trace issues
5. **Reusable:** Components can be used in other dashboards
6. **Performant:** Only relevant components re-render

---

**Shall I start the refactoring?**

I'll create the modular components and fix the database trigger!
