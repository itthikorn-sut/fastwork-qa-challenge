import { test, expect } from '@playwright/test';
import { createAcceptAndPay } from '../../utils/apiHelper';
import { QuotationPage } from '../../pages/QuotationPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { ExecutionPage } from '../../pages/ExecutionPage';
import { VALID_CARD, futureDate } from '../../fixtures/testData';

test.describe('Termination scenario (Task 12)', () => {

  test('API: terminate after round 1 — correct completed/remaining counts', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 3);

    // Complete round 1
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);

    // Terminate at round 2
    const res = await request.post(`/api/v1/quotations/${quotationId}/terminate`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('terminated');
    expect(body.completed_rounds).toBe(1);
    expect(body.remaining_rounds).toBe(2);
  });

  test('API: cannot terminate an already terminated quotation', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 2);
    await request.post(`/api/v1/quotations/${quotationId}/terminate`);

    const retry = await request.post(`/api/v1/quotations/${quotationId}/terminate`);
    expect(retry.status()).toBe(409);
    expect((await retry.json()).error).toContain('terminated');
  });

  test('API: after termination, submitting work returns error', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 3);
    await request.post(`/api/v1/quotations/${quotationId}/terminate`);

    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    expect(res.status()).toBe(409);
  });

  test('API: quotation state is "terminated" after terminate call', async ({ request }) => {
    const { quotationId } = await createAcceptAndPay(request, 3);
    await request.post(`/api/v1/quotations/${quotationId}/terminate`);

    const state = await (await request.get(`/api/v1/quotations/${quotationId}`)).json();
    expect(state.status).toBe('terminated');
  });

  test('UI: terminate button disables all action buttons', async ({ page }) => {
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

    // Wait for execution section
    await page.waitForSelector('[data-testid="exec-row-1"]', { timeout: 5000 });

    await execution.terminate();

    // All submit/accept buttons should be disabled
    await expect(execution.terminateBtn()).toBeDisabled();
    await expect(page.locator('[data-testid="submit-work-1"]')).toBeDisabled();
    await expect(page.locator('[data-testid="submit-work-2"]')).toBeDisabled();
  });

  test('UI: termination shows info message with round counts', async ({ page }) => {
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
    await execution.terminate();

    await expect(execution.errorAlert()).toBeVisible();
    await expect(execution.errorAlert()).toContainText('ยุติ');
  });
});
