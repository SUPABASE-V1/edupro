# Feature Differentiation Guide - EduDash Pro Parent Types

**Version:** 1.0  
**Date:** 2025-11-01  
**Purpose:** Define feature access based on parent usage type

---

## 🎯 Overview

EduDash Pro supports different parent types with tailored feature sets. This guide defines what features are available to each type and implementation guidelines.

---

## 👥 Parent Types

| Type | Code | Icon | Description | Organization Link |
|------|------|------|-------------|-------------------|
| Preschool Parent | `preschool` | 🎨 | Child attends preschool | Optional but recommended |
| K-12 Parent | `k12_school` | 🏫 | Child attends primary/high school | Optional but recommended |
| Homeschooler | `homeschool` | 🏠 | Teaching at home full-time | Not applicable |
| Aftercare | `aftercare` | ⭐ | Aftercare/extracurricular | Optional |
| Supplemental | `supplemental` | 📚 | Extra support alongside school | Not applicable |
| Exploring | `exploring` | 🔍 | Trying out the app | Not applicable |

---

## ✅ Feature Matrix

### **Core Features** (Available to ALL)

| Feature | All Types | Notes |
|---------|-----------|-------|
| Account Management | ✅ | Profile, settings, password |
| Child Profiles | ✅ | Add/edit/remove children |
| Age-Appropriate Content | ✅ | Based on child's age/grade |
| CAPS Curriculum Library | ✅ | SA curriculum-aligned content |
| AI Learning Assistant | ✅ | Subject to tier limits |
| Progress Tracking | ✅ | Per-child analytics |
| Learning Activities | ✅ | Interactive educational content |
| Exam Prep Tools | ✅ | Practice tests, study guides |
| Educational Resources | ✅ | Downloadable materials |
| Parent Reports | ✅ | Weekly/monthly summaries |
| Mobile App Access | ✅ | iOS & Android apps |

### **Organization-Dependent Features**

| Feature | School-Linked | Independent | Implementation |
|---------|---------------|-------------|----------------|
| School Announcements | ✅ | ❌ | Check `preschool_id IS NOT NULL` |
| Teacher Communications | ✅ | ❌ | Requires school link |
| School Calendar | ✅ | ❌ | Synced from organization |
| Fee Management | ✅ | ❌ | School-specific billing |
| Homework Assignments | ✅ | ⚠️ Self-Directed | Teachers assign vs parent creates |
| Attendance Tracking | ✅ | ❌ | Tracked by school |
| Class-Specific Content | ✅ | ❌ | Based on enrolled class |
| School Reports | ✅ | ❌ | Official school reports |
| School Community | ✅ | ❌ | Parent groups, forums |
| Pickup/Drop-off | ✅ | ❌ | School-specific feature |

### **Usage Type Specific Features**

#### **Homeschool (`homeschool`)**
| Feature | Status | Notes |
|---------|--------|-------|
| Custom Curriculum Builder | ✅ | Create learning paths |
| Daily Schedule Planner | ✅ | Homeschool routine |
| Multi-Subject Tracking | ✅ | All subjects at once |
| Portfolio Builder | 🔮 Future | Document learning journey |
| Homeschool Community | 🔮 Future | Connect with other homeschoolers |

#### **Supplemental (`supplemental`)**
| Feature | Status | Notes |
|---------|--------|-------|
| Extra Practice Modules | ✅ | Beyond school curriculum |
| Skill Gap Identification | ✅ | AI-powered analysis |
| Homework Helper | ✅ | Step-by-step guidance |
| Subject-Specific Boost | ✅ | Focus on weak areas |

#### **Exploring (`exploring`)**
| Feature | Status | Notes |
|---------|--------|-------|
| Demo Content | ✅ | Sample activities |
| Feature Tour | ✅ | Guided walkthrough |
| Limited AI Queries | ✅ | Try before buy |
| Upgrade Prompts | ✅ | Clear value proposition |

---

## 🔐 Implementation Guidelines

### **1. Feature Flag Checks**

```typescript
// In React components or API endpoints
function hasFeature(user: User, feature: string): boolean {
  const { usage_type, preschool_id } = user.profile;
  
  // Core features - always available
  const coreFeatures = [
    'child_profiles',
    'caps_content',
    'ai_assistant',
    'progress_tracking',
    'learning_activities'
  ];
  
  if (coreFeatures.includes(feature)) {
    return true;
  }
  
  // School-dependent features
  const schoolFeatures = [
    'school_announcements',
    'teacher_communications',
    'school_calendar',
    'fee_management',
    'attendance_tracking'
  ];
  
  if (schoolFeatures.includes(feature)) {
    return preschool_id !== null;
  }
  
  // Usage type specific features
  if (feature === 'curriculum_builder' && usage_type === 'homeschool') {
    return true;
  }
  
  if (feature === 'homework_helper' && usage_type === 'supplemental') {
    return true;
  }
  
  return false;
}
```

### **2. UI Conditional Rendering**

```tsx
// Show/hide features in dashboard
{hasFeature(user, 'school_calendar') && (
  <SchoolCalendarWidget />
)}

{!hasFeature(user, 'teacher_communications') && (
  <div className="info-box">
    <p>💡 Link to a school to enable teacher communications</p>
    <Link href="/settings/organization">Connect Now</Link>
  </div>
)}
```

### **3. API Route Protection**

```typescript
// In API route
export async function GET(request: Request) {
  const user = await getUser(request);
  
  if (!hasFeature(user, 'school_announcements')) {
    return Response.json(
      { error: 'This feature requires a school connection' },
      { status: 403 }
    );
  }
  
  // Proceed with request
}
```

### **4. Database Queries**

```sql
-- Get announcements only for school-linked parents
SELECT a.* 
FROM announcements a
INNER JOIN profiles p ON p.preschool_id = a.preschool_id
WHERE p.id = $user_id
  AND p.preschool_id IS NOT NULL;

-- Get all age-appropriate content (available to all)
SELECT c.*
FROM content c
WHERE c.age_min <= $child_age 
  AND c.age_max >= $child_age;
```

---

## 📱 Dashboard Layouts by Type

### **School-Linked Parent Dashboard**

```
┌─────────────────────────────────────┐
│ School Header (Name, Logo)          │
├─────────────────────────────────────┤
│ ⚠️  3 Announcements from School     │
│ 📚 5 Homework Assignments Due       │
│ 💰 Fee Payment Pending              │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ [Messages] [Calendar] [Fees] [...]  │
├─────────────────────────────────────┤
│ My Children (with school info)      │
│ Learning Progress                   │
│ AI Learning Assistant               │
└─────────────────────────────────────┘
```

### **Independent Parent Dashboard**

```
┌─────────────────────────────────────┐
│ Welcome, [Parent Name]!             │
├─────────────────────────────────────┤
│ 💡 Recommended Activities           │
│ 📈 Learning Progress Overview       │
│ 🎯 Today's Learning Goals           │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ [Activities] [Progress] [AI] [...]  │
├─────────────────────────────────────┤
│ My Children (with age/grade)        │
│ Custom Learning Path                │
│ AI Learning Assistant               │
│                                     │
│ [Link to School] (Optional)         │
└─────────────────────────────────────┘
```

---

## 💰 Pricing & Upsell Strategy

### **Same Base Pricing for All Types** ✅

**Free Tier:**
- 10 AI queries per month
- Basic progress tracking
- Limited content library access
- 1 child profile

**Premium Tier ($9.99/month):**
- Unlimited AI queries
- Full content library
- Advanced analytics
- Up to 3 children
- Downloadable resources
- Priority support

**Family Plan ($19.99/month):**
- Everything in Premium
- Unlimited children
- Family dashboard
- Multi-device access
- Offline mode

### **Usage-Type Specific Upsells**

**Homeschoolers:**
- "Homeschool Pro Bundle" - Curriculum planning tools
- "Portfolio Builder Add-on" - Document learning journey
- "State Compliance Toolkit" - Track requirements

**Supplemental Learners:**
- "Homework Helper Plus" - Unlimited help sessions
- "Skill Booster Packs" - Subject-specific intensive courses

**School-Linked:**
- "Premium School Sync" - Advanced integrations
- "Teacher Collaboration Tools" - Enhanced communications

---

## 🎨 UI/UX Guidelines

### **Onboarding Flows**

**School-Linked:**
1. Complete signup
2. Wait for school approval
3. Add children (linked to school)
4. Explore school features

**Independent:**
1. Complete signup
2. Add children (with ages)
3. Select learning goals
4. Start with AI recommendations

### **Empty States**

**School Features (for Independent):**
```
┌─────────────────────────────────────┐
│         🏫                          │
│                                     │
│  Connect to a School                │
│                                     │
│  Link your account to access        │
│  school-specific features like      │
│  teacher communications and         │
│  official announcements.            │
│                                     │
│  [Search Schools] [Maybe Later]     │
└─────────────────────────────────────┘
```

### **Feature Discovery**

Show contextual prompts:
- "💡 Did you know? You can link to your child's school anytime in Settings"
- "✨ Homeschoolers can create custom curriculum paths in Learning Goals"
- "📚 Try our AI tutor for personalized help with any subject"

---

## 🧪 Testing Scenarios

### **Critical Paths to Test:**

1. **Homeschool Parent:**
   - [ ] Can sign up without organization
   - [ ] Cannot access school features
   - [ ] Can access all core features
   - [ ] Sees homeschool-specific tools

2. **School-Linked Parent:**
   - [ ] Can sign up and link to school
   - [ ] Can access school features
   - [ ] Can access all core features
   - [ ] Sees school-specific dashboard

3. **Supplemental Parent:**
   - [ ] Can sign up without organization
   - [ ] Can link to school later (optional)
   - [ ] Sees extra practice modules
   - [ ] Can access homework helper

4. **Feature Access:**
   - [ ] School calendar hidden for independent
   - [ ] Teacher messages hidden for independent
   - [ ] Core features available to all
   - [ ] Proper error messages when blocked

---

## 📊 Analytics to Track

### **Feature Usage by Type:**
```sql
-- Feature engagement by parent type
SELECT 
  p.usage_type,
  f.feature_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT p.id) as unique_users
FROM feature_usage f
JOIN profiles p ON p.id = f.user_id
WHERE f.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.usage_type, f.feature_name
ORDER BY usage_count DESC;
```

### **Conversion Rates:**
```sql
-- Free to paid conversion by type
SELECT 
  usage_type,
  COUNT(*) as total_users,
  SUM(CASE WHEN subscription_tier != 'free' THEN 1 ELSE 0 END) as paid_users,
  ROUND(100.0 * SUM(CASE WHEN subscription_tier != 'free' THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM profiles
GROUP BY usage_type;
```

---

## 🔄 Migration Strategy

### **For Existing Users:**

```sql
-- Classify existing users
UPDATE profiles
SET usage_type = CASE
  WHEN preschool_id IS NOT NULL THEN 'preschool'
  WHEN role = 'parent' THEN 'supplemental'
  ELSE 'independent'
END
WHERE usage_type IS NULL;

-- Add notification for existing users
INSERT INTO notifications (user_id, message, type)
SELECT 
  id,
  'We''ve improved our signup flow! You can now specify how you use EduDash Pro in Settings.',
  'info'
FROM profiles
WHERE created_at < '2025-11-01';
```

---

## 🚨 Important Notes

### **Do NOT:**
- ❌ Block features without clear messaging
- ❌ Force parents to link to schools
- ❌ Discriminate pricing by usage type (for now)
- ❌ Hide core educational content

### **Do:**
- ✅ Explain why features require school link
- ✅ Offer "Link Later" options
- ✅ Provide equal value to all parent types
- ✅ Show relevant features prominently
- ✅ Track usage to inform future decisions

---

## 📝 Changelog

### **Version 1.0 (2025-11-01)**
- Initial feature differentiation strategy
- 6 usage types defined
- Core vs school-dependent features separated
- Implementation guidelines established
- Testing scenarios documented

---

## 🤝 Feedback & Updates

This guide will evolve based on:
- User feedback
- Feature usage analytics
- Business requirements
- Technical constraints

**Review Schedule:** Monthly  
**Owner:** Product Team  
**Last Updated:** 2025-11-01

---

*"Build for flexibility, optimize for clarity, deliver value to all."*
