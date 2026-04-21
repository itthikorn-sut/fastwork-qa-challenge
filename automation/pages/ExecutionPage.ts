import { Page } from '@playwright/test';

export class ExecutionPage {
  constructor(private page: Page) {}

  async submitWork(round: number) {
    await this.page.click(`[data-testid="submit-work-${round}"]`);
    await this.page.waitForSelector(`[data-testid="exec-status-${round}"][data-status="submitted"]`);
  }

  async acceptWork(round: number) {
    await this.page.click(`[data-testid="accept-work-${round}"]`);
    await this.page.waitForSelector(`[data-testid="exec-status-${round}"][data-status="transferred"]`);
  }

  async rejectWork(round: number) {
    await this.page.click(`[data-testid="reject-work-${round}"]`);
    await this.page.waitForSelector(`[data-testid="exec-status-${round}"][data-status="pending"]`);
  }

  rejectBtn(round: number) {
    return this.page.locator(`[data-testid="reject-work-${round}"]`);
  }

  milestoneStatus(round: number) {
    return this.page.locator(`[data-testid="exec-status-${round}"]`);
  }

  milestoneStatusIs(round: number, status: string) {
    return this.page.locator(`[data-testid="exec-status-${round}"][data-status="${status}"]`);
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
