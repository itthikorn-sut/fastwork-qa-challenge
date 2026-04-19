import { test, expect } from '@playwright/test';
import { QuotationPage } from '../../pages/QuotationPage';
import { futureDate, pastDate } from '../../fixtures/testData';

const VALID = {
  title: 'Phase 1', description: 'Do the work', deliverables: 'Stuff', amount: 1100,
};

test.describe('UI — Quotation form client-side validation (Task 7)', () => {
  let q: QuotationPage;

  test.beforeEach(async ({ page }) => {
    q = new QuotationPage(page);
    await q.goto();
  });

  test('shows error when submitting with empty required fields', async ({ page }) => {
    // Page loads with 2 empty rounds — submit without filling anything
    await q.submitQuotation();
    await expect(q.errorAlert()).toBeVisible();
  });

  test('shows error when amount is exactly 100 THB', async ({ page }) => {
    await q.fillMilestone(1, { ...VALID, dueDate: futureDate(30), amount: 100 });
    await q.fillMilestone(2, { ...VALID, title: 'Phase 2', dueDate: futureDate(60), amount: 1100 });
    await q.submitQuotation();
    await expect(q.errorAlert()).toBeVisible();
    await expect(q.errorAlert()).toContainText('100');
  });

  test('shows error when total is exactly 3000 THB', async ({ page }) => {
    await q.fillMilestone(1, { ...VALID, dueDate: futureDate(30), amount: 1000 });
    await q.fillMilestone(2, { ...VALID, title: 'Phase 2', dueDate: futureDate(60), amount: 2000 });
    await q.submitQuotation();
    await expect(q.errorAlert()).toBeVisible();
    await expect(q.errorAlert()).toContainText('3000');
  });

  test('shows error for past due date', async ({ page }) => {
    await q.fillMilestone(1, { ...VALID, dueDate: pastDate(), amount: 1600 });
    await q.fillMilestone(2, { ...VALID, title: 'Phase 2', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await expect(q.errorAlert()).toBeVisible();
    await expect(q.errorAlert()).toContainText('future');
  });

  test('add round button is hidden after 5 rounds are added', async ({ page }) => {
    // 2 rounds exist already — add 3 more
    await q.addMilestoneRound();
    await q.addMilestoneRound();
    await q.addMilestoneRound();
    await expect(page.locator('[data-testid="add-round-btn"]')).toBeHidden();
  });

  test('total amount display updates as amounts are entered', async ({ page }) => {
    await q.clearAndFillAmount(1, 1500);
    await q.clearAndFillAmount(2, 2000);

    const totalDisplay = page.locator('#total-amount');
    await expect(totalDisplay).toContainText('3,500');
  });

  test('valid 2-round quotation is accepted and moves to step 2', async ({ page }) => {
    await q.fillMilestone(1, { ...VALID, dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { ...VALID, title: 'Phase 2', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();
    await expect(q.step(2)).toHaveClass(/active/);
    await expect(q.errorAlert()).not.toBeVisible();
  });
});

test.describe('UI — Payment form client-side validation', () => {

  test('shows inline error for invalid card number', async ({ page }) => {
    const q = new QuotationPage(page);
    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();

    await page.click('[data-testid="accept-btn"]');

    await page.fill('[data-testid="card-number"]', '1234');
    await page.fill('[data-testid="card-expiry"]', '12/28');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="pay-btn"]');

    await expect(page.locator('#card-number-error')).toBeVisible();
  });

  test('shows inline error for invalid expiry format', async ({ page }) => {
    const q = new QuotationPage(page);
    await q.goto();
    await q.fillMilestone(1, { title: 'P1', description: 'D', deliverables: 'Del', dueDate: futureDate(30), amount: 1600 });
    await q.fillMilestone(2, { title: 'P2', description: 'D', deliverables: 'Del', dueDate: futureDate(60), amount: 1600 });
    await q.submitQuotation();

    await page.click('[data-testid="accept-btn"]');

    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '13/99');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="pay-btn"]');

    await expect(page.locator('#card-expiry-error')).toBeVisible();
  });
});
