# ⚡ 2-DAY MVP SPRINT - Critical Fixes

**Goal**: Ship high-impact fixes in 48 hours  
**Team**: 1-2 developers  
**Status**: READY TO EXECUTE

---

## 📅 DAY 1 - Foundation & Security (8 hours)

### ✅ Task 1.1: Fix Trial Messaging (30 min) - **HIGHEST PRIORITY**

**Problem**: 7-day vs 14-day confusion  
**Decision**: Standardize to **14 days** (matches database implementation)  
**Effort**: 30 minutes  

**Files to Update**:
```bash
# Search and replace all instances
grep -r "7-day" web/src/app/ web/src/components/
grep -r "7 day" web/src/app/ web/src/components/

# Update these files:
# 1. web/src/app/pricing/page.tsx (line 37, 82)
# 2. web/src/app/page.tsx (line 165, 365, 419, 436)
# 3. web/src/app/exam-prep/page.tsx (line 256)
# 4. components/ui/TrialBanner.tsx
# 5. components/marketing/sections/QASection.tsx (line 24)
```

**Implementation**: I'll do this now ↓

---

### ✅ Task 1.2: Secure Guest Mode (2 hours)

**Problem**: Client-side validation is easily bypassed  
**Solution**: Backend RPC function with rate limiting  

**Step 1**: Create Supabase RPC function  
**Step 2**: Update ExamPrepWidget to call backend  
**Step 3**: Add IP-based tracking  

**Implementation**: I'll do this now ↓

---

### ✅ Task 1.3: Add Loading States (1.5 hours)

**Problem**: 30-60s exam generation with no feedback  
**Solution**: Progress indicator with steps  

**Implementation**: I'll do this now ↓

---

### ✅ Task 1.4: Run Content Scraping (4 hours)

**Problem**: Empty question bank  
**Solution**: Execute existing scripts to download DBE papers  

**Steps**:
1. Configure scraping scripts
2. Run download (2-3 hours execution time)
3. Parse first 50 papers
4. Import to database

**Implementation**: I'll set this up ↓

---

## 📅 DAY 2 - Features & Performance (8 hours)

### ✅ Task 2.1: Basic Teacher Dashboard (3 hours)

**Problem**: Teachers can't create exams  
**Solution**: Minimal viable UI  

**Features** (MVP):
- ✅ List my exams
- ✅ Create new exam (use existing ExamPrepWidget)
- ✅ View student submissions (basic table)

**Implementation**: I'll create this ↓

---

### ✅ Task 2.2: Simple Image Integration (2 hours)

**Problem**: Text-only exams  
**Solution**: Wikimedia Commons API integration  

**Implementation**: I'll add this ↓

---

### ✅ Task 2.3: Response Caching (2 hours)

**Problem**: Every exam generation costs money and takes time  
**Solution**: Cache identical requests  

**Implementation**: I'll add this ↓

---

### ✅ Task 2.4: PayFast Production Test (1 hour)

**Problem**: Never tested in production  
**Solution**: Complete one real transaction  

**Checklist**:
- [ ] Switch to production mode
- [ ] Test R10 payment
- [ ] Verify webhook delivery
- [ ] Confirm subscription activation
- [ ] Document any issues

---

## 📊 Sprint Metrics

| Task | Impact | Effort | ROI |
|------|--------|--------|-----|
| Trial messaging | 🔥 High | 30m | ⭐⭐⭐⭐⭐ |
| Secure guest mode | 🔥 High | 2h | ⭐⭐⭐⭐⭐ |
| Loading states | 🔥 High | 1.5h | ⭐⭐⭐⭐ |
| Content scraping | 🔥 High | 4h | ⭐⭐⭐⭐⭐ |
| Teacher dashboard | 🔥 High | 3h | ⭐⭐⭐⭐⭐ |
| Image integration | 🟡 Med | 2h | ⭐⭐⭐ |
| Response caching | 🟡 Med | 2h | ⭐⭐⭐⭐ |
| PayFast test | 🟡 Med | 1h | ⭐⭐⭐⭐ |
| **TOTAL** | - | **16h** | - |

---

## 🚀 LET'S GO!

Starting implementation now...
