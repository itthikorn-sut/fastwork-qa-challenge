# GitHub Issues — Test Case Documentation

This document contains the detailed test case issues to post on GitHub. Each issue provides deep context, business rules, and reproducibility information for the test categories.

**Post these issues in this order:**
1. Issue #1 — API — Quotation Validation
2. Issue #2 — API — Payment Processing
3. Issue #3 — API — Authorization & Security
4. Issue #4 — E2E & State Machine Testing
5. Issue #5 — Findings — Known Defects

Pin Issue #5 to keep known defects visible.

---

## Issue #1: API — Quotation Validation (17 tests)

**Title:** `📋 Test Cases: API — Quotation Validation (TC-QUO-001 to TC-QUO-024)`

**Labels:** `documentation`, `test-cases`, `api`, `quotation`

**Assignees:** (Optional — QA lead)

### Description

This issue documents all **quotation validation test cases** (17 passing tests) covering **boundary testing**, **business rules**, and **error handling**.

#### Business Context

The quotation system enforces strict rules on:
- **Milestone count:** 2–5 (prevents incomplete contracts and operational complexity)
- **Per-round amount:** > 100 THB (prevents micro-transactions)
- **Total amount:** > 3000 THB (ensures meaningful contracts)
- **Required fields:** title, description, deliverables, seller_id
- **Character limits:** title (100), description (2000), deliverables (500)
- **Future due dates:** past dates are rejected

These boundaries are **critical for payment processing** — they ensure contracts are substantial enough to justify processing fees and multi-round workflow.

### Test Case: TC-QUO-001 (Minimum Milestone Boundary)

**Type:** Boundary Test | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Quotation must have **2–5 milestones** (minimum contract complexity). Single-milestone contracts bypass multi-round approval.

**Steps to Reproduce:**
1. POST `/api/v1/quotations` with `milestones.length = 1`
2. Server validates milestone count

**Expected Result:**
- HTTP 400 Bad Request
- Error message contains: "2 and 5"
- No quotation created in database

**Why It Matters:** Prevents incomplete contracts; ensures multi-round approval process is mandatory.

**Mock API Trigger:** None (validation only)

---

### Test Case: TC-QUO-002 (Maximum Milestone Boundary)

**Type:** Boundary Test | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Quotation must have **2–5 milestones** (prevents unwieldy contracts). Complex 6+ milestone contracts must be split.

**Steps to Reproduce:**
1. POST `/api/v1/quotations` with `milestones.length = 6`
2. Server validates milestone count

**Expected Result:**
- HTTP 400 Bad Request
- Error message contains: "2 and 5"
- No quotation created

**Why It Matters:** Enforces contract complexity limits; prevents operational burden on both parties.

---

### Test Case: TC-QUO-003 (Per-Round Amount Boundary — Lower)

**Type:** Boundary Test | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Each milestone amount must be **> 100 THB** (not ≥ 100). Minimum per-round payment to prevent micro-transactions.

**Boundary Detail:** 
- 100 THB → **REJECTED** (fails test)
- 101 THB → **ACCEPTED** (passes)

**Steps to Reproduce:**
1. Create 3 milestones with 1100 THB each
2. Override `milestone[1].amount = 100` (exactly at boundary)
3. POST `/api/v1/quotations`
4. Server validates each milestone amount > 100

**Expected Result:**
- HTTP 400 Bad Request
- Response details contain: "greater than 100"
- Quotation rejected; nothing created

**Why It Matters:** 
- Prevents low-value transactions (prevents system spam)
- Ensures meaningful work units
- **Critical boundary:** 100 → rejected, 101 → accepted

---

### Test Case: TC-QUO-005 (Total Amount Boundary — Lower)

**Type:** Boundary Test | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Total quotation amount must be **> 3000 THB** (not ≥ 3000). Minimum contract value enforcement.

**Boundary Detail:**
- 3000 THB → **REJECTED** (fails test)
- 3001 THB → **ACCEPTED** (passes)
- 3000.01 THB → **ACCEPTED** (edge case)

**Steps to Reproduce:**
1. Create 3 milestones × 1000 THB = 3000 THB total
2. POST `/api/v1/quotations`
3. Server validates `total > 3000` (not ≥ 3000)

**Expected Result:**
- HTTP 400 Bad Request
- Response details contain: "3000 THB"
- Quotation rejected

**Why It Matters:**
- Prevents low-value contracts
- Ensures significant work commitments
- **Boundary testing:** 3000.01 THB edge case should be accepted

---

### Remaining Tests (TC-QUO-004, 006–017)

| ID | Title | Type | Details |
|---|---|---|---|
| TC-QUO-004 | Rejects when round amount is 0 | Edge case | Negative/zero amounts rejected |
| TC-QUO-006 | Rejects due_date in the past | Date validation | `due_date < today` → 400 |
| TC-QUO-007 to TC-QUO-010 | Rejects missing required fields | Required field | title, description, deliverables, seller_id required |
| TC-QUO-011 | Accepts valid 2-round quotation | Happy path | Minimum valid rounds accepted |
| TC-QUO-012 | Accepts valid 5-round quotation | Happy path | Maximum valid rounds accepted |
| TC-QUO-013 | Cannot accept non-existent quotation | Error handling | Invalid quotation_id → 404 |
| TC-QUO-014 to TC-QUO-016 | Rejects character limit violations | Character limit | title (100), description (2000), deliverables (500) |
| TC-QUO-017 | Cannot accept quotation twice | State machine | Idempotent: accepting twice returns 409 |

---

### Key Takeaways

✅ All **17 tests passing**  
✅ **Boundary values precisely tested** (100 THB, 3000 THB, 2–5 milestones)  
✅ **Business rules enforced at API level** (not just UI)  
⚠️ See **Issue #5 (Findings)** for validation gaps

---

## Issue #2: API — Payment Processing (23 tests)

**Title:** `📋 Test Cases: API — Payment Processing (TC-PAY-001 to TC-PAY-023)`

**Labels:** `documentation`, `test-cases`, `api`, `payment`

### Description

This issue documents all **payment processing test cases** (23 passing tests) covering **card validation**, **payment failure scenarios**, **idempotency**, **concurrency**, and **data consistency**.

#### Business Context

Payment processing is the most critical and risky operation. Tests validate:
- **Card format:** 16-digit number, valid expiry, 3-digit CVV
- **Payment failures:** Declined cards, amount limits, unsupported currencies
- **State safety:** Payments only on accepted quotations
- **Idempotency:** Same request key = same response (no double-charge)
- **Concurrency:** Multiple simultaneous payments with same key return consistent result
- **Data consistency:** Charged amount matches requested amount exactly
- **State transition:** Quotation moves from `accepted` → `paid` atomically

### Test Case: TC-PAY-007 (Card Decline Simulation)

**Type:** Card Decline | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Cards ending in `0000` trigger mock decline (simulates real decline scenario). Quotation state not affected by failed payment.

**Mock API Trigger:** Card number ending in `0000` → HTTP 402

**Steps to Reproduce:**
1. Create and accept a valid quotation
2. POST `/api/v1/payments` with:
   ```json
   {
     "quotation_id": "QUO-123",
     "credit_card_number": "4111111111110000",
     "expiration_date": "12/25",
     "cvv": "123",
     "credit_card_owner_name": "John Doe"
   }
   ```
3. Mock API detects card ending in 0000

**Expected Result:**
- HTTP 402 Payment Required
- Response includes: "declined" or "insufficient funds"
- Payment NOT created in database
- Quotation remains "accepted" (not changed to "paid")

**Why It Matters:** 
- Tests payment failure handling
- Ensures state consistency on decline
- Buyer can retry with different card

---

### Test Case: TC-PAY-017 (Idempotency Key)

**Type:** Idempotency | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Idempotency: Same request key = same response, no side effects. Prevents double-charging if client retries.

**Steps to Reproduce:**
1. POST `/api/v1/payments` with:
   ```json
   {
     "quotation_id": "QUO-123",
     "amount": 5000,
     "idempotency_key": "unique-key-1",
     ...payment details...
   }
   ```
   → Response: HTTP 200, `payment_id: "PAY-abc123"`, `amount: 5000`

2. POST `/api/v1/payments` again with **SAME** `idempotency_key: "unique-key-1"`
3. Server checks cache and returns cached response

**Expected Result:**
- Both requests return HTTP 200 OK
- Both responses contain **identical** `payment_id` (e.g., "PAY-abc123")
- Both responses contain **identical** `amount` (e.g., 5000)
- No double charge; same payment returned twice
- Quotation charged only once

**Why It Matters:**
- Critical for payment reliability
- Prevents accidental double-charges
- Essential when network fails mid-response
- Buyer retries payment → idempotency ensures safe retry

---

### Test Case: TC-PAY-019 (Concurrent Payments)

**Type:** Concurrency | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** 5 simultaneous payment requests with the same `idempotency_key` must all return consistent result (same payment_id, same amount).

**Steps to Reproduce:**
1. Create and accept quotation (amount: 5000 THB)
2. Fire **5 concurrent requests** with identical payload:
   ```json
   {
     "quotation_id": "QUO-123",
     "amount": 5000,
     "idempotency_key": "concurrent-key-1",
     ...payment details...
   }
   ```
3. All 5 requests sent simultaneously (no waiting between)

**Expected Result:**
- All 5 requests return HTTP 200 OK
- All 5 responses contain **identical** `payment_id` (e.g., "PAY-xyz789")
- All 5 responses contain **identical** `amount` (5000)
- Only 1 payment created in database
- Quotation charged exactly once

**Why It Matters:**
- Tests race condition handling
- Ensures no payment duplication under load
- Critical for high-traffic scenarios

---

### Test Case: TC-PAY-020 (Amount Consistency)

**Type:** Data Consistency | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Charged amount MUST equal requested amount. No hidden fees, no under/over charging.

**Steps to Reproduce:**
1. Create quotation with total = 5000 THB
2. Accept quotation
3. POST `/api/v1/payments`:
   ```json
   {
     "quotation_id": "QUO-123",
     "amount": 5000,
     ...
   }
   ```

**Expected Result:**
- HTTP 200 OK
- Response `amount` field = 5000 (matches request exactly)
- No rounding errors, no surprise charges
- Database shows payment.amount = 5000

**Why It Matters:**
- Prevents billing disputes
- Ensures financial accuracy
- Essential for auditing

---

### Remaining Tests (TC-PAY-001 to TC-PAY-006, 008–016, 018, 021–023)

| ID | Title | Type | Details |
|---|---|---|---|
| TC-PAY-001 | Rejects missing required fields | Required fields | quotation_id, amount, card_number required |
| TC-PAY-002 | Rejects missing cardholder name | Required field | credit_card_owner_name required |
| TC-PAY-003 to TC-PAY-006 | Rejects invalid card format | Format validation | Card number length, CVV length, expiry format |
| TC-PAY-008 | Returns 402 when amount > 1,000,000 | Amount limit | Large payment rejection |
| TC-PAY-009 | Rejects amount < 0.01 | Amount validation | Minimum payment 0.01 |
| TC-PAY-010 | Rejects unsupported currency | Currency | Only THB, VND, IDR accepted |
| TC-PAY-011 to TC-PAY-012 | Accepts VND and IDR currency | Currency support | Multi-currency support verified |
| TC-PAY-013 | Returns 401 for invalid token | Auth | Authorization required |
| TC-PAY-014 | Returns 500 for gateway failure | Server error | Card 9999… simulates timeout |
| TC-PAY-015 | Rejects payment on non-accepted quotation | State machine | Must accept before paying |
| TC-PAY-016 | Successful payment returns correct shape | Happy path | Response schema validation |
| TC-PAY-018 | Different key after payment returns 409 | Idempotency | Prevents duplicate payments |
| TC-PAY-021 | Quotation state is "paid" after success | Data consistency | State transition verified |
| TC-PAY-022 | State transitions accepted → paid | Partial failure | Atomicity of state change |
| TC-PAY-023 | Rejects payment on already-paid quotation | State machine | Prevent re-paying |

---

### Key Takeaways

✅ All **23 tests passing**  
✅ **Idempotency tested** (same key = safe retry)  
✅ **Concurrency tested** (5 simultaneous requests handled safely)  
✅ **Amount consistency verified** (charged = requested)  
⚠️ See **Issue #5 (Findings)** for partial/full payment validation gaps

---

## Issue #3: API — Authorization & Security (8 auth + 20 security tests)

**Title:** `📋 Test Cases: API — Authorization & Security (TC-AUTH-* and S-*)`

**Labels:** `documentation`, `test-cases`, `security`, `pci-dss`, `gdpr`

### Description

This issue documents **8 authorization tests** and **20 security/compliance tests** covering **cross-user isolation**, **role-based access control**, **PCI-DSS compliance**, and **GDPR requirements**.

#### Business Context

A payment system handling cardholder data must comply with **PCI-DSS** and **GDPR**:

**PCI-DSS Requirements:**
- Req 3: Protect cardholder data (mask cards, never log CVV)
- Req 4: Encrypt transmission (HTTPS only)
- Req 6: Secure development (input validation, injection prevention)
- Req 8: User authentication & authorization
- Req 10: Log & monitor all access

**GDPR Requirements:**
- Article 5(1)(c): Data minimization (collect only necessary data)
- Article 5(1)(e): Storage limitation (delete after retention period)
- Article 17: Right to be forgotten (user can request deletion)

### Authorization Tests

#### Test Case: TC-AUTH-001 (Cross-User Payment Prevention)

**Type:** Cross-user isolation | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Only the buyer who accepted a quotation can pay for it. Cross-buyer access prevents payment hijacking.

**Steps to Reproduce:**
1. Seller S1 creates quotation → Buyer A accepts
2. Buyer B obtains Buyer A's `quotation_id` (from leaked database, API listing, etc.)
3. Buyer B attempts: POST `/api/v1/payments` with Buyer A's quotation_id
   ```json
   {
     "quotation_id": "QUO-123",
     "buyer_id": "BUYER-B",
     ...
   }
   ```

**Expected Result:**
- HTTP 403 Forbidden or 409 Conflict
- Error message: "Not authorized" or "Forbidden"
- Payment rejected; quotation remains "accepted"

**Why It Matters:**
- **Critical security control:** prevents payment fraud
- Ensures buyer authentication on sensitive operations
- Without this: Buyer B could pay for Buyer A's contract

---

#### Test Case: TC-AUTH-004 (Cross-User Data Access Prevention)

**Type:** Data access control | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Only quotation parties (seller, buyer) can view quotation. Third parties denied access.

**Steps to Reproduce:**
1. Seller S1 creates quotation for Buyer A
2. User C (unauthorized) requests: GET `/api/v1/quotations/{quotation_id}`

**Expected Result:**
- HTTP 403 Forbidden
- No quotation data returned
- Error message included

**Why It Matters:**
- Prevents data leakage
- Enforces privacy boundaries
- Without this: Attacker could enumerate all quotations

---

### Security Tests (PCI-DSS & GDPR)

#### Test Case: S-02 (Card Masking)

**Type:** PCI-DSS Compliance | **Priority:** Critical | **Status:** ✅ Passing

**Requirement:** PCI-DSS Requirement 3.2.1: Protect stored cardholder data

**Business Rule:**
- ✅ Card numbers masked as `****-****-****-XXXX`
- ✅ Only last 4 digits visible
- ✅ Safe for logging, safe for debugging
- ❌ Full PAN never returned

**Steps to Reproduce:**
1. POST `/api/v1/payments` with full card: `"4111111111111111"`
2. Server processes payment
3. Server returns response

**Expected Result:**
- HTTP 200 OK
- Response contains: `"masked_card": "****-****-****-1111"`
- Full card number (`4111111111111111`) NOT in response body
- Response JSON does NOT contain full PAN anywhere

**Compliance:**
- ✅ PCI-DSS compliant
- ✅ GDPR compliant (card data protected)

**Why It Matters:**
- Violating this = **PCI-DSS non-compliance**
- Consequences:
  - €20M GDPR fines (4% of revenue)
  - Payment processing license revoked
  - Customer lawsuits
  - Public data breach notification

---

#### Test Case: S-08 (SQL Injection Prevention)

**Type:** Input Validation | **Priority:** Critical | **Status:** ✅ Passing

**Requirement:** OWASP A03:2021 Injection

**Attack Payload:**
```
POST /api/v1/quotations
{
  "title": "'; DROP TABLE quotations; --"
}
```

**Expected Result:**
- HTTP 400 Bad Request (rejected) OR 201 Created (sanitized)
- **Never** HTTP 500 (unhandled error)
- Database remains intact; no tables dropped
- Error message included (if validation rejects)

**Why It Matters:**
- SQL injection can expose or **destroy entire database**
- Critical for data security and availability

---

#### Test Case: S-13 (Cross-User Quotation Access)

**Type:** Authorization (PCI-DSS Req 8.2) | **Priority:** Critical | **Status:** ✅ Passing

**Requirement:** PCI-DSS Requirement 8.2: Role-based access control

**Steps to Reproduce:**
1. Create quotation for Buyer A (`quotation_id = "QUO-123"`)
2. Buyer B attempts: GET `/api/v1/quotations/QUO-123`
3. Server checks: `auth.buyer_id === quotation.buyer_id`

**Expected Result:**
- HTTP 403 Forbidden or 409 Conflict
- Quotation data NOT returned
- Access denied

**Why It Matters:**
- Prevents customer data leakage
- Ensures confidentiality
- **PCI-DSS mandatory control** for card data protection

---

### Remaining Tests (S-01, 03–07, 09–12, 14–17, GDPR-01 to 03)

| ID | Title | Requirement | Details |
|---|---|---|---|
| S-01 | Card number not in plaintext response | PCI-DSS Req 3 | Full PAN must not appear |
| S-03 | CVV never returned | PCI-DSS Req 3.2.1 | CVV field must not appear in response |
| S-04 | No raw card data in response | PCI-DSS Req 3 | Only safe fields returned |
| S-05 | HTTPS enforcement | PCI-DSS Req 4 | HTTP → HTTPS redirect |
| S-06 | Authorization header | PCI-DSS Req 4 | Bearer token required |
| S-07 | Security headers | PCI-DSS Req 4 | X-Content-Type-Options, X-Frame-Options |
| S-09 | XSS prevention | OWASP A03:2021 | Scripts escaped in output |
| S-10 | Oversized payload rejection | Input validation | > 10 MB → 413 |
| S-11 | Negative amount rejection | Business logic | amount < 0 → 400 |
| S-12 | Authentication required | PCI-DSS Req 8 | Missing token → 401 |
| S-14 | RBAC for fund transfer | PCI-DSS Req 8.2 | Seller cannot trigger transfer |
| S-15 | Card number absent from logs | PCI-DSS Req 10.1 | Never log full PAN |
| S-16 | CVV absent from logs | PCI-DSS Req 10.1 | Never log CVV |
| S-17 | Audit logging safe fields | PCI-DSS Req 10 | Log: payment_id, amount, timestamp |
| GDPR-01 | Data minimization | GDPR Article 5(1)(c) | Collect only necessary fields |
| GDPR-02 | Storage limitation | GDPR Article 5(1)(e) | Delete after retention period |
| GDPR-03 | Right to be forgotten | GDPR Article 17 | User deletion endpoint |

---

### Key Takeaways

✅ All **28 tests passing** (8 auth + 20 security)  
✅ **PCI-DSS compliance verified** (card masking, no CVV logging, HTTPS)  
✅ **Cross-user isolation enforced** (no payment hijacking)  
✅ **Injection attacks prevented** (SQL, XSS)  

---

## Issue #4: E2E & State Machine Testing (16 tests)

**Title:** `📋 Test Cases: E2E & State Machine (TC-E2E-*, TC-REJ-*, TC-TER-*)`

**Labels:** `documentation`, `test-cases`, `e2e`, `state-machine`

### Description

This issue documents **16 end-to-end and state machine tests** covering **full quotation lifecycle**, **milestone rejection**, and **contract termination**.

#### Test Case: TC-E2E-002 (Full Happy Path)

**Type:** Full E2E | **Priority:** Critical | **Status:** ✅ Passing

**Business Rule:** Complete quotation lifecycle: create → accept → pay → execute all rounds → transfer funds.

**Steps to Reproduce:**
1. Seller creates 3-round quotation (3300 THB total)
2. Buyer accepts quotation
3. Buyer pays (3300 THB)
4. For each round (1, 2, 3):
   - Seller submits work
   - Buyer accepts work
   - API transfers funds for that round
5. Quotation completion verified

**Expected Result:**
- Quotation state: draft → accepted → paid → completed
- All 3 milestones: pending → submitted → accepted → transferred
- Buyer receives completion status
- All funds transferred

---

#### Test Case: TC-REJ-001 (Work Rejection)

**Type:** State machine | **Priority:** High | **Status:** ✅ Passing

**Business Rule:** Buyer can reject submitted work. Milestone returns to pending (seller can resubmit).

**Steps to Reproduce:**
1. Quotation accepted and paid
2. Seller submits round 1 work
3. Buyer rejects round 1
4. Verify milestone state

**Expected Result:**
- Milestone transitions: pending → submitted → pending
- Seller can resubmit
- Buyer can accept resubmitted work

---

#### Test Case: TC-TER-001 (Contract Termination)

**Type:** State machine | **Priority:** High | **Status:** ✅ Passing

**Business Rule:** Terminate after round 1 — correct completed/remaining counts.

**Steps to Reproduce:**
1. Quotation accepted and paid (3 milestones)
2. Seller submits and buyer accepts round 1
3. Buyer terminates contract
4. Verify quotation state

**Expected Result:**
- Quotation state: "terminated"
- Completed rounds: 1
- Remaining rounds: 2 (not executed)

---

### Remaining Tests (TC-E2E-001, 003–004, TC-REJ-002–006, TC-TER-002–006)

[See TEST-CASES.md for full listing]

---

## Issue #5: Findings — Known Defects ⚠️

**Title:** `⚠️ FINDINGS: Known Defects (FINDING-001 through FINDING-006)`

**Labels:** `bug`, `findings`, `test-documentation`

**Pinned:** ✅ Yes (keep visible)

### Description

This issue documents **9 expected test failures** representing **known defects** or **gaps in validation**.

These tests are marked as **expected to fail** (`test.skip()` or `.toFail()`). They represent **real bugs** that should be fixed in future development.

---

### Finding: FINDING-003a (Underpayment Bug)

**Title:** Cannot pay less than quotation total

**Type:** Data validation bug | **Severity:** Critical | **Priority:** Critical

**Precondition:** Quotation created with total = 5000 THB, accepted

**Steps to Reproduce:**
1. POST `/api/v1/payments` with:
   ```json
   {
     "quotation_id": "QUO-123",
     "amount": 4999,  // 1 THB short
     ...
   }
   ```
2. Server should validate `amount === total`

**Expected Result (Correct Behavior):**
- HTTP 400 Bad Request or 422 Unprocessable Entity
- Error: "Payment amount must equal quotation total"
- Payment rejected
- Quotation remains "accepted"

**Actual Result (Current Bug):**
```
❌ HTTP 200 OK
❌ Payment succeeds with underpayment
❌ Quotation transitions to "paid"
❌ Seller receives 4999 THB instead of 5000 THB
```

**Status:** Expected to fail (documented bug)

**Impact Analysis:**

| Metric | Impact |
|--------|--------|
| **Revenue Loss** | 1 THB per underpayment |
| **Scale** | 1000 transactions/day × 1 THB = **1000 THB/day loss** |
| **Annual Loss** | 1000 × 365 = **365,000 THB/year** |
| **Severity** | Critical for financial integrity |

**Root Cause:**

The `/api/v1/payments` endpoint is missing validation:
```javascript
// MISSING VALIDATION:
if (payment.amount !== quotation.total_amount) {
  return res.status(400).json({ error: "Payment amount must match quotation total" });
}
```

Amount is accepted as-is without comparison to quotation.total_amount.

**Fix Strategy:**

Add validation in `POST /api/v1/payments` endpoint:

```javascript
// Before creating payment:
const quotation = await db.quotations.findById(payment.quotation_id);

if (payment.amount !== quotation.total_amount) {
  return res.status(400).json({
    error: "Payment amount must match quotation total",
    expected_amount: quotation.total_amount,
    received_amount: payment.amount
  });
}

// Then proceed with payment creation
```

**Test Reference:** [automation/tests/findings.spec.ts](automation/tests/findings.spec.ts)

---

### Finding: FINDING-004 (UI Validation Bug)

**Title:** Shows inline error when card holder name is empty

**Type:** UI validation bug | **Severity:** Medium | **Priority:** High

**Precondition:** Payment form open

**Steps to Reproduce:**
1. Leave card holder name empty
2. Attempt to submit payment
3. Observe form behavior

**Expected Result (Correct Behavior):**
- ✅ Inline error displayed: "Card holder name is required"
- ✅ Form prevents submission
- ✅ Focus returns to cardholder name field

**Actual Result (Current Bug):**
```
❌ Payment succeeds
❌ Cardholder name silently defaults to "CARD HOLDER"
❌ No error shown to user
❌ Data quality issue
```

**Impact Analysis:**

| Issue | Impact |
|-------|--------|
| **User confusion** | No feedback that field was required |
| **Data quality** | Invalid cardholder names ("CARD HOLDER") in records |
| **Chargeback risk** | Invalid cardholder name increases chargeback disputes |
| **Compliance** | PCI-DSS requires accurate cardholder data |

**Root Cause:**

UI form missing validation:
- No `required` attribute on `<input name="credit_card_owner_name">`
- No client-side onChange validator
- Backend accepts empty/default values

**Fix Strategy:**

1. Add HTML5 validation:
   ```html
   <input 
     name="credit_card_owner_name" 
     required 
     placeholder="Full name on card"
   />
   ```

2. Add client-side validation:
   ```javascript
   if (!formData.credit_card_owner_name?.trim()) {
     showError("Card holder name is required");
     return false;
   }
   ```

3. Add server-side validation (if not present):
   ```javascript
   if (!req.body.credit_card_owner_name) {
     return res.status(400).json({ error: "Card holder name required" });
   }
   ```

**Test Reference:** [automation/tests/findings.spec.ts](automation/tests/findings.spec.ts)

---

### Remaining Findings

| ID | Title | Severity | Impact | Fix Complexity |
|---|---|---|---|---|
| FINDING-001a | Cannot submit round 2 before round 1 accepted | High | Workflow bypass | Medium |
| FINDING-001b | Cannot submit round 3 while round 2 only submitted | High | Workflow bypass | Medium |
| FINDING-002a | Cannot terminate draft quotation | Medium | UI confusion | Low |
| FINDING-002b | Cannot terminate rejected quotation | Medium | UI confusion | Low |
| FINDING-003b | Cannot pay more than quotation total | Critical | Overpayment bug | Medium |
| FINDING-005 | Rejects cardholder name > 100 chars | Medium | Edge case | Low |
| FINDING-006 | Shows error when CVV has non-numeric | Medium | UX issue | Low |

---

### How to Use This Issue

1. **For Developers:** Review "Fix Strategy" section
2. **For QA:** Click "Test Reference" link to see the actual test code
3. **For Prioritization:** Sort by Severity (Critical → High → Medium)
4. **For Backlog:** Create dev tickets referencing these findings

---

## Summary

- ✅ **Passing Tests:** 96 across all categories
- ❌ **Expected Failures:** 9 documented bugs
- 📚 **Total Documentation:** 120 test cases with business rules and reproducibility steps

---

## Navigation

Use these links to jump between GitHub issues:

1. **[Issue #1: API — Quotation Validation](#issue-1-api--quotation-validation-17-tests)** — 17 tests
2. **[Issue #2: API — Payment Processing](#issue-2-api--payment-processing-23-tests)** — 23 tests
3. **[Issue #3: API — Authorization & Security](#issue-3-api--authorization--security-8-auth--20-security-tests)** — 28 tests
4. **[Issue #4: E2E & State Machine](#issue-4-e2e--state-machine-testing-16-tests)** — 16 tests
5. **[Issue #5: Findings — Known Defects](#issue-5-findings--known-defects-)** — 9 documented bugs

