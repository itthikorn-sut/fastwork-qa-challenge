// ── Omise success test cards ──────────────────────────────────────────────────
export const VALID_CARD          = { number: '4242424242424242', expiry: '12/28', cvv: '123',  ownerName: 'TEST USER' }; // Visa
export const VALID_CARD_MC       = { number: '5555555555554444', expiry: '12/28', cvv: '123',  ownerName: 'TEST USER' }; // Mastercard
export const VALID_CARD_MC_ALT   = { number: '5454545454545454', expiry: '12/28', cvv: '123',  ownerName: 'TEST USER' }; // Mastercard alt
export const VALID_CARD_JCB      = { number: '3530111333300000', expiry: '12/28', cvv: '123',  ownerName: 'TEST USER' }; // JCB
export const VALID_CARD_AMEX     = { number: '378282246310005',  expiry: '12/28', cvv: '1234', ownerName: 'TEST USER' }; // Amex (15 digits)
export const VALID_CARD_UNIONPAY = { number: '6250947000000006', expiry: '12/28', cvv: '123',  ownerName: 'TEST USER' }; // UnionPay

// ── Omise decline test cards (by failure_code) ────────────────────────────────
export const CARD_INSUFFICIENT_FUND    = { number: '4111111111140011', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_STOLEN_OR_LOST       = { number: '4111111111130012', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_FAILED_PROCESSING    = { number: '4111111111120013', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_PAYMENT_REJECTED     = { number: '4111111111110014', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_FAILED_FRAUD_CHECK   = { number: '4111111111190016', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_INVALID_ACCOUNT      = { number: '4111111111180017', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa

// ── Omise 3DS failure test cards ──────────────────────────────────────────────
export const CARD_3DS_ENROLLMENT_FAIL  = { number: '4111111111150002', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa
export const CARD_3DS_VALIDATION_FAIL  = { number: '4111111111140003', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' }; // Visa

// ── Backward-compat aliases ───────────────────────────────────────────────────
export const DECLINED_CARD = CARD_INSUFFICIENT_FUND;
export const INVALID_CARD  = { number: '1234', expiry: '13/99', cvv: '1', ownerName: '' };

export const BASE_URL = 'http://localhost:3000';

export interface MilestoneInput {
  title: string;
  description: string;
  deliverables: string;
  due_date: string;
  amount: number;
}

export function buildMilestones(count: number, amountPerRound = 1600): MilestoneInput[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i + 1) * 30);
    return {
      title: `Milestone Round ${i + 1}`,
      description: `Work to be completed in round ${i + 1}`,
      deliverables: `Deliverable ${i + 1}`,
      due_date: date.toISOString().split('T')[0],
      amount: amountPerRound,
    };
  });
}

export function buildQuotationPayload(rounds = 3, amountPerRound = 1600) {
  return {
    seller_id: 'SELLER-TEST',
    buyer_id: 'BUYER-TEST',
    milestones: buildMilestones(rounds, amountPerRound),
  };
}

export function pastDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

export function futureDate(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
