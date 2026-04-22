/**
 * QA FINDINGS
 *
 * These tests document defects found in the current implementation.
 * They are EXPECTED TO FAIL. Each failure is a reported bug.
 *
 * Do NOT fix the implementation to make these pass — the failures
 * are the deliverable. They represent issues the dev team must address.
 */
import { test, expect } from '@playwright/test';
import { buildQuotationPayload, VALID_CARD, futureDate } from '../fixtures/testData';
import { createAcceptAndPay, createAndAcceptQuotation } from '../utils/apiHelper';
import { QuotationPage } from '../pages/QuotationPage';
import { PaymentPage } from '../pages/PaymentPage';

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-001: No sequential milestone enforcement
//
// Expected: Seller cannot submit round N until round N-1 is accepted/transferred.
//           This mirrors how real project contracts work — phase 2 cannot start
//           before phase 1 is signed off.
// Actual:   The API accepts a submit for any round regardless of whether
//           previous rounds are complete. Round 2 can be submitted while
//           round 1 is still pending.
// Severity: High — sellers can skip or reorder milestone delivery.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-001 — No sequential milestone enforcement', () => {

  test('[FAIL] cannot submit round 2 before round 1 is accepted', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 3);

    // Attempt to submit round 2 while round 1 is still pending
    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/2/submit`);

    // Expected: 409 — previous round not yet accepted
    // Actual:   200 — round 2 is accepted regardless of round 1 state
    expect(res.status()).toBe(409);
  });

  test('[FAIL] cannot submit round 3 while round 2 is only submitted (not accepted)', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 3);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/submit`);
    // Round 2 is submitted but not yet accepted — round 3 should be blocked

    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/3/submit`);

    // Expected: 409 — round 2 must be accepted first
    // Actual:   200 — round 3 is accepted immediately
    expect(res.status()).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-002: Terminate allowed on draft and rejected quotations
//
// Expected: Termination should only apply to active contracts (paid / in_progress).
//           A draft quotation has never been agreed to; a rejected quotation is
//           already dead. Terminating either makes no business sense.
// Actual:   The terminate endpoint returns 200 for any non-completed,
//           non-terminated status, including draft and rejected.
// Severity: Medium — misleading API behaviour; creates ghost "terminated" records.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-002 — Terminate allowed on draft and rejected quotations', () => {

  test('[FAIL] cannot terminate a draft quotation (not yet accepted)', async ({ request }) => {
    const payload = buildQuotationPayload(2);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    const res = await request.post(`/api/v1/quotations/${quotation_id}/terminate`);

    // Expected: 409 — contract was never active
    // Actual:   200 — draft quotation is terminated
    expect(res.status()).toBe(409);
  });

  test('[FAIL] cannot terminate a rejected quotation (already dead)', async ({ request }) => {
    const payload = buildQuotationPayload(2);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();
    await request.post(`/api/v1/quotations/${quotation_id}/reject`, { data: { reason: 'Too expensive' } });

    const res = await request.post(`/api/v1/quotations/${quotation_id}/terminate`);

    // Expected: 409 — nothing to terminate
    // Actual:   200 — rejected quotation is terminated
    expect(res.status()).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-003: Payment amount not validated against quotation total
//
// Expected: The payment amount must equal the quotation's total_amount.
//           Paying less underpays the contract; paying more overcharges the buyer.
// Actual:   Any amount between 0.01 and 1,000,000 is accepted regardless of
//           whether it matches the quotation total.
// Severity: Critical — financial discrepancy between charged amount and contract value.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-003 — Payment amount not validated against quotation total', () => {

  test('[FAIL] cannot pay less than the quotation total amount', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request, 2);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount - 1,   // 1 THB less than required
        currency: 'THB',
      },
    });

    // Expected: 400/422 — amount does not match quotation total
    // Actual:   200 — payment succeeds with wrong amount
    expect(res.status()).toBe(400);
  });

  test('[FAIL] cannot pay more than the quotation total amount', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request, 2);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount + 500,  // 500 THB more than required
        currency: 'THB',
      },
    });

    // Expected: 400/422 — amount does not match quotation total
    // Actual:   200 — overpayment accepted silently
    expect(res.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-004: Empty card holder name silently replaced with 'CARD HOLDER'
//
// Expected: Submitting the payment form with an empty card holder name should
//           be blocked with an inline validation error, the same as card number
//           and expiry which already show inline errors.
// Actual:   The UI silently substitutes the empty field with the literal string
//           'CARD HOLDER' before calling the API. The server never sees an empty
//           value, the payment succeeds under a fake name, and no error is shown.
//           Root cause (mock-ui/index.html line ~519):
//             credit_card_owner_name: $('card-holder').value.trim() || 'CARD HOLDER'
// Severity: Medium — silent data substitution bypasses all name validation;
//           card is charged under a name the user never entered.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-004 — No inline validation for empty card holder name', () => {

  test('[FAIL] shows inline field error when card holder name is empty', async ({ page }) => {
    const q = new QuotationPage(page);
    const payment = new PaymentPage(page);

    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await payment.acceptQuotation();

    // Fill card details but leave card holder name empty
    await page.waitForSelector('[data-testid="card-number"]', { state: 'visible' });
    await page.fill('[data-testid="card-number"]', VALID_CARD.number);
    await page.fill('[data-testid="card-expiry"]', VALID_CARD.expiry);
    await page.fill('[data-testid="card-cvv"]', VALID_CARD.cvv);
    // Intentionally skip card-holder

    await payment.pay();

    // Expected: inline error visible next to card holder field
    // Actual:   payment succeeds silently with 'CARD HOLDER' as the name
    await expect(page.locator('#card-holder-error')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-005: credit_card_owner_name max 100 characters not enforced
//
// Expected: Per API requirement — "The credit card owner's name should not be
//           empty and should not exceed 100 characters." Sending a name longer
//           than 100 characters should return 400.
// Actual:   The server has no length check on credit_card_owner_name. Any
//           length is accepted and the payment succeeds.
// Severity: Medium — requirement violation; excessively long names can cause
//           downstream truncation or storage issues in real payment gateways.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-005 — credit_card_owner_name max 100 characters not enforced', () => {

  test('[FAIL] rejects credit_card_owner_name exceeding 100 characters', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request, 2);

    const longName = 'A'.repeat(101); // 101 characters — exceeds the 100-char requirement

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: longName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount,
        currency: 'THB',
      },
    });

    // Expected: 400 — name exceeds 100-character limit
    // Actual:   200 — oversized name accepted silently
    expect(res.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINDING-006: CVV validation allows non-numeric characters
//
// Expected: CVV should accept digits only (0-9). Non-numeric input should
//           show an inline validation error.
// Actual:   The UI input has no validation for non-numeric characters.
//           Users can type letters and special characters (e.g., 'abc1')
//           and the form allows submission. The API will reject it, but
//           the UI should catch this first.
// Severity: Low → Medium — UI should prevent non-numeric input or show error
// ─────────────────────────────────────────────────────────────────────────────
test.describe('FINDING-006 — CVV input accepts non-numeric characters', () => {

  test('[FAIL] shows inline error when CVV contains non-numeric characters', async ({ page }) => {
    const q = new QuotationPage(page);
    const payment = new PaymentPage(page);

    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await payment.acceptQuotation();

    // Fill card details with non-numeric CVV
    await page.waitForSelector('[data-testid="card-number"]', { state: 'visible' });
    await page.fill('[data-testid="card-number"]', VALID_CARD.number);
    await page.fill('[data-testid="card-expiry"]', VALID_CARD.expiry);
    await page.fill('[data-testid="card-cvv"]', 'abc1');  // Non-numeric CVV

    await payment.pay();

    // Expected: inline error visible next to CVV field
    // Actual:   form may submit or allow submission without error
    await expect(page.locator('#card-cvv-error')).toBeVisible();
  });
});
