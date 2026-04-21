import { test, expect } from '@playwright/test';
import { createAndAcceptQuotation } from '../../utils/apiHelper';
import { VALID_CARD } from '../../fixtures/testData';

const payPayload = (quotationId: string, totalAmount: number) => ({
  quotation_id: quotationId,
  credit_card_number: VALID_CARD.number,
  credit_card_owner_name: VALID_CARD.ownerName,
  expiration_date: VALID_CARD.expiry,
  cvv: VALID_CARD.cvv,
  amount: totalAmount,
  currency: 'THB',
});

test.describe('API — Service window 23:55–00:15 (Task 13)', () => {

  test('payment is blocked at 23:55 (start of window)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '23:55' },
    });
    expect(res.status()).toBe(503);
    expect((await res.json()).error).toContain('maintenance window');
  });

  test('payment is blocked at 23:59 (mid-window)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '23:59' },
    });
    expect(res.status()).toBe(503);
  });

  test('payment is blocked at 00:00 (midnight)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '00:00' },
    });
    expect(res.status()).toBe(503);
  });

  test('payment is blocked at 00:15 (end of window)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '00:15' },
    });
    expect(res.status()).toBe(503);
  });

  test('payment succeeds at 00:16 (just after window)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '00:16' },
    });
    expect(res.status()).toBe(200);
  });

  test('payment succeeds at 23:54 (just before window)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '23:54' },
    });
    expect(res.status()).toBe(200);
  });

  test('payment succeeds at 12:00 (normal business hours)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: payPayload(quotationId, totalAmount),
      headers: { 'x-simulated-time': '12:00' },
    });
    expect(res.status()).toBe(200);
  });
});
