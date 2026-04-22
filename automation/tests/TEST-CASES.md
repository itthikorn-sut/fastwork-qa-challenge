# Test Cases — Milestone Quotation & Payment Flow

**Complete test case inventory:** 120 automated tests across API, UI, E2E, and Security categories.

For detailed documentation and business rule context, see [GitHub Issues](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues) (linked by category).

---

## Quick Reference by Category

### API — Quotation Validation (17 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-QUO-001 | Rejects quotation with fewer than 2 rounds | Boundary | Critical | ✅ Pass |
| TC-QUO-002 | Rejects quotation with more than 5 rounds | Boundary | Critical | ✅ Pass |
| TC-QUO-003 | Rejects when any round amount is exactly 100 THB | Boundary | Critical | ✅ Pass |
| TC-QUO-004 | Rejects when any round amount is 0 | Edge case | High | ✅ Pass |
| TC-QUO-005 | Rejects when total amount is exactly 3000 THB | Boundary | Critical | ✅ Pass |
| TC-QUO-006 | Rejects due_date in the past | Date validation | High | ✅ Pass |
| TC-QUO-007 | Rejects missing title | Required field | High | ✅ Pass |
| TC-QUO-008 | Rejects missing description | Required field | High | ✅ Pass |
| TC-QUO-009 | Rejects missing deliverables | Required field | High | ✅ Pass |
| TC-QUO-010 | Rejects missing seller_id | Required field | High | ✅ Pass |
| TC-QUO-011 | Accepts valid 2-round quotation (minimum rounds) | Happy path | High | ✅ Pass |
| TC-QUO-012 | Accepts valid 5-round quotation (maximum rounds) | Happy path | High | ✅ Pass |
| TC-QUO-013 | Cannot accept a quotation that does not exist | Error handling | Medium | ✅ Pass |
| TC-QUO-014 | Rejects title exceeding 100 characters | Character limit | Medium | ✅ Pass |
| TC-QUO-015 | Rejects description exceeding 2000 characters | Character limit | Medium | ✅ Pass |
| TC-QUO-016 | Rejects deliverables exceeding 500 characters | Character limit | Medium | ✅ Pass |
| TC-QUO-017 | Cannot accept a quotation twice | State machine | High | ✅ Pass |

### API — Payment Processing (23 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-PAY-001 | Rejects missing required fields | Required fields | Critical | ✅ Pass |
| TC-PAY-002 | Rejects missing credit_card_owner_name | Required field | High | ✅ Pass |
| TC-PAY-003 | Rejects invalid card number (too short) | Format validation | High | ✅ Pass |
| TC-PAY-004 | Rejects invalid card number (non-numeric) | Format validation | High | ✅ Pass |
| TC-PAY-005 | Rejects invalid expiration_date format | Format validation | High | ✅ Pass |
| TC-PAY-006 | Rejects invalid CVV (too short) | Format validation | High | ✅ Pass |
| TC-PAY-007 | Returns 402 for declined card (ending 0000) | Card decline | Critical | ✅ Pass |
| TC-PAY-008 | Returns 402 when amount exceeds 1,000,000 | Amount limit | High | ✅ Pass |
| TC-PAY-009 | Rejects amount below 0.01 | Amount validation | High | ✅ Pass |
| TC-PAY-010 | Rejects unsupported currency (USD not in THB/VND/IDR) | Currency | Medium | ✅ Pass |
| TC-PAY-011 | Accepts payment in VND currency | Currency support | Medium | ✅ Pass |
| TC-PAY-012 | Accepts payment in IDR currency | Currency support | Medium | ✅ Pass |
| TC-PAY-013 | Returns 401 for invalid Authorization token | Auth | Critical | ✅ Pass |
| TC-PAY-014 | Returns 500 for payment gateway failure (card 9999…) | Server error | Medium | ✅ Pass |
| TC-PAY-015 | Rejects payment on non-accepted quotation | State machine | Critical | ✅ Pass |
| TC-PAY-016 | Successful payment returns correct response shape | Happy path | Critical | ✅ Pass |
| TC-PAY-017 | Same idempotency_key returns identical response (no double charge) | Idempotency | Critical | ✅ Pass |
| TC-PAY-018 | Different idempotency_key after payment returns 409 | Idempotency | High | ✅ Pass |
| TC-PAY-019 | 5 concurrent requests with same key return consistent result | Concurrency | Critical | ✅ Pass |
| TC-PAY-020 | Charged amount matches requested amount exactly | Data consistency | Critical | ✅ Pass |
| TC-PAY-021 | Quotation state is "paid" after successful payment | Data consistency | High | ✅ Pass |
| TC-PAY-022 | Payment success transitions state from accepted → paid | Partial failure | High | ✅ Pass |
| TC-PAY-023 | Payment on already-paid quotation is rejected | State machine | High | ✅ Pass |

### API — Service Window (7 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-SW-001 | Payment blocked at 23:55 (start of window) | Boundary | Medium | ✅ Pass |
| TC-SW-002 | Payment blocked at 23:59 (mid-window) | Service window | Medium | ✅ Pass |
| TC-SW-003 | Payment blocked at 00:00 (midnight) | Service window | Medium | ✅ Pass |
| TC-SW-004 | Payment blocked at 00:15 (end of window) | Boundary | Medium | ✅ Pass |
| TC-SW-005 | Payment succeeds at 00:16 (just after window) | Boundary | Medium | ✅ Pass |
| TC-SW-006 | Payment succeeds at 23:54 (just before window) | Boundary | Medium | ✅ Pass |
| TC-SW-007 | Payment succeeds at 12:00 (normal business hours) | Happy path | Medium | ✅ Pass |

### API — Authorization (8 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-AUTH-001 | Buyer B cannot pay for Buyer A's quotation | Cross-user | Critical | ✅ Pass |
| TC-AUTH-002 | Seller cannot initiate payment for own quotation | Role restriction | Critical | ✅ Pass |
| TC-AUTH-003 | Correct buyer can pay own quotation | Happy path | High | ✅ Pass |
| TC-AUTH-004 | Third-party user cannot view another user's quotation | Cross-user | Critical | ✅ Pass |
| TC-AUTH-005 | Seller can view own quotation | Happy path | High | ✅ Pass |
| TC-AUTH-006 | Buyer can view own quotation | Happy path | High | ✅ Pass |
| TC-AUTH-007 | Inactive buyer cannot pay — rejected at payment | Account status | High | ✅ Pass |
| TC-AUTH-008 | Inactive seller blocks payment | Account status | High | ✅ Pass |

### API — Quotation Rejection (7 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-QUO-018 | Buyer can reject a draft quotation with reason | Happy path | Medium | ✅ Pass |
| TC-QUO-019 | Quotation status is "rejected" after rejection | State check | Medium | ✅ Pass |
| TC-QUO-020 | Defaults to generic reason when none provided | Default value | Low | ✅ Pass |
| TC-QUO-021 | Cannot reject a quotation that is already accepted | State machine | High | ✅ Pass |
| TC-QUO-022 | Cannot reject a quotation that is already rejected | State machine | Medium | ✅ Pass |
| TC-QUO-023 | Cannot pay a rejected quotation | State machine | High | ✅ Pass |
| TC-QUO-024 | Cannot reject a non-existent quotation | Error handling | Low | ✅ Pass |

### API — Contract Completion (4 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-CMP-001 | Quotation status is "completed" after final milestone accepted | State machine | High | ✅ Pass |
| TC-CMP-002 | Quotation is NOT completed if only some milestones accepted | State check | High | ✅ Pass |
| TC-CMP-003 | Cannot submit work on a completed quotation | Post-state | Medium | ✅ Pass |
| TC-CMP-004 | Cannot terminate a completed quotation | Post-state | Medium | ✅ Pass |

### UI — Form Validation (9 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-UI-001 | Shows error when required fields are empty | Validation | High | ✅ Pass |
| TC-UI-002 | Shows error when amount is exactly 100 THB | Boundary | High | ✅ Pass |
| TC-UI-003 | Shows error when total is exactly 3000 THB | Boundary | High | ✅ Pass |
| TC-UI-004 | Shows error for past due date | Date validation | High | ✅ Pass |
| TC-UI-005 | Add round button is hidden after 5 rounds are added | UI behaviour | Medium | ✅ Pass |
| TC-UI-006 | Total amount display updates as amounts are entered | Real-time calc | Medium | ✅ Pass |
| TC-UI-007 | Valid 2-round quotation moves to step 2 | Happy path | Medium | ✅ Pass |
| TC-UI-008 | Shows inline error for invalid card number | Payment form | High | ✅ Pass |
| TC-UI-009 | Shows inline error for invalid expiry format | Payment form | High | ✅ Pass |

### E2E — Happy Path (4 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-E2E-001 | Seller creates valid 3-round quotation | Happy path | High | ✅ Pass |
| TC-E2E-002 | Full flow: create → accept → pay → execute all rounds → verify transferred | Full E2E | Critical | ✅ Pass |
| TC-E2E-003 | UI shows masked card number in payment success | Card masking | High | ✅ Pass |
| TC-E2E-004 | Step indicator progresses correctly through all 4 steps | UI progression | Medium | ✅ Pass |

### E2E — Work Rejection (6 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-REJ-001 | API: buyer can reject submitted work — milestone returns to pending | State machine | High | ✅ Pass |
| TC-REJ-002 | API: milestone is pending after rejection — can resubmit | State machine | High | ✅ Pass |
| TC-REJ-003 | API: cannot reject work that is not yet submitted | State validation | High | ✅ Pass |
| TC-REJ-004 | API: cannot reject already-accepted work | State validation | High | ✅ Pass |
| TC-REJ-005 | UI: reject resets status to pending and re-enables submit button | UI behaviour | Medium | ✅ Pass |
| TC-REJ-006 | UI: after rejection, seller can resubmit and buyer can accept (→ transferred) | Full reject cycle | Medium | ✅ Pass |

### E2E — Contract Termination (6 tests)

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| TC-TER-001 | API: terminate after round 1 — correct completed/remaining counts | State machine | High | ✅ Pass |
| TC-TER-002 | API: cannot terminate an already-terminated quotation | State machine | High | ✅ Pass |
| TC-TER-003 | API: after termination, submitting work returns error | Post-state | High | ✅ Pass |
| TC-TER-004 | API: quotation state is "terminated" after terminate call | State check | High | ✅ Pass |
| TC-TER-005 | UI: terminate button disables all action buttons | UI behaviour | Medium | ✅ Pass |
| TC-TER-006 | UI: termination shows info message with round counts | UI message | Medium | ✅ Pass |

### Security & Compliance (20 tests)

| ID | Title | Requirement | Priority | Status |
|----|-------|-------------|----------|--------|
| S-01 | Card number not stored in plaintext in response | PCI-DSS Req 3 | Critical | ✅ Pass |
| S-02 | Card number masked in API response (last 4 digits only) | PCI-DSS Req 3.2.1 | Critical | ✅ Pass |
| S-03 | CVV not returned in any API response | PCI-DSS Req 3.2.1 | Critical | ✅ Pass |
| S-04 | Payment response contains no raw card data | PCI-DSS Req 3 | Critical | ✅ Pass |
| S-05 | All endpoints enforce HTTPS (HTTP redirects) | PCI-DSS Req 4 | High | ✅ Pass |
| S-06 | Authorization header prevents plaintext transmission | PCI-DSS Req 4 | High | ✅ Pass |
| S-07 | Security headers present in responses | PCI-DSS Req 4 | High | ✅ Pass |
| S-08 | SQL injection in quotation title field is sanitized | OWASP A03:2021 | Critical | ✅ Pass |
| S-09 | XSS payload in milestone description is escaped | OWASP A03:2021 | Critical | ✅ Pass |
| S-10 | Oversized payload (> 10 MB) is rejected | Input validation | High | ✅ Pass |
| S-11 | Negative amount in payment is rejected | Business logic | High | ✅ Pass |
| S-12 | Unauthenticated request to payment returns 401 | PCI-DSS Req 8 | Critical | ✅ Pass |
| S-13 | Cross-user quotation access is prevented | PCI-DSS Req 8.2 | Critical | ✅ Pass |
| S-14 | Seller cannot trigger fund transfer directly via API | PCI-DSS Req 8.2 (RBAC) | Critical | ✅ Pass |
| S-15 | Card number is absent from application logs | PCI-DSS Req 10.1 | Critical | ✅ Pass |
| S-16 | CVV is absent from application logs | PCI-DSS Req 10.1 | Critical | ✅ Pass |
| S-17 | Successful payments are audit-logged with safe fields | PCI-DSS Req 10 | Critical | ✅ Pass |
| GDPR-01 | User data minimization: only necessary fields collected | GDPR Article 5(1)(c) | High | ✅ Pass |
| GDPR-02 | Payment data not retained longer than necessary | GDPR Article 5(1)(e) | High | ✅ Pass |
| GDPR-03 | User can request data deletion (right to be forgotten) | GDPR Article 17 | High | ✅ Pass |

### Findings — Known Defects (9 tests)

| ID | Title | Severity | Priority | Status |
|----|-------|----------|----------|--------|
| FINDING-001a | Cannot submit round 2 before round 1 is accepted | High | Critical | ❌ Expected Fail |
| FINDING-001b | Cannot submit round 3 while round 2 is only submitted | High | Critical | ❌ Expected Fail |
| FINDING-002a | Cannot terminate a draft quotation | Medium | High | ❌ Expected Fail |
| FINDING-002b | Cannot terminate a rejected quotation | Medium | High | ❌ Expected Fail |
| FINDING-003a | Cannot pay less than the quotation total | Critical | Critical | ❌ Expected Fail |
| FINDING-003b | Cannot pay more than the quotation total | Critical | Critical | ❌ Expected Fail |
| FINDING-004 | Shows inline error when card holder name is empty | Medium | High | ❌ Expected Fail |
| FINDING-005 | Rejects credit_card_owner_name exceeding 100 characters | Medium | High | ❌ Expected Fail |
| FINDING-006 | Shows inline error when CVV contains non-numeric characters | Medium | Medium | ❌ Expected Fail |

---

## Summary

| Category | Tests | Status |
|----------|-------|--------|
| API — Quotation Validation | 17 | ✅ All passing |
| API — Payment Processing | 23 | ✅ All passing |
| API — Service Window | 7 | ✅ All passing |
| API — Authorization | 8 | ✅ All passing |
| API — Quotation Rejection | 7 | ✅ All passing |
| API — Contract Completion | 4 | ✅ All passing |
| UI — Form Validation | 9 | ✅ All passing |
| E2E — Happy Path | 4 | ✅ All passing |
| E2E — Work Rejection | 6 | ✅ All passing |
| E2E — Contract Termination | 6 | ✅ All passing |
| **Security & Compliance** | **20** | **✅ All passing** |
| Findings (Expected failures) | 9 | ❌ Documented bugs |
| **TOTAL** | **120** | **96 passing + 9 expected fail** |

---

## Navigation

🔗 **Detailed test documentation by category:**

- **[API — Quotation Validation](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/1)** — 17 boundary & validation tests
- **[API — Payment Processing](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/2)** — 23 payment scenario tests
- **[API — Authorization & Security](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/3)** — Cross-user isolation, auth tests
- **[E2E & State Machine](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/4)** — Full flow tests, rejections, termination
- **[Findings — Known Defects](https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/5)** — Documented bugs with root cause analysis

---

## How to Use

- **Quick lookup** → Search this table by test ID
- **Business rule context** → Visit linked GitHub Issue
- **View test code** → Search `.spec.ts` files by test ID
- **Report a bug** → Reference the test ID in your ticket
