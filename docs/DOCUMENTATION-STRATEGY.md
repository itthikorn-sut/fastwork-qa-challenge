# Test Case Documentation Strategy

**Approach:** Hybrid model combining quick reference + detailed GitHub documentation

---

## Architecture Overview

```
TEST-CASES.md (local)
├── Part 1: Quick Reference Tables
│   ├── 120 test IDs, titles, priorities, status
│   └── Scannable summary for all tests
│
└── Part 2: Navigation Links
    └── Links to 5 detailed GitHub Issues

GitHub Issues (remote)
├── Issue #1: API — Quotation Validation (17 tests)
│   ├── Detailed steps for 4 key tests
│   ├── Business rules explained
│   └── Why it matters
│
├── Issue #2: API — Payment Processing (23 tests)
│   ├── Idempotency deep-dive
│   ├── Concurrency handling
│   └── Data consistency patterns
│
├── Issue #3: API — Authorization & Security (28 tests)
│   ├── PCI-DSS compliance mapping
│   ├── GDPR requirements coverage
│   └── Cross-user isolation patterns
│
├── Issue #4: E2E & State Machine (16 tests)
│   ├── Full quotation lifecycle
│   ├── Milestone rejection flows
│   └── Contract termination handling
│
└── Issue #5: Findings — Known Defects (9 bugs) ⭐ PINNED
    ├── Current bugs with reproduction steps
    ├── Impact analysis
    ├── Root cause explanation
    └── Fix strategies
```

---

## Three-Tier Documentation

### Tier 1: Summary (LOCAL)
**File:** `automation/tests/TEST-CASES.md`

**Purpose:** Quick lookup, test inventory, linking to issues

**Content:**
- 120 tests in organized tables
- Test ID, title, type, priority, status
- Navigation links to GitHub Issues

**Audience:** Everyone (QA, Devs, Managers, Stakeholders)

**Use Case:**
```
"What tests do we have?"
"What's the status of TC-QUO-001?"
"How many API tests are there?"
```

---

### Tier 2: Category Details (GITHUB ISSUES)
**Location:** GitHub Issues #1–5

**Purpose:** Deep context for each test category

**Content per issue:**
- 4–5 detailed test cases with steps & business rules
- Remaining tests listed in reference table
- Mock API triggers
- Compliance mappings (PCI-DSS, GDPR, OWASP)
- Why-it-matters explanations

**Audience:** QA engineers, Developers, Security leads

**Use Case:**
```
"What's the business rule for the 3000 THB boundary?"
"How does idempotency work in payments?"
"What's required for PCI-DSS compliance?"
"Why did FINDING-003a fail?"
```

---

### Tier 3: Code Details (SOURCE FILES)
**Location:** `.spec.ts` test files

**Purpose:** Actual test implementation

**Content:**
- Test code and assertions
- Mock server triggers
- Exact HTTP requests/responses
- Edge case handling

**Audience:** Developers implementing/fixing tests

**Use Case:**
```
"How do I run TC-PAY-017?"
"What's the exact assertion for idempotency?"
"Where is the concurrency test?"
```

---

## How Different Users Navigate

### QA Engineer
```
"I need to understand TC-QUO-005"

1. Open TEST-CASES.md
2. Find TC-QUO-005 in API — Quotation Validation table
3. Click link to Issue #1
4. Read full test case with steps & business rule
5. (Optional) Click test file link to see code
```

### Developer Fixing FINDING-003a
```
"I need to fix the underpayment bug"

1. Open TEST-CASES.md
2. See FINDING-003a in "Findings" table
3. Click link to Issue #5
4. Read:
   - What the bug is (allows underpayment)
   - Current behavior (payment succeeds)
   - Expected behavior (HTTP 400)
   - Root cause (missing validation)
   - Fix strategy (add amount check)
5. Implement fix in API code
6. Run test to verify
```

### Manager/Stakeholder
```
"What's our test coverage status?"

1. Open TEST-CASES.md
2. See Summary table:
   - 96 tests passing ✅
   - 9 expected failures ❌
   - 20 security tests ✅
3. Click Issue #5 for known defects
4. Understand impact of each finding
5. (Optional) Prioritize fixes
```

### Security Auditor
```
"Is this system PCI-DSS compliant?"

1. Open TEST-CASES.md
2. Find Issue #3 link
3. Review all 20 security tests
4. See compliance mappings:
   - PCI-DSS Req 3 → S-01, S-02, S-03, S-04
   - PCI-DSS Req 8 → S-12, S-13, S-14
   - GDPR Article 5 → GDPR-01, GDPR-02, GDPR-03
5. Verify each requirement is tested
```

---

## Files Created

### Local Repository Files

**`automation/tests/TEST-CASES.md`**
- Quick reference tables (all 120 tests)
- Navigation links to GitHub Issues
- Usage guide for different audiences
- ~500 lines, fast to load

**`docs/GITHUB-ISSUES.md`**
- Full detailed test documentation
- 5 complete GitHub issue bodies
- Copy-paste ready for GitHub
- ~800 lines

**`docs/GITHUB-POSTING-GUIDE.md`**
- Step-by-step posting instructions
- Label recommendations
- Formatting tips
- ~300 lines

**`docs/DOCUMENTATION-STRATEGY.md`** (this file)
- Architecture & rationale
- Navigation patterns
- Audience-specific use cases
- ~400 lines

---

## Maintenance Plan

### When Adding New Tests

1. **Add to local table** (`TEST-CASES.md` Part 1)
   - Add row with ID, title, type, priority, status
   - Takes 30 seconds

2. **Add to GitHub Issue** (optional, only for detailed tests)
   - Update relevant issue category
   - Takes 2 minutes for complex tests

3. **Update summary count**
   - Update "TOTAL" row in TEST-CASES.md
   - Update category count if needed

### When Fixing a Bug (from Findings)

1. **Update status in TEST-CASES.md**
   - Change ❌ to ✅ (or remove from Findings table)
   - Update summary counts

2. **Update GitHub Issue #5**
   - Mark finding as "Fixed" in issue
   - Comment with commit reference
   - Leave issue open for transparency

3. **Test verification**
   - Run test suite
   - Verify test now passes
   - Comment on GitHub issue with test results

---

## Scalability

This hybrid approach scales well:

| Metric | Local | GitHub |
|--------|-------|--------|
| Load time | Fast (local file) | Instant (cached) |
| Discoverability | Good (searchable) | Excellent (GitHub search) |
| Collaboration | Limited | Full (comments, discussions) |
| Offline access | Yes | No |
| Editing | Version controlled | Issue history tracked |
| Organization | By category | By issue |

**For 200+ tests:** Same structure, just more GitHub issues (one per 30–40 tests)

---

## Why This Approach?

### vs. Detailed Local Markdown Only
```
❌ Pro: Complete offline access
✅ Con: Large files hard to navigate
✅ Con: No collaboration/comments
```

### vs. GitHub Issues Only
```
✅ Pro: Excellent collaboration
❌ Con: Requires internet access
❌ Con: Not versioned in repo
```

### Our Hybrid (Recommended) ✅
```
✅ Quick local reference (TEST-CASES.md)
✅ Detailed GitHub docs (Issues #1–5)
✅ Full traceability (clickable links)
✅ Version control (everything in git)
✅ Collaboration (GitHub features)
✅ Offline access (local summary)
```

---

## Next Steps

1. **Commit local files** (TEST-CASES.md + docs/)
   ```bash
   git add automation/tests/TEST-CASES.md docs/
   git commit -m "docs: comprehensive test case documentation (120 tests)"
   git push
   ```

2. **Post GitHub Issues** (follow GITHUB-POSTING-GUIDE.md)
   - ~16 minutes to post all 5 issues
   - Pin Issue #5 (Findings)

3. **Update README.md** (optional)
   ```markdown
   ## Test Documentation
   
   - **[Quick Reference](automation/tests/TEST-CASES.md)** — All 120 tests
   - **[Detailed by Category](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues)** — GitHub Issues #1–5
   - **[Findings](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/5)** — Known defects & fixes
   ```

4. **Share with team**
   - Link to GitHub issues in Slack/Teams
   - Reference test IDs in PR reviews
   - Use findings for sprint planning

---

## Success Metrics

You'll know this is working when:

✅ QA can quickly find any test case by ID  
✅ Developers reference issues when fixing bugs  
✅ PRs mention test cases (e.g., "Fixes TC-PAY-017")  
✅ New tests follow the same documentation pattern  
✅ Findings are tracked and prioritized  
✅ Security audits reference Issue #3  
✅ Stakeholders review findings quarterly  

---

## Questions?

- **"Where do I find test TC-QUO-005?"** → TEST-CASES.md (table) → Issue #1 (details) → .spec.ts (code)
- **"What's wrong with FINDING-003a?"** → TEST-CASES.md → Issue #5 (full details)
- **"How do we handle concurrency?"** → Issue #2 (TC-PAY-019 detailed case)
- **"Are we PCI-DSS compliant?"** → Issue #3 (S-01 through S-17 mapped to requirements)

---

**Documentation complete. Ready for GitHub! 🎉**

