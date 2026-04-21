import { test, expect } from '@playwright/test';
import { QuotationPage } from '../../pages/QuotationPage';
import { PaymentPage } from '../../pages/PaymentPage';
import { ExecutionPage } from '../../pages/ExecutionPage';
import { VALID_CARD, futureDate } from '../../fixtures/testData';

const MILESTONES = [
  { title: 'Design Phase',      description: 'UI/UX design mockups',     deliverables: 'Figma files',        dueDate: futureDate(30), amount: 1600 },
  { title: 'Development Phase', description: 'Frontend implementation',  deliverables: 'Source code',        dueDate: futureDate(60), amount: 1700 },
  { title: 'QA & Delivery',     description: 'Testing and final review', deliverables: 'Tested application', dueDate: futureDate(90), amount: 1800 },
];

test.describe('Happy Path E2E — 3-round milestone quotation', () => {
  let quotation: QuotationPage;
  let payment: PaymentPage;
  let execution: ExecutionPage;

  test.beforeEach(async ({ page }) => {
    quotation = new QuotationPage(page);
    payment   = new PaymentPage(page);
    execution = new ExecutionPage(page);
    await quotation.goto();
  });

  test('Step 1: seller creates valid 3-round quotation', async ({ page }) => {
    await quotation.fillMilestone(1, MILESTONES[0]);
    await quotation.fillMilestone(2, MILESTONES[1]);
    await quotation.addMilestoneRound();
    await quotation.fillMilestone(3, MILESTONES[2]);

    await quotation.submitQuotation();

    await expect(quotation.step(2)).toHaveClass(/active/);
    await expect(page.locator('#review-tbody tr')).toHaveCount(3);
  });

  test('Full E2E: create → accept → pay → execute all rounds → verify transferred', async () => {
    // ── Step 1: Create ───────────────────────────────────────────────────
    await quotation.fillMilestone(1, MILESTONES[0]);
    await quotation.fillMilestone(2, MILESTONES[1]);
    await quotation.addMilestoneRound();
    await quotation.fillMilestone(3, MILESTONES[2]);
    await quotation.submitQuotation();

    await expect(quotation.step(2)).toHaveClass(/active/);

    // ── Step 2: Accept ───────────────────────────────────────────────────
    await payment.acceptQuotation();
    await expect(quotation.step(3)).toHaveClass(/active/);

    // ── Step 3: Payment ──────────────────────────────────────────────────
    await payment.fillPayment(VALID_CARD);
    await payment.pay();

    await expect(payment.successAlert()).toBeVisible({ timeout: 5000 });
    await expect(payment.successAlert()).toContainText('PAY-');
    await expect(payment.successAlert()).toContainText('****-****-****-1111');

    // Step 4 loads after 1.5s delay in UI
    await expect(quotation.step(4)).toHaveClass(/active/, { timeout: 5000 });

    // ── Step 4: Execute milestones ───────────────────────────────────────
    for (let round = 1; round <= 3; round++) {
      await expect(execution.milestoneStatus(round)).toHaveAttribute('data-status', 'pending');

      await execution.submitWork(round);
      await expect(execution.milestoneStatus(round)).toHaveAttribute('data-status', 'submitted');

      await execution.acceptWork(round);
      await expect(execution.milestoneStatus(round)).toHaveAttribute('data-status', 'transferred');
    }

    // Terminate button should still be enabled (contract completed naturally)
    await expect(execution.terminateBtn()).toBeVisible();
  });

  test('UI shows masked card number in payment success message', async () => {
    await quotation.fillMilestone(1, MILESTONES[0]);
    await quotation.fillMilestone(2, MILESTONES[1]);
    await quotation.submitQuotation();

    await payment.acceptQuotation();
    await payment.fillPayment(VALID_CARD);
    await payment.pay();

    await expect(payment.successAlert()).toContainText('****-****-****-1111');
  });

  test('Step indicator progresses correctly through all 4 steps', async () => {
    await expect(quotation.step(1)).toHaveClass(/active/);

    await quotation.fillMilestone(1, MILESTONES[0]);
    await quotation.fillMilestone(2, MILESTONES[1]);
    await quotation.submitQuotation();
    await expect(quotation.step(1)).toHaveClass(/done/);
    await expect(quotation.step(2)).toHaveClass(/active/);

    await payment.acceptQuotation();
    await expect(quotation.step(2)).toHaveClass(/done/);
    await expect(quotation.step(3)).toHaveClass(/active/);

    await payment.fillPayment(VALID_CARD);
    await payment.pay();
    await expect(quotation.step(4)).toHaveClass(/active/, { timeout: 5000 });
  });
});
