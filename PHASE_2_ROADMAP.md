# 🚀 Phase 2 Roadmap - Next Sprint

**Status**: Ready to Execute  
**Prerequisites**: ✅ Phase 1 Complete (merged & rebased)  
**Timeline**: 2-3 days  
**Goal**: Production-ready deployment

---

## 📋 Phase 2 Tasks (Priority Order)

### 🔥 **Priority 1: Database & Content** (Today - 1 hour)

#### 1. Run Database Migrations ⚡ (2 min)
**Status**: Ready to execute  
**Impact**: Critical - Enables guest security & 7-day trial

```bash
cd /workspace/migrations
export PGPASSWORD='your-supabase-password'
./run_all_migrations.sh
```

**What this does**:
- ✅ Creates `guest_usage_log` table
- ✅ Adds rate limiting functions
- ✅ Updates trial to 7 days

---

#### 2. Seed MVP Content ⚡ (5 min)
**Status**: Script ready  
**Impact**: High - Enables real exam generation

```bash
cd /workspace
npx ts-node scripts/quick-mvp-content.ts
```

**What this does**:
- ✅ Adds 3 Grade 9 Math past papers
- ✅ Inserts 5 sample questions
- ✅ Enables testing with real content

---

#### 3. Verify Setup ✅ (2 min)

```bash
# Check tables created
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT COUNT(*) FROM guest_usage_log;"

# Check content
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT COUNT(*) FROM caps_past_papers;"
```

---

### 🎯 **Priority 2: Testing** (Today - 30 min)

#### 4. Test Guest Rate Limiting 🔒
**Manual Test**:
1. Visit `/exam-prep` (not logged in)
2. Generate exam #1 → Should work ✅
3. Try exam #2 → Should block ❌
4. Clear browser → Still blocked (IP tracked)

**Expected**: "Daily limit reached" message

---

#### 5. Test Teacher Dashboard 👩‍🏫
**Manual Test**:
1. Login as teacher
2. Visit `/dashboard/teacher/exams`
3. Click "Create New"
4. Generate exam
5. Verify it appears in list
6. Test delete function

**Expected**: Smooth CRUD operations

---

#### 6. Test Loading States ⏳
**Manual Test**:
1. Generate any exam
2. Observe progress indicator
3. Verify 4 steps animate
4. Check time estimate updates

**Expected**: Beautiful progress UI, no black screen

---

### 🚢 **Priority 3: Deployment** (Today - 20 min)

#### 7. Deploy to Staging/Production 🌐

```bash
# Option A: Vercel
cd web
vercel --prod

# Option B: Manual build
npm run build
# Then upload dist/ to your hosting
```

---

#### 8. Post-Deploy Verification ✅

**Checklist**:
- [ ] `/exam-prep` loads
- [ ] Guest mode works (1 exam only)
- [ ] `/dashboard/teacher/exams` loads
- [ ] Loading states appear
- [ ] Trial messaging says "7 days"
- [ ] No console errors

---

### 🔧 **Priority 4: Teacher Features** (Day 2 - 3 hours)

#### 9. Add Student Assignment Flow 👥

**What to build**:
```tsx
// In teacher exam dashboard
<AssignExamModal
  examId={examId}
  students={classStudents}
  dueDate={date}
  onAssign={handleAssign}
/>
```

**Database**:
```sql
CREATE TABLE exam_assignments (
  id UUID PRIMARY KEY,
  exam_generation_id UUID,
  student_id UUID,
  assigned_by UUID,
  due_date TIMESTAMPTZ,
  status TEXT,
  score INT
);
```

---

#### 10. View Student Results 📊

**What to build**:
```tsx
// In teacher exam dashboard
<StudentResults
  examId={examId}
  students={submissions}
  showScores={true}
  showAnswers={true}
/>
```

**Features**:
- ✅ List all students who took exam
- ✅ Show scores and completion status
- ✅ View individual student answers
- ✅ Class average calculation

---

### 🖼️ **Priority 5: Visual Content** (Day 2-3 - 4 hours)

#### 11. Wikimedia Image Integration 🎨

**Implementation**:
```typescript
// lib/wikimedia.ts
export async function searchWikimediaImages(
  query: string,
  limit: number = 5
): Promise<Image[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json`;
  const response = await fetch(url);
  return response.json();
}
```

**Usage in exams**:
```tsx
// When generating exam
if (question.requiresImage) {
  const images = await searchWikimediaImages(question.topic);
  question.imageUrl = images[0]?.url;
}
```

---

#### 12. AI Image Generation (Alternative) 🤖

**Implementation**:
```typescript
// lib/ai-images.ts
export async function generateDiagram(
  description: string,
  grade: string
): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Educational diagram for Grade ${grade}: ${description}. Simple, clear, black and white.`,
    size: "1024x1024"
  });
  return response.data[0].url;
}
```

**Cost**: ~R0.60 per image

---

### ⚡ **Priority 6: Performance** (Day 3 - 3 hours)

#### 13. Implement Redis Caching 💾

**Setup**:
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export async function getCachedExam(key: string) {
  return await redis.get(key);
}

export async function cacheExam(key: string, data: any, ttl: number = 3600) {
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}
```

**Integration**:
```typescript
// In exam generation
const cacheKey = `exam:${grade}:${subject}:${duration}:${language}`;
let exam = await getCachedExam(cacheKey);

if (!exam) {
  exam = await generateExam(...);
  await cacheExam(cacheKey, exam);
}
```

---

#### 14. Mobile Responsiveness 📱

**Test on**:
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

**Key pages**:
- `/exam-prep`
- `/dashboard/teacher/exams`
- Exam taking interface

**Fix**:
- Touch targets (min 44px)
- Horizontal scrolling
- Font sizes (min 16px to prevent zoom)
- Form inputs (mobile-friendly)

---

### 🎯 **Priority 7: Content Expansion** (Background - overnight)

#### 15. Download Grade 10-12 Content 📚

**Run overnight**:
```bash
# Download all FET phase papers
npx ts-node scripts/download-caps-curriculum.ts --grades "10,11,12"

# Expected: ~200 papers, ~5,000 questions
# Time: 6-8 hours
```

---

#### 16. Quality Assurance 🔍

**Manual review**:
- Check 10 random questions for accuracy
- Verify marking memos are correct
- Test with real teachers
- Fix any parsing errors

---

## 📊 Phase 2 Timeline

### **Today (Day 1) - Foundation**
- 09:00 - Run migrations (10 min)
- 09:10 - Seed content (5 min)
- 09:15 - Test features (30 min)
- 09:45 - Deploy (20 min)
- 10:05 - Verify deployment (15 min)
- ✅ **Done by 10:30 AM**

### **Day 2 - Features**
- Morning: Student assignment flow (3h)
- Afternoon: Student results view (2h)
- Evening: Wikimedia integration (2h)
- ✅ **Done by end of day**

### **Day 3 - Performance & Content**
- Morning: Redis caching (2h)
- Afternoon: Mobile testing (2h)
- Evening: Start overnight content download
- ✅ **Done by end of day**

**Total**: 2.5 days to production-ready

---

## 🎯 Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Guest Conversion | 0% | 15% | Track signups after guest exam |
| Teacher Adoption | 0% | 30% | Teachers creating exams |
| Content Library | 5 questions | 500+ | Database count |
| Page Load Time | Unknown | <3s | Lighthouse score |
| Mobile Traffic | Unknown | 50% | Analytics |
| Trial → Paid | Unknown | 20% | Subscription data |

---

## 🚨 Blockers to Watch

1. **Database password** - Need for migrations
2. **Upstash Redis** - May need account signup
3. **OpenAI API key** - For image generation
4. **Mobile devices** - Need physical devices to test
5. **Teacher testers** - Need real users for feedback

---

## 💰 Costs (Phase 2)

| Item | Cost | When |
|------|------|------|
| Upstash Redis (Free tier) | R0 | Setup day |
| AI Image Generation (100 images) | R60 | Optional |
| Content Scraping | R0 | Overnight |
| Hosting (Vercel) | R0 | Free tier |
| **Total** | **R0-R60** | **This week** |

---

## 🔄 Rollback Plan

If something breaks:

```bash
# Rollback migrations
psql -h ... -c "DROP TABLE guest_usage_log CASCADE;"

# Rollback deployment
vercel rollback

# Rollback code
git revert HEAD~3
```

---

## ✅ Phase 2 Checklist

### Today
- [ ] Run migrations
- [ ] Seed MVP content
- [ ] Test guest rate limiting
- [ ] Test teacher dashboard
- [ ] Test loading states
- [ ] Deploy to production
- [ ] Verify deployment

### This Week
- [ ] Add student assignment
- [ ] Add results view
- [ ] Integrate Wikimedia images
- [ ] Setup Redis caching
- [ ] Test on mobile
- [ ] Download Grade 10-12 content

### Before Launch
- [ ] PayFast production test
- [ ] Security audit
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation complete

---

## 🎉 When Phase 2 is Done

You'll have:
- ✅ Fully functional guest mode (secure)
- ✅ Teacher can create & assign exams
- ✅ Students can take exams with immediate feedback
- ✅ 500+ questions in database
- ✅ Fast performance with caching
- ✅ Mobile-friendly interface
- ✅ Production-ready deployment

**Ready for 1000+ users!** 🚀

---

## 📞 Need Help With?

Common next questions:
1. How to get Supabase password? → Dashboard → Settings → Database
2. How to setup Redis? → Sign up at upstash.com (free tier)
3. How to test PayFast? → See `COMPREHENSIVE_SYSTEM_AUDIT.md`
4. Where to deploy? → Vercel (recommended) or Netlify

---

**Let's Start!** 

Which would you like to tackle first?
1. **Run migrations** (quickest, enables everything)
2. **Seed content** (see real data)
3. **Deploy** (get it live)
4. **Add features** (student assignments, images)

I'm ready to help with any of these! 🚀
