# Test Cases — Milestone Quotation & Payment Flow

Complete list of all automated test cases across API, UI, and E2E suites.

---

## API — Quotation Validation (`quotation.api.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-QUO-001 | Rejects quotation with fewer than 2 rounds | Boundary | 400 + "2 and 5" |
| TC-QUO-002 | Rejects quotation with more than 5 rounds | Boundary | 400 + "2 and 5" |
| TC-QUO-003 | Rejects when any round amount is exactly 100 THB | Boundary | 400 + "greater than 100" |
| TC-QUO-004 | Rejects when any round amount is 0 | Edge case | 400 |
| TC-QUO-005 | Rejects when total amount is exactly 3000 THB | Boundary | 400 + "3000 THB" |
| TC-QUO-006 | Rejects due_date in the past | Date validation | 400 + "future date" |
| TC-QUO-007 | Rejects missing title | Required field | 400 + "title" |
| TC-QUO-008 | Rejects missing description | Required field | 400 + "description" |
| TC-QUO-009 | Rejects missing deliverables | Required field | 400 + "deliverables" |
| TC-QUO-010 | Rejects missing seller_id | Required field | 400 |
| TC-QUO-011 | Accepts valid 2-round quotation (minimum rounds) | Happy path | 201 + quotation_id |
| TC-QUO-012 | Accepts valid 5-round quotation (maximum rounds) | Happy path | 201 + total_amount=3500 |
| TC-QUO-013 | Cannot accept a quotation that does not exist | Error handling | 404 |
| TC-QUO-014 | Rejects title exceeding 100 characters | Character limit | 400 + "100 characters" |
| TC-QUO-015 | Rejects description exceeding 2000 characters | Character limit | 400 + "2000 characters" |
| TC-QUO-016 | Rejects deliverables exceeding 500 characters | Character limit | 400 + "500 characters" |
| TC-QUO-017 | Cannot accept a quotation twice | State machine | 409 |

---

## API — Payment Failures (`payment.api.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-PAY-001 | Rejects missing required fields | Required fields | 400 + fields list |
| TC-PAY-002 | Rejects missing credit_card_owner_name | Required field | 400 |
| TC-PAY-003 | Rejects invalid card number (too short) | Format validation | 400 + "16 digits" |
| TC-PAY-004 | Rejects invalid card number (non-numeric) | Format validation | 400 |
| TC-PAY-005 | Rejects invalid expiration_date format | Format validation | 400 + "MM/YY" |
| TC-PAY-006 | Rejects invalid CVV (too short) | Format validation | 400 + "CVV" |
| TC-PAY-007 | Returns 402 for declined card (ending 0000) | Card decline | 402 + "declined" |
| TC-PAY-008 | Returns 402 when amount exceeds 1,000,000 | Amount limit | 402 |
| TC-PAY-009 | Rejects amount below 0.01 | Amount validation | 400 |
| TC-PAY-010 | Rejects unsupported currency (USD not in THB/VND/IDR) | Currency | 400 + "Unsupported" |
| TC-PAY-011 | Accepts payment in VND currency | Currency support | 200 + currency=VND |
| TC-PAY-012 | Accepts payment in IDR currency | Currency support | 200 + currency=IDR |
| TC-PAY-013 | Returns 401 for invalid Authorization token | Auth | 401 + "UNAUTHORIZE" |
| TC-PAY-014 | Returns 500 for payment gateway failure (card 9999…) | Server error | 500 + "INTERNAL_SERVER_ERROR" |
| TC-PAY-015 | Rejects payment on non-accepted quotation | State machine | 409 + "accepted" |
| TC-PAY-016 | Successful payment returns correct response shape | Happy path | 200 + PAY-* + masked_card |
| TC-PAY-017 | Same idempotency_key returns identical response (no double charge) | Idempotency | 200 × 2, same payment_id |
| TC-PAY-018 | Different idempotency_key after payment returns 409 | Idempotency | 409 |
| TC-PAY-019 | 5 concurrent requests with same key return consistent result | Concurrency | 200 × 5, 1 unique payment_id |
| TC-PAY-020 | Charged amount matches requested amount exactly | Data consistency | body.amount = totalAmount |
| TC-PAY-021 | Quotation state is "paid" after successful payment | Data consistency | 200 + status=paid + paid_at |
| TC-PAY-022 | Payment success transitions state from accepted → paid | Partial failure | status ≠ accepted |
| TC-PAY-023 | Payment on already-paid quotation is rejected | State machine | 409 |

---

## API — Service Window (`service-window.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-SW-001 | Payment blocked at 23:55 (start of window) | Boundary | 503 + "maintenance window" |
| TC-SW-002 | Payment blocked at 23:59 (mid-window) | Service window | 503 |
| TC-SW-003 | Payment blocked at 00:00 (midnight) | Service window | 503 |
| TC-SW-004 | Payment blocked at 00:15 (end of window) | Boundary | 503 |
| TC-SW-005 | Payment succeeds at 00:16 (just after window) | Boundary | 200 |
| TC-SW-006 | Payment succeeds at 23:54 (just before window) | Boundary | 200 |
| TC-SW-007 | Payment succeeds at 12:00 (normal business hours) | Happy path | 200 |

---

## API — Authorization (`authorization.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-AUTH-001 | Buyer B cannot pay for Buyer A's quotation | Cross-user | 403 + "Forbidden" |
| TC-AUTH-002 | Seller cannot initiate payment for own quotation | Role restriction | 403 |
| TC-AUTH-003 | Correct buyer can pay own quotation | Happy path | 200 |
| TC-AUTH-004 | Third-party user cannot view another user's quotation | Cross-user | 403 + "Forbidden" |
| TC-AUTH-005 | Seller can view own quotation | Happy path | 200 |
| TC-AUTH-006 | Buyer can view own quotation | Happy path | 200 |
| TC-AUTH-007 | Inactive buyer cannot pay — rejected at payment | Account status | 403 + "inactive" |
| TC-AUTH-008 | Inactive seller blocks payment | Account status | 403 + "inactive" |

---

## API — Quotation Rejection (`quotation-rejection.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-QUO-018 | Buyer can reject a draft quotation with reason | Happy path | 200 + status=rejected + reason |
| TC-QUO-019 | Quotation status is "rejected" after rejection | State check | 200 + status=rejected |
| TC-QUO-020 | Defaults to generic reason when none provided | Default value | 200 + reason truthy |
| TC-QUO-021 | Cannot reject a quotation that is already accepted | State machine | 409 + "accepted" |
| TC-QUO-022 | Cannot reject a quotation that is already rejected | State machine | 409 |
| TC-QUO-023 | Cannot pay a rejected quotation | State machine | 409 + "rejected" |
| TC-QUO-024 | Cannot reject a non-existent quotation | Error handling | 404 |

---

## API — Contract Completion (`quotation-rejection.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-CMP-001 | Quotation status is "completed" after final milestone accepted | State machine | status=completed |
| TC-CMP-002 | Quotation is NOT completed if only some milestones accepted | State check | status=in_progress |
| TC-CMP-003 | Cannot submit work on a completed quotation | Post-state | 409 |
| TC-CMP-004 | Cannot terminate a completed quotation | Post-state | 409 |

---

## UI — Form Validation (`quotation.ui.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-UI-001 | Shows error when required fields are empty | Validation | Error alert visible |
| TC-UI-002 | Shows error when amount is exactly 100 THB | Boundary | Error shown |
| TC-UI-003 | Shows error when total is exactly 3000 THB | Boundary | Error shown |
| TC-UI-004 | Shows error for past due date | Date validation | Error shown |
| TC-UI-005 | Add round button is hidden after 5 rounds are added | UI behaviour | Button not visible |
| TC-UI-006 | Total amount display updates as amounts are entered | Real-time calc | Displayed total matches sum |
| TC-UI-007 | Valid 2-round quotation moves to step 2 | Happy path | Step 2 active |
| TC-UI-008 | Shows inline error for invalid card number | Payment form | card-number-error visible |
| TC-UI-009 | Shows inline error for invalid expiry format | Payment form | card-expiry-error visible |

---

## E2E — Happy Path (`happy-path.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-E2E-001 | Seller creates valid 3-round quotation | Happy path | Step 2 active; 3 rows in review |
| TC-E2E-002 | Full flow: create → accept → pay → execute all rounds → verify transferred | Full E2E | All milestones transferred |
| TC-E2E-003 | UI shows masked card number in payment success | Card masking | `****-****-****-1111` visible |
| TC-E2E-004 | Step indicator progresses correctly through all 4 steps | UI progression | Steps 1–4 activate in order |

---

## E2E — Reject Work Flow (`reject-work.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-REJ-001 | API: buyer can reject submitted work — milestone returns to pending | State machine | 200 + status=rejected |
| TC-REJ-002 | API: milestone is pending after rejection — can resubmit | State machine | 200 + status=submitted |
| TC-REJ-003 | API: cannot reject work that is not yet submitted | State validation | 409 + "submitted" |
| TC-REJ-004 | API: cannot reject already-accepted work | State validation | 409 |
| TC-REJ-005 | UI: reject resets status to pending and re-enables submit button | UI behaviour | status=pending, submit enabled |
| TC-REJ-006 | UI: after rejection, seller can resubmit and buyer can accept (→ transferred) | Full reject cycle | status=transferred |

---

## E2E — Termination (`termination.spec.ts`)

| ID | Test Case | Type | Expected |
|----|-----------|------|----------|
| TC-TER-001 | API: terminate after round 1 — correct completed/remaining counts | State machine | completed_rounds=1, remaining_rounds=2 |
| TC-TER-002 | API: cannot terminate an already-terminated quotation | State machine | 409 + "terminated" |
| TC-TER-003 | API: after termination, submitting work returns error | Post-state | 409 |
| TC-TER-004 | API: quotation state is "terminated" after terminate call | State check | status=terminated |
| TC-TER-005 | UI: terminate button disables all action buttons | UI behaviour | All buttons disabled |
| TC-TER-006 | UI: termination shows info message with round counts | UI message | Alert contains "ยุติ" |

---

## Security & Compliance (`compliance.spec.ts`) — Bonus Challenge

### PCI-DSS & GDPR Compliance Tests

| ID | Test Case | Requirement | Expected |
|----|-----------|-------------|----------|
| S-01 | Card number not stored in plaintext in response | PCI-DSS Req 3 | 200 + no "4111111111111111" in body |
| S-02 | Card number masked in API response (last 4 digits only) | PCI-DSS Req 3.2.1 | 200 + masked_card="****-****-****-1111" |
| S-03 | CVV not returned in any API response | PCI-DSS Req 3.2.1 | 200 + cvv field absent |
| S-04 | Payment response contains no raw card data | PCI-DSS Req 3 | 200 + only safe fields (payment_id, amount, masked_card) |
| S-08 | SQL injection in quotation title field is sanitized | OWASP A03:2021 | 400 or 201 (sanitized), not 500 |
| S-09 | XSS payload in milestone description is escaped | OWASP A03:2021 | Payload not executed in DOM |
| S-10 | Oversized payload (> 10 MB) is rejected | Input validation | 400 or 413 Payload Too Large |
| S-11 | Negative amount in payment is rejected | Business logic | 400 — amount must be positive |
| S-12 | Unauthenticated request to payment returns 401 | PCI-DSS Req 8 | 401 + "UNAUTHORIZE" |
| S-13 | Cross-user quotation access is prevented | PCI-DSS Req 8.2 | 403 Forbidden or 409 Conflict |
| S-14 | Seller cannot trigger fund transfer directly via API | PCI-DSS Req 8.2 (RBAC) | 403 Forbidden or 404 Not Found |
| S-15 | Card number is absent from application logs | PCI-DSS Req 10.1 | Logs do not contain "4111111111111111" |
| S-16 | CVV is absent from application logs | PCI-DSS Req 10.1 | Logs do not contain CVV value |
| S-17 | Successful payments are audit-logged with safe fields | PCI-DSS Req 10 | 200 + payment_id, amount, timestamp, no card data |
| GDPR-01 | User data minimization: only necessary fields collected | GDPR Article 5(1)(c) | 201 + no unnecessary PII (email, phone, SSN) |
| GDPR-02 | Payment data not retained longer than necessary | GDPR Article 5(1)(e) | 200 + no full card data in subsequent queries |
| GDPR-03 | User can request data deletion (right to be forgotten) | GDPR Article 17 | 200 (if DELETE implemented) or 501 Not Implemented |
| S-05 | All endpoints enforce HTTPS (HTTP redirects) | PCI-DSS Req 4 | 301/302 redirect or HTTPS connection |
| S-06 | Authorization header prevents plaintext transmission | PCI-DSS Req 4 | 200 + secure transport |
| S-07 | Security headers present in responses | Defense in depth | Content-Type, X-Content-Type-Options, etc. present |

**Total Security Tests:** 20 (S-01–S-17, GDPR-01–03, S-05–S-07)

---

## Findings — Known Defects (`findings.spec.ts`)

> These tests are **expected to fail**. Each failure is a documented bug. Do not fix the implementation to make them pass — the failures are the deliverable.

| ID | Test Case | Severity | Expected (Requirement) | Actual (Bug) |
|----|-----------|----------|------------------------|--------------|
| FINDING-001a | Cannot submit round 2 before round 1 is accepted | High | 409 — previous round not accepted | 200 — skips accepted |
| FINDING-001b | Cannot submit round 3 while round 2 is only submitted | High | 409 — round 2 must be accepted first | 200 — accepted immediately |
| FINDING-002a | Cannot terminate a draft quotation | Medium | 409 — contract was never active | 200 — draft terminated |
| FINDING-002b | Cannot terminate a rejected quotation | Medium | 409 — nothing to terminate | 200 — rejected terminated |
| FINDING-003a | Cannot pay less than the quotation total | Critical | 400/422 — amount mismatch | 200 — underpayment accepted |
| FINDING-003b | Cannot pay more than the quotation total | Critical | 400/422 — amount mismatch | 200 — overpayment accepted |
| FINDING-004 | Shows inline error when card holder name is empty | Medium | Inline error visible | Payment succeeds with 'CARD HOLDER' substituted silently |
| FINDING-005 | Rejects credit_card_owner_name exceeding 100 characters | Medium | 400 — exceeds 100-char limit | 200 — oversized name accepted |
| FINDING-006 | Shows inline error when CVV contains non-numeric characters | Low→Medium | Inline error visible | UI may allow non-numeric CVV submission |

---

## Summary

| Suite | File | Tests |
|-------|------|-------|
| Quotation API | `api/quotation.api.spec.ts` | 17 (TC-QUO-001–017) |
| Payment API | `api/payment.api.spec.ts` | 23 (TC-PAY-001–023) |
| Service Window | `api/service-window.spec.ts` | 7 (TC-SW-001–007) |
| Authorization | `api/authorization.spec.ts` | 8 (TC-AUTH-001–008) |
| Quotation Rejection | `api/quotation-rejection.spec.ts` | 11 (TC-QUO-018–024, TC-CMP-001–004) |
| **Security & Compliance** | **`security/compliance.spec.ts`** | **20 (S-01–S-17, GDPR-01–03, S-05–S-07)** ← **BONUS** |
| UI Validation | `ui/quotation.ui.spec.ts` | 9 (TC-UI-001–009) |
| Happy Path E2E | `e2e/happy-path.spec.ts` | 4 (TC-E2E-001–004) |
| Reject Work | `e2e/reject-work.spec.ts` | 6 (TC-REJ-001–006) |
| Termination | `e2e/termination.spec.ts` | 6 (TC-TER-001–006) |
| Findings (expected fail) | `findings.spec.ts` | 8 (FINDING-001–006) |
| **Total** | | **120** |
