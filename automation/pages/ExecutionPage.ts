import { Page } from '@playwright/test';

export class ExecutionPage {
  constructor(private page: Page) {}

  async submitWork(round: number) {
    await this.page.click(`[data-testid="submit-work-${round}"]`);
    await this.page.waitForFunction(
      (r) => document.getElementById(`exec-status-${r}`)?.textContent === 'submitted',
      round,
    );
  }

  async acceptWork(round: number) {
    await this.page.click(`[data-testid="accept-work-${round}"]`);
    await this.page.waitForFunction(
      (r) => document.getElementById(`exec-status-${r}`)?.textContent === 'transferred',
      round,
    );
  }

  milestoneStatus(round: number) {
    return this.page.locator(`[data-testid="exec-status-${round}"]`);
  }

  async terminate() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.click('[data-testid="terminate-btn"]');
  }

  errorAlert() {
    return this.page.locator('#exec-error');
  }

  terminateBtn() {
    return this.page.locator('[data-testid="terminate-btn"]');
  }
}
