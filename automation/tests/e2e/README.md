# E2E Test Cases

All end-to-end test cases covering the Milestone Quotation and Payment flow.

## TC-E2E-001 to TC-E2E-004: Happy Path Flow (`happy-path.spec.ts`)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-E2E-001 | Seller creates valid 3-round quotation | 1. Navigate to form<br>2. Fill milestones 1-3 (title, desc, deliverables, date, amount)<br>3. Click ส่งใบเสนอราคา | Step 2 activates; review table shows 3 rows |
| TC-E2E-002 | Full flow: create → accept → pay → execute all rounds → verify transferred | 1. Create 3-round quotation<br>2. Accept quotation<br>3. Fill payment (card, expiry, CVV, owner name)<br>4. Pay<br>5. Submit work each round<br>6. Accept each round | Each milestone transitions pending→submitted→transferred; terminate button visible |
| TC-E2E-003 | UI shows masked card number in payment success | 1. Create & accept 2-round quotation<br>2. Pay with card 4111111111111111 | Success banner shows `****-****-****-1111` |
| TC-E2E-004 | Step indicator progresses correctly through all 4 steps | 1. Load page → step 1 active<br>2. Submit quotation → step 1 done, step 2 active<br>3. Accept → step 2 done, step 3 active<br>4. Pay → step 4 active | Each step activates and marks done in correct sequence |

---

## TC-E2E-005 to TC-E2E-010: Termination Scenario (`termination.spec.ts`)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TC-E2E-005 | API: terminate after round 1 — correct completed/remaining counts | 1. Create 3-round quotation & pay<br>2. Submit + accept round 1<br>3. POST /terminate | 200; `completed_rounds=1`, `remaining_rounds=2`, `status=terminated` |
| TC-E2E-006 | API: cannot terminate an already-terminated quotation | 1. Create & pay quotation<br>2. Terminate once<br>3. Terminate again | 409; error contains "terminated" |
| TC-E2E-007 | API: after termination, submitting work returns error | 1. Create & pay quotation<br>2. Terminate<br>3. Submit milestone work | 409 conflict |
| TC-E2E-008 | API: quotation state is "terminated" after terminate call | 1. Create & pay quotation<br>2. POST /terminate<br>3. GET /quotations/:id | `status = "terminated"` |
| TC-E2E-009 | UI: terminate button disables all action buttons | 1. Create 2-round quotation<br>2. Accept & pay<br>3. Click ยุติสัญญา | Terminate button disabled; all submit-work buttons disabled |
| TC-E2E-010 | UI: termination shows info message with round counts | 1. Create 2-round quotation<br>2. Accept, pay<br>3. Terminate | Alert visible containing "ยุติ" |

---

## Test Data Used

| Field | Value |
|-------|-------|
| Valid card | `4111111111111111` / `12/28` / `123` / `TEST USER` |
| Declined card | `4111111100000000` / `12/28` / `123` |
| Gateway error card | `9999999999999999` |
| Default seller | `SELLER-TEST` |
| Default buyer | `BUYER-TEST` |
| Milestone amount (default) | 1600 THB/round |
| Minimum total | > 3000 THB |

---

## Coverage Summary

| Category | Tests | Pass Rate |
|----------|-------|-----------|
| Happy path E2E | 4 | 4/4 ✅ |
| Termination | 6 | 6/6 ✅ |
| **Total E2E** | **10** | **10/10 ✅** |
