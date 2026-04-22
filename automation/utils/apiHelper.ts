import { APIRequestContext } from '@playwright/test';
import { buildQuotationPayload, VALID_CARD } from '../fixtures/testData';

// Default headers to bypass maintenance window (23:55–00:15)
const BYPASS_WINDOW = { 'x-simulated-time': '12:00' };

export async function createQuotation(request: APIRequestContext, overrides?: object) {
  const payload = overrides ?? buildQuotationPayload();
  const res = await request.post('/api/v1/quotations', { data: payload, headers: BYPASS_WINDOW });
  return { res, data: await res.json() };
}

export async function createAndAcceptQuotation(
  request: APIRequestContext,
  rounds = 3,
  amountPerRound = 1600,
): Promise<{ quotationId: string; totalAmount: number }> {
  const { data } = await createQuotation(request, buildQuotationPayload(rounds, amountPerRound));
  await request.post(`/api/v1/quotations/${data.quotation_id}/accept`);
  return { quotationId: data.quotation_id, totalAmount: data.total_amount };
}

export async function createAcceptAndPay(
  request: APIRequestContext,
  rounds = 3,
  amountPerRound = 1600,
): Promise<{ quotationId: string; totalAmount: number; paymentId: string }> {
  const { quotationId, totalAmount } = await createAndAcceptQuotation(request, rounds, amountPerRound);
  const payRes = await request.post('/api/v1/payments', {
    data: {
      quotation_id: quotationId,
      credit_card_number: VALID_CARD.number,
      credit_card_owner_name: VALID_CARD.ownerName,
      expiration_date: VALID_CARD.expiry,
      cvv: VALID_CARD.cvv,
      amount: totalAmount,
      currency: 'THB',
      idempotency_key: `setup-${quotationId}`,
    },
    headers: BYPASS_WINDOW,
  });
  const payData = await payRes.json();
  return { quotationId, totalAmount, paymentId: payData.payment_id };
}
