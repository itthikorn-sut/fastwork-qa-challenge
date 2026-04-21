export const VALID_CARD = { number: '4111111111111111', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' };
export const DECLINED_CARD = { number: '4111111100000000', expiry: '12/28', cvv: '123', ownerName: 'TEST USER' };
export const INVALID_CARD = { number: '1234', expiry: '13/99', cvv: '1', ownerName: '' };

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
