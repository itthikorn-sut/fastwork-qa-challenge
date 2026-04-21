import { Page } from '@playwright/test';

export interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  ownerName?: string;
}

export class PaymentPage {
  constructor(private page: Page) {}

  async acceptQuotation() {
    await this.page.click('[data-testid="accept-btn"]');
  }

  async fillPayment(card: CardData, currency = 'THB') {
    await this.page.waitForSelector('[data-testid="card-number"]', { state: 'visible', timeout: 5000 });
    await this.page.fill('[data-testid="card-number"]', card.number);
    if (card.ownerName) {
      await this.page.fill('[data-testid="card-holder"]', card.ownerName);
    }
    await this.page.fill('[data-testid="card-expiry"]', card.expiry);
    await this.page.fill('[data-testid="card-cvv"]', card.cvv);
    await this.page.selectOption('[data-testid="currency"]', currency);
  }

  async pay() {
    await this.page.click('[data-testid="pay-btn"]');
  }

  successAlert() {
    return this.page.locator('#payment-success');
  }

  errorAlert() {
    return this.page.locator('#payment-error');
  }

  fieldError(field: 'card-number' | 'card-expiry' | 'card-cvv') {
    return this.page.locator(`#${field}-error`);
  }
}
