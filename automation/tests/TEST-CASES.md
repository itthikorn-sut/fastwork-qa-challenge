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

## Summary

| Suite | File | Tests |
|-------|------|-------|
| Quotation API | `api/quotation.api.spec.ts` | 17 |
| Payment API | `api/payment.api.spec.ts` | 23 |
| Service Window | `api/service-window.spec.ts` | 7 |
| Authorization | `api/authorization.spec.ts` | 6 |
| UI Validation | `ui/quotation.ui.spec.ts` | 9 |
| Happy Path E2E | `e2e/happy-path.spec.ts` | 4 |
| Reject Work | `e2e/reject-work.spec.ts` | 6 |
| Termination | `e2e/termination.spec.ts` | 6 |
| **Total** | | **78** |
