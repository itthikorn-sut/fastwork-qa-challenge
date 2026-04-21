import { test, expect } from '@playwright/test';
import { QuotationPage } from '../../pages/QuotationPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { ExecutionPage } from '../../pages/ExecutionPage';
import { VALID_CARD, futureDate } from '../../fixtures/testData';

const TWO_MILESTONES = [
  { title: 'Phase 1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 },
  { title: 'Phase 2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 },
];

async function setupThroughPayment(page: any) {
  const q = new QuotationPage(page);
  const payment = new PaymentPage(page);
  await q.goto();
  await q.fillMilestone(1, TWO_MILESTONES[0]);
  await q.fillMilestone(2, TWO_MILESTONES[1]);
  await q.submitQuotation();
  await payment.acceptQuotation();
  await payment.fillPayment(VALID_CARD);
  await payment.pay();
  await page.waitForSelector('[data-testid="exec-row-1"]', { timeout: 5000 });
  return { q, payment, execution: new ExecutionPage(page) };
}

test.describe('UI — Contract completion flow (Task 17)', () => {

  test('completed screen appears after all milestones are transferred', async ({ page }) => {
    const { execution } = await setupThroughPayment(page);

    await execution.submitWork(1);
    await execution.acceptWork(1);
    await execution.submitWork(2);
    await execution.acceptWork(2);

    await expect(page.locator('[data-testid="section-completed"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="completed-summary"]')).toHaveAttribute('data-milestone-count', '2');
  });

  test('completed screen does not appear until all milestones transferred', async ({ page }) => {
    const { execution } = await setupThroughPayment(page);

    await execution.submitWork(1);
    await execution.acceptWork(1);

    // Only 1 of 2 milestones done — should NOT show completed
    await expect(page.locator('[data-testid="section-completed"]')).not.toBeVisible();
  });
});

test.describe('UI — Buyer rejects quotation (Task 16)', () => {

  test('reject button is visible in review screen', async ({ page }) => {
    const q = new QuotationPage(page);
    await q.goto();
    await q.fillMilestone(1, TWO_MILESTONES[0]);
    await q.fillMilestone(2, TWO_MILESTONES[1]);
    await q.submitQuotation();

    await expect(page.locator('[data-testid="reject-quotation-btn"]')).toBeVisible();
  });

  test('rejected screen shown after buyer declines quotation', async ({ page }) => {
    const q = new QuotationPage(page);
    await q.goto();
    await q.fillMilestone(1, TWO_MILESTONES[0]);
    await q.fillMilestone(2, TWO_MILESTONES[1]);
    await q.submitQuotation();

    // Intercept the prompt dialog
    page.once('dialog', dialog => dialog.accept('ราคาสูงเกินไป'));
    await page.click('[data-testid="reject-quotation-btn"]');

    await expect(page.locator('#section-rejected')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#rejection-reason-display')).toContainText('ราคาสูงเกินไป');
  });
});
