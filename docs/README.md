# Test Documentation

Complete test case documentation for the Fastwork QA Challenge — 120 automated tests across API, UI, E2E, and Security categories.

---

## 📋 Quick Start

**For a quick summary:** Open [`automation/tests/TEST-CASES.md`](../automation/tests/TEST-CASES.md)

**For detailed test context:** See GitHub Issues (once posted):
- [Issue #1: API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/1) (17 tests)
- [Issue #2: API — Payment Processing](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/2) (23 tests)
- [Issue #3: API — Authorization & Security](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/3) (28 tests)
- [Issue #4: E2E & State Machine](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/4) (16 tests)
- [Issue #5: ⚠️ Findings — Known Defects](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/5) (9 bugs)

---

## 📚 Documentation Files in This Directory

### [`TEST-CASES.md`](../automation/tests/TEST-CASES.md)
**Local quick reference** — All 120 tests in organized tables

- ✅ Fast to load (local file)
- ✅ Searchable by test ID
- ✅ Links to GitHub Issues for details
- 📊 120 tests × 9 categories = comprehensive coverage

**Use this when:**
- "What tests do we have?"
- "What's the status of TC-QUO-001?"
- "How many security tests?"

---

### [`GITHUB-ISSUES.md`](GITHUB-ISSUES.md)
**Complete detailed documentation** — Ready to copy-paste into GitHub

- 📄 ~800 lines of detailed test cases
- 5 issues worth of content
- Business rules & business context
- Mock API triggers
- PCI-DSS & GDPR compliance mappings
- Root cause analysis for bugs

**Use this to:**
- Post test documentation on GitHub
- Share with stakeholders
- Understand business rules & requirements

---

### [`GITHUB-POSTING-GUIDE.md`](GITHUB-POSTING-GUIDE.md)
**Step-by-step instructions** — How to post documentation on GitHub

- ✅ 5 issues to create
- ✅ Copy-paste content for each
- ✅ Label recommendations
- ✅ Time estimate (~16 minutes total)

**Use this to:**
- Post all 5 issues to GitHub
- Know which labels to add
- Pin the "Findings" issue

---

### [`DOCUMENTATION-STRATEGY.md`](DOCUMENTATION-STRATEGY.md)
**Architecture & rationale** — Why we chose this approach

- 📐 Three-tier documentation model
- 🎯 Navigation patterns for different users
- 📈 Scalability for 200+ tests
- 🔄 Maintenance plan for new tests

**Use this to:**
- Understand the overall structure
- Maintain consistency with future tests
- Explain approach to team

---

## 🎯 Three-Tier Documentation Model

```
Tier 1: Summary (LOCAL)
├─ TEST-CASES.md
├─ 120 tests in tables
└─ Quick reference + navigation links

Tier 2: Details (GITHUB)
├─ Issue #1–5
├─ 4–5 detailed tests per issue
└─ Business rules, steps, impacts

Tier 3: Code (SOURCE)
├─ .spec.ts files
├─ Test implementation
└─ Actual assertions
```

---

## 📊 Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| API — Quotation Validation | 17 | ✅ Passing |
| API — Payment Processing | 23 | ✅ Passing |
| API — Service Window | 7 | ✅ Passing |
| API — Authorization | 8 | ✅ Passing |
| API — Quotation Rejection | 7 | ✅ Passing |
| API — Contract Completion | 4 | ✅ Passing |
| UI — Form Validation | 9 | ✅ Passing |
| E2E — Happy Path | 4 | ✅ Passing |
| E2E — Work Rejection | 6 | ✅ Passing |
| E2E — Contract Termination | 6 | ✅ Passing |
| **Security & Compliance** | **20** | **✅ Passing** |
| Findings (Known Defects) | 9 | ❌ Expected Fail |
| **TOTAL** | **120** | **96 passing + 9 expected fail** |

---

## 🚀 Next Steps

### 1. Post to GitHub (16 minutes)
Use [`GITHUB-POSTING-GUIDE.md`](GITHUB-POSTING-GUIDE.md):
1. Copy content from `GITHUB-ISSUES.md`
2. Create Issue #1 → Issue #5 on GitHub
3. Pin Issue #5 (Findings)
4. Update navigation links in TEST-CASES.md

### 2. Share with Team
- Link to GitHub Issues in Slack/Teams
- Reference test cases in PR reviews
- Use findings for sprint planning

### 3. Maintain Going Forward
- Add new tests to TEST-CASES.md table
- Create detailed GitHub issues for complex test categories
- Update findings as bugs are fixed

---

## 🔍 How to Navigate

### "I need to understand TC-QUO-005"
1. Open TEST-CASES.md
2. Find TC-QUO-005 in "API — Quotation Validation" table
3. Click link to Issue #1
4. Read full test case with business rules

### "I need to fix FINDING-003a"
1. Open TEST-CASES.md
2. Find FINDING-003a in "Findings" table
3. Click link to Issue #5
4. Read:
   - What the bug is
   - Expected vs Actual behavior
   - Root cause
   - **Fix strategy** (implement this)

### "Is this PCI-DSS compliant?"
1. Open TEST-CASES.md
2. Find Issue #3 link
3. Review S-01 through S-17 tests
4. See PCI-DSS requirement mappings

---

## 📞 Questions?

**Where do I find test X?**
→ Search TEST-CASES.md by test ID

**What's the business rule for boundary Y?**
→ Find the test in GitHub Issue, read "Business Rule" section

**How do I understand what a test does?**
→ Tier 1 (TEST-CASES.md) → Tier 2 (GitHub Issue) → Tier 3 (test code)

**How do I report a new test failure?**
→ Reference the test ID in your ticket (e.g., "TC-PAY-007 failing in staging")

---

## ✨ Key Features

✅ **120 tests documented** — All categories covered  
✅ **Detailed business rules** — Understand WHY each constraint exists  
✅ **PCI-DSS compliance** — 20 security tests with requirement mappings  
✅ **GDPR coverage** — Data protection & privacy tests  
✅ **Known defects tracked** — 9 documented bugs with fix strategies  
✅ **Mock API triggers** — Cards ending in 0000 decline, card 9999 timeouts, etc.  
✅ **Impact analysis** — Understand business consequences of failures  
✅ **Reproducible steps** — Copy-paste to run any test scenario  

---

**All 120 test cases documented and ready! 🎉**

