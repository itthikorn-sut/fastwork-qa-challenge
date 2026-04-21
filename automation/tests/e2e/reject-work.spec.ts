import { test, expect } from '@playwright/test';
import { createAcceptAndPay } from '../../utils/apiHelper';
import { QuotationPage } from '../../pages/QuotationPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { ExecutionPage } from '../../pages/ExecutionPage';
import { VALID_CARD, futureDate } from '../../fixtures/testData';

test.describe('Reject-work flow (Task 15)', () => {

  // ── API tests ──────────────────────────────────────────────────────────────

  test('API: buyer can reject submitted work — milestone returns to pending', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 2);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);

    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/reject`, {
      data: { reason: 'Does not meet requirements' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('rejected');
    expect(body.reason).toBe('Does not meet requirements');
  });

  test('API: milestone status is pending after rejection (can resubmit)', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 2);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/reject`, {
      data: { reason: 'Needs revision' },
    });

    // Resubmit after rejection — should succeed
    const resubmit = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    expect(resubmit.status()).toBe(200);
    expect((await resubmit.json()).status).toBe('submitted');
  });

  test('API: cannot reject work that is not yet submitted (409)', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 2);

    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/reject`);
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toContain('submitted');
  });

  test('API: cannot reject work that is already accepted (409)', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 2);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);

    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/reject`);
    expect(res.status()).toBe(409);
  });

  // ── UI tests ───────────────────────────────────────────────────────────────

  test('UI: reject work resets milestone status to pending and re-enables submit', async ({ page }) => {
    const q = new QuotationPage(page);
    const payment = new PaymentPage(page);
    const execution = new ExecutionPage(page);

    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await payment.acceptQuotation();
    await payment.fillPayment(VALID_CARD);
    await payment.pay();

    await page.waitForSelector('[data-testid="exec-row-1"]', { timeout: 5000 });

    // Submit round 1
    await execution.submitWork(1);
    await expect(execution.milestoneStatus(1)).toHaveAttribute('data-status', 'submitted');

    // Reject round 1
    await execution.rejectWork(1);
    await expect(execution.milestoneStatus(1)).toHaveAttribute('data-status', 'pending');

    // Submit button should be enabled again, reject disabled
    await expect(page.locator('[data-testid="submit-work-1"]')).toBeEnabled();
    await expect(execution.rejectBtn(1)).toBeDisabled();
  });

  test('UI: after rejection, seller can resubmit and buyer can accept', async ({ page }) => {
    const q = new QuotationPage(page);
    const payment = new PaymentPage(page);
    const execution = new ExecutionPage(page);

    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await payment.acceptQuotation();
    await payment.fillPayment(VALID_CARD);
    await payment.pay();

    await page.waitForSelector('[data-testid="exec-row-1"]', { timeout: 5000 });

    await execution.submitWork(1);
    await execution.rejectWork(1);
    await expect(execution.milestoneStatus(1)).toHaveAttribute('data-status', 'pending');

    // Resubmit and accept — should reach transferred
    await execution.submitWork(1);
    await expect(execution.milestoneStatus(1)).toHaveAttribute('data-status', 'submitted');
    await execution.acceptWork(1);
    await expect(execution.milestoneStatus(1)).toHaveAttribute('data-status', 'transferred');
  });
});
