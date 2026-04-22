# GitHub Issues — Posting Guide

Quick reference for copying detailed test case documentation to GitHub Issues.

---

## Step-by-Step Instructions

### 1. Open GitHub Repository

Go to: https://github.com/itthikorn-sut/fastwork-qa-challenge/issues

Click **"New Issue"**

---

### 2. Post Issue #1: API — Quotation Validation

**Copy from:** `docs/GITHUB-ISSUES.md` → **"Issue #1"** section

**Steps:**
1. Title: `📋 Test Cases: API — Quotation Validation (TC-QUO-001 to TC-QUO-024)`
2. In Description field, paste the content from the "Issue #1" section
3. Labels: `documentation`, `test-cases`, `api`, `quotation`
4. Click **"Create"**

**Time to post:** ~2 minutes

---

### 3. Post Issue #2: API — Payment Processing

**Copy from:** `docs/GITHUB-ISSUES.md` → **"Issue #2"** section

**Steps:**
1. Title: `📋 Test Cases: API — Payment Processing (TC-PAY-001 to TC-PAY-023)`
2. Paste content from "Issue #2" section
3. Labels: `documentation`, `test-cases`, `api`, `payment`
4. Click **"Create"**

**Note:** This issue should link back to Issue #1. When pasting, add this line at the top:

```markdown
**Related:** [Issue #1 — API Quotation Validation](../issues/1)
```

---

### 4. Post Issue #3: API — Authorization & Security

**Copy from:** `docs/GITHUB-ISSUES.md` → **"Issue #3"** section

**Steps:**
1. Title: `📋 Test Cases: API — Authorization & Security (TC-AUTH-* and S-*)`
2. Paste content from "Issue #3" section
3. Labels: `documentation`, `test-cases`, `security`, `pci-dss`, `gdpr`
4. Click **"Create"**

**Add link at top:**
```markdown
**Related:** [Issue #1](../issues/1) | [Issue #2](../issues/2)
```

---

### 5. Post Issue #4: E2E & State Machine Testing

**Copy from:** `docs/GITHUB-ISSUES.md` → **"Issue #4"** section

**Steps:**
1. Title: `📋 Test Cases: E2E & State Machine (TC-E2E-*, TC-REJ-*, TC-TER-*)`
2. Paste content from "Issue #4" section
3. Labels: `documentation`, `test-cases`, `e2e`, `state-machine`
4. Click **"Create"**

**Add link at top:**
```markdown
**Related:** [Issue #1](../issues/1) | [Issue #2](../issues/2) | [Issue #3](../issues/3)
```

---

### 6. Post Issue #5: Findings — Known Defects (PIN THIS ONE)

**Copy from:** `docs/GITHUB-ISSUES.md` → **"Issue #5"** section

**Steps:**
1. Title: `⚠️ FINDINGS: Known Defects (FINDING-001 through FINDING-006)`
2. Paste content from "Issue #5" section
3. Labels: `bug`, `findings`, `test-documentation`
4. Click **"Create"**

**IMPORTANT: Pin this issue!**
- After creating, open the issue
- Click **"..."** (three dots) in top right
- Select **"Pin issue"**

**Add link at top:**
```markdown
**Related:** [Issue #1](../issues/1) | [Issue #2](../issues/2) | [Issue #3](../issues/3) | [Issue #4](../issues/4)
```

---

## Updating `TEST-CASES.md`

Once all 5 issues are created, update the navigation section in `TEST-CASES.md`:

Replace:
```markdown
🔗 **Detailed test documentation by category:**

- **[API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/1)** — 17 boundary & validation tests
```

With the actual issue numbers from GitHub. Example:
- If Issue #1 becomes GitHub issue #42, use: `issues/42`

---

## Label Suggestions

Use these labels on GitHub for better organization:

| Label | Color | Used On | Purpose |
|-------|-------|---------|---------|
| `documentation` | 📚 Blue | All 5 issues | Test documentation |
| `test-cases` | 🧪 Purple | Issues #1–4 | Test case reference |
| `api` | 🔌 Green | Issues #1–3 | API-related |
| `security` | 🔒 Red | Issue #3 | Security & compliance |
| `pci-dss` | 🛡️ Orange | Issue #3 | PCI-DSS compliance |
| `gdpr` | 📋 Yellow | Issue #3 | GDPR compliance |
| `e2e` | 🌐 Cyan | Issue #4 | End-to-end tests |
| `state-machine` | ⚙️ Gray | Issue #4 | State transitions |
| `bug` | 🐛 Red | Issue #5 | Known bugs |
| `findings` | ⚠️ Orange | Issue #5 | Documented findings |

---

## Example Navigation Links

Once issues are posted, add these links to repository README or docs:

```markdown
## Test Case Documentation

- **[API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/1)** — 17 boundary & validation tests
- **[API — Payment Processing](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/2)** — 23 payment scenario tests
- **[API — Authorization & Security](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/3)** — Cross-user isolation, auth tests (28 tests)
- **[E2E & State Machine](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/4)** — Full flow tests, rejections, termination (16 tests)
- **[⚠️ Findings — Known Defects](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/5)** — Documented bugs with root cause analysis (9 bugs)

**Quick Reference:** [TEST-CASES.md](automation/tests/TEST-CASES.md) contains summary table of all 120 tests.
```

---

## Formatting Tips

When pasting into GitHub:

### Markdown Tables Work as-is
```markdown
| ID | Title | Type | Priority |
|---|---|---|---|
| TC-QUO-001 | Rejects quotation with fewer than 2 rounds | Boundary | Critical |
```

### Code Blocks
Use triple backticks:
````
```json
{
  "quotation_id": "QUO-123"
}
```
````

### Links to Files
Use relative paths:
```markdown
**Test Reference:** [automation/tests/findings.spec.ts](automation/tests/findings.spec.ts)
```

### Headers
Use `#` for GitHub Issue context:
```markdown
## Section Name
### Subsection Name
#### Test Case: TC-QUO-001
```

---

## After Posting

### Update TEST-CASES.md Navigation

Replace the placeholder links with actual GitHub issue URLs:

Current (example):
```markdown
- **[API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/1)**
```

If your first issue becomes #42:
```markdown
- **[API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/42)**
```

### Create a "Test Documentation" Topic

On GitHub:
1. Go to **Repo Settings** → **Topics**
2. Add: `test-documentation`, `test-cases`, `qa`
3. Save

This helps others discover your test documentation.

---

## Suggested Repository Description Update

Update your repo description to mention test documentation:

Current:
```
Fastwork QA Challenge — Milestone Quotation & Payment Flow Testing
```

Suggested:
```
Fastwork QA Challenge — 120 Automated Tests + Detailed Documentation for Milestone Quotation & Payment Flow. PCI-DSS & GDPR Compliant.
```

---

## Total Time Estimate

| Task | Time |
|------|------|
| Post Issue #1 | 2 min |
| Post Issue #2 | 2 min |
| Post Issue #3 | 3 min |
| Post Issue #4 | 2 min |
| Post Issue #5 + Pin | 2 min |
| Update README links | 5 min |
| **Total** | **~16 minutes** |

---

## Quick Checklist

- [ ] Post Issue #1 (Quotation Validation)
- [ ] Post Issue #2 (Payment Processing)
- [ ] Post Issue #3 (Authorization & Security)
- [ ] Post Issue #4 (E2E & State Machine)
- [ ] Post Issue #5 (Findings)
- [ ] **PIN Issue #5**
- [ ] Update TEST-CASES.md with actual issue numbers
- [ ] Add cross-issue links (Related: Issue #1, #2, etc.)
- [ ] Update repo description
- [ ] Add test-documentation topics

---

## Tips for Success

1. **Copy in sections** — Don't try to copy the entire GITHUB-ISSUES.md at once. Copy one issue at a time.

2. **Preserve markdown** — GitHub Issues support full markdown. Tables, code blocks, and links work as-is.

3. **Use issue references** — When linking between issues, use `#1`, `#2`, etc. GitHub auto-converts to links.

4. **Assign labels carefully** — Multiple labels help with searching. Use the label list above.

5. **Pin Issue #5** — Findings (known bugs) should be pinned so they're always visible.

6. **Add to project** — If you use GitHub Projects, add all 5 issues to a "Test Documentation" project.

---

**All 120 test cases documented and ready for GitHub! 🎉**

