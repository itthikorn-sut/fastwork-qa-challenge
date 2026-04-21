# Obstacles, Problems, and Solutions

---

## 1. Incomplete workflow mapping caused missing features

**Obstacle:** After the initial implementation was complete and tests were passing, a systematic review revealed two entire workflow branches that had never been implemented: the buyer declining a quotation (reject-quotation) and the contract reaching a completed state after all milestones are transferred. The mock server had no `POST /api/v1/quotations/:id/reject` endpoint, no `rejected` status in the state machine, and the UI had no screen for either the rejected or completed state. Tests for these paths did not exist at all.

**Root cause:** Development started from the happy path and moved outward to error cases. Without first drawing the complete state machine — all statuses a quotation can reach and all transitions between them — it was easy to miss entire branches. The state machine gap also contained a logic bug: the completion check used `round === quotation.milestones.length` (only checks the last round by index) rather than verifying every milestone was accepted, which would incorrectly mark a contract complete even if earlier rounds were skipped.

**Solution:** Drew the full quotation state machine before adding any new code:

```
draft ──accept──▶ accepted ──pay──▶ paid ──submit──▶ in_progress ──all accepted──▶ completed
draft ──reject──▶ rejected
any active state ──terminate──▶ terminated
```

Then implemented the missing path end-to-end: the server endpoint, the UI reject button and `section-rejected` screen, the `section-completed` screen with completion detection, and tests for every new transition. Fixed the completion logic to check all milestones, not just the final round index.

**Takeaway:** Map the full state machine before writing any code. Every status a resource can reach, and every event that causes a transition, should be on paper first. Tests written against an incomplete state machine give false confidence — they prove the happy path works but leave entire branches untested.

---

## 2. Flaky E2E assertions caused by relying on displayed text

**Obstacle:** Status badge assertions using `toHaveText('submitted')` became unreliable because displayed text is the wrong layer to assert on. Text changes with localisation updates and copy revisions.

**Solution:** Added `data-status` attributes to status badges that hold machine-readable values independently of display text. Changed all assertions from `toHaveText(...)` to `toHaveAttribute('data-status', ...)` and replaced `waitForFunction` calls with `waitForSelector('[data-status="submitted"]')`.

**Takeaway:** UI automation should target stable `data-testid` and `data-*` attributes, not visible text. Displayed text is for humans; attributes are for machines.

---

## 3. Test card numbers aligned to Omise — but card brand is outside requirements

**Obstacle:** The initial mock server used invented card numbers (`endsWith('0000')` = declined, `9999999999999999` = gateway error). When reviewing the Fastwork platform context it became clear the real system uses Omise as the payment processor. Omise publishes a documented set of test cards at `docs.omise.co/api-testing`: named cards per brand (Visa, Mastercard, JCB, Amex, UnionPay) and specific failure codes (`insufficient_fund`, `stolen_or_lost_card`, `failed_processing`, `payment_rejected`, `failed_fraud_check`, `invalid_account_number`, plus 3DS enrollment and validation failures).

**Decision:** The mock server's card simulation and `testData.ts` were updated to use real Omise test card numbers so that any engineer running the suite against a real Omise-backed staging environment would get meaningful results. However, multi-brand success tests (Mastercard, JCB, Amex, UnionPay) and brand-specific decline-code tests were **not included in the main test suite** because the API requirements do not specify card brand restrictions — only amount limits, currency, and owner name validation. Adding brand-specific tests would be testing the payment gateway (Omise's job) rather than the application.

**What remains:** The Omise failure card lookup table exists in `mockServer.ts` and the card constants remain in `testData.ts` for reference. If the real system adds card brand restrictions (e.g. "only Visa and Mastercard accepted"), those constants are ready to use. FINDING-005 documents that `credit_card_owner_name` max 100 chars — which IS in the requirements — is not enforced.

**Takeaway:** Know your test boundary. Unit and API tests should verify the application's own rules, not the behaviour of third-party systems. Align test data to the real payment provider for portability, but only write assertions against requirements that are actually specified.
