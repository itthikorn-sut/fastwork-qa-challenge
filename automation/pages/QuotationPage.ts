import { Page } from '@playwright/test';

export interface MilestoneData {
  title: string;
  description: string;
  deliverables: string;
  dueDate: string;
  amount: number;
}

export class QuotationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async fillMilestone(round: number, data: MilestoneData) {
    await this.page.fill(`[data-testid="m${round}-title"]`, data.title);
    await this.page.fill(`[data-testid="m${round}-description"]`, data.description);
    await this.page.fill(`[data-testid="m${round}-deliverables"]`, data.deliverables);
    await this.page.fill(`[data-testid="m${round}-due-date"]`, data.dueDate);
    await this.page.fill(`[data-testid="m${round}-amount"]`, String(data.amount));
  }

  async addMilestoneRound() {
    await this.page.click('[data-testid="add-round-btn"]');
  }

  async submitQuotation() {
    await this.page.click('[data-testid="submit-quotation-btn"]');
  }

  async clearAndFillAmount(round: number, amount: number) {
    const input = this.page.locator(`[data-testid="m${round}-amount"]`);
    await input.clear();
    await input.fill(String(amount));
  }

  errorAlert() {
    return this.page.locator('#create-error');
  }

  step(n: number) {
    return this.page.locator(`#step-${n}`);
  }
}
