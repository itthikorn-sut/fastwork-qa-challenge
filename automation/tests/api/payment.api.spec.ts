import { test, expect } from '@playwright/test';
import { VALID_CARD, DECLINED_CARD, buildQuotationPayload } from '../../fixtures/testData';
import { createAndAcceptQuotation } from '../../utils/apiHelper';

const validPayload = (quotationId: string, totalAmount: number, overrides = {}) => ({
  quotation_id: quotationId,
  credit_card_number: VALID_CARD.number,
  credit_card_owner_name: VALID_CARD.ownerName,
  expiration_date: VALID_CARD.expiry,
  cvv: VALID_CARD.cvv,
  amount: totalAmount,
  currency: 'THB',
  ...overrides,
});

test.describe('API — Payment failure scenarios (Task 6)', () => {

  test('rejects missing required fields', async ({ request }) => {
    const res = await request.post('/api/v1/payments', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.fields).toContain('credit_card_number');
    expect(body.fields).toContain('credit_card_owner_name');
    expect(body.fields).toContain('expiration_date');
    expect(body.fields).toContain('amount');
    expect(body.fields).toContain('currency');
  });

  test('rejects missing credit_card_owner_name', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { credit_card_owner_name: '' }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).fields).toContain('credit_card_owner_name');
  });

  test('rejects invalid card number (too short)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { credit_card_number: '1234' }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('16 digits');
  });

  test('rejects invalid card number (non-numeric)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { credit_card_number: 'abcd-efgh-ijkl-mnop' }),
    });
    expect(res.status()).toBe(400);
  });

  test('rejects invalid expiration_date format', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { expiration_date: '13/99' }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('MM/YY');
  });

  test('rejects invalid CVV (too short)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { cvv: '12' }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('CVV');
  });

  test('returns 402 for insufficient funds (Omise declined card)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { credit_card_number: DECLINED_CARD.number }),
    });
    expect(res.status()).toBe(402);
    const body = await res.json();
    expect(body.failure_code).toBe('insufficient_fund');
  });

  test('returns 402 when amount exceeds 1,000,000', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, 1_000_001, {}),
    });
    expect(res.status()).toBe(402);
  });

  test('rejects amount below 0.01', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, 0, {}),
    });
    expect(res.status()).toBe(400);
  });

  test('rejects unsupported currency (USD not in THB/VND/IDR)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { currency: 'USD' }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('Unsupported currency');
  });

  test('accepts payment in VND currency', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { currency: 'VND' }),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).currency).toBe('VND');
  });

  test('accepts payment in IDR currency', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { currency: 'IDR' }),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).currency).toBe('IDR');
  });

  test('returns 401 for invalid Authorization token', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, {}),
      headers: { Authorization: 'Bearer INVALID_TOKEN' },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toContain('UNAUTHORIZE');
  });

  test('returns 500 for payment gateway failure (simulated card)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { credit_card_number: '9999999999999999' }),
    });
    expect(res.status()).toBe(500);
    expect((await res.json()).error).toContain('INTERNAL_SERVER_ERROR');
  });

  test('rejects payment on non-accepted quotation', async ({ request }) => {
    const { data } = await (async () => {
      const payload = buildQuotationPayload(3);
      const res = await request.post('/api/v1/quotations', { data: payload });
      return { data: await res.json() };
    })();
    const res = await request.post('/api/v1/payments', {
      data: validPayload(data.quotation_id, data.total_amount, {}),
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toContain('accepted');
  });

  test('successful payment returns correct shape', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, {}),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.payment_id).toMatch(/^PAY-/);
    expect(body.status).toBe('SUCCESS');
    expect(body.amount).toBe(totalAmount);
    expect(body.currency).toBe('THB');
    expect(body.masked_card).toMatch(/^\*{4}-\*{4}-\*{4}-\d{4}$/);
  });
});

test.describe('API — Idempotency (Task 8)', () => {

  test('same idempotency_key returns identical response without double charge', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const key = `idem-${Date.now()}-${Math.random()}`;
    const payload = validPayload(quotationId, totalAmount, { idempotency_key: key });

    const res1 = await request.post('/api/v1/payments', { data: payload });
    const body1 = await res1.json();
    expect(res1.status()).toBe(200);

    const res2 = await request.post('/api/v1/payments', { data: payload });
    const body2 = await res2.json();
    expect(res2.status()).toBe(200);

    expect(body2.payment_id).toBe(body1.payment_id);
    expect(body2.paid_at).toBe(body1.paid_at);
  });

  test('different idempotency_key after first payment returns 409', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { idempotency_key: `key-a-${Date.now()}` }),
    });

    const res2 = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, { idempotency_key: `key-b-${Date.now()}` }),
    });
    expect(res2.status()).toBe(409);
  });
});

test.describe('API — Concurrency (Task 9)', () => {

  test('concurrent duplicate requests with same idempotency_key return consistent result', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const key = `concurrent-${Date.now()}`;
    const payload = validPayload(quotationId, totalAmount, { idempotency_key: key });

    const results = await Promise.all(
      Array.from({ length: 5 }, () => request.post('/api/v1/payments', { data: payload })),
    );

    const bodies = await Promise.all(results.map(r => r.json()));
    const statuses = results.map(r => r.status());

    expect(statuses.every(s => s === 200)).toBe(true);
    const paymentIds = new Set(bodies.map(b => b.payment_id));
    expect(paymentIds.size).toBe(1);
  });
});

test.describe('API — Data consistency (Task 11)', () => {

  test('charged amount matches requested amount exactly', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request, 3, 1100);
    const res = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, {}),
    });
    const body = await res.json();
    expect(body.amount).toBe(totalAmount);
  });

  test('quotation state is "paid" after successful payment', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    await request.post('/api/v1/payments', { data: validPayload(quotationId, totalAmount, {}) });

    const stateRes = await request.get(`/api/v1/quotations/${quotationId}`);
    const state = await stateRes.json();
    expect(stateRes.status()).toBe(200);
    expect(state.status).toBe('paid');
    expect(state.paid_at).toBeTruthy();
  });
});

test.describe('API — Partial failure simulation (Task 10)', () => {

  test('payment success does not leave quotation in accepted state', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    const payRes = await request.post('/api/v1/payments', {
      data: validPayload(quotationId, totalAmount, {}),
    });
    expect(payRes.status()).toBe(200);

    const state = await (await request.get(`/api/v1/quotations/${quotationId}`)).json();
    expect(state.status).not.toBe('accepted');
    expect(state.status).toBe('paid');
  });

  test('payment on already-paid quotation is rejected', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    await request.post('/api/v1/payments', { data: validPayload(quotationId, totalAmount, {}) });
    const retry = await request.post('/api/v1/payments', { data: validPayload(quotationId, totalAmount, {}) });
    expect(retry.status()).toBe(409);
  });
});

