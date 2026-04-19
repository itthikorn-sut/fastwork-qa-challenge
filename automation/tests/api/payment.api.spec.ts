import { test, expect } from '@playwright/test';
import { VALID_CARD, DECLINED_CARD, buildQuotationPayload } from '../../fixtures/testData';
import { createAndAcceptQuotation } from '../../utils/apiHelper';

test.describe('API — Payment failure scenarios (Task 6)', () => {

  test('rejects missing required fields', async ({ request }) => {
    const res = await request.post('/api/v1/payments', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.fields).toContain('card_number');
    expect(body.fields).toContain('amount');
    expect(body.fields).toContain('currency');
  });

  test('rejects invalid card number (too short)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: '1234',
        card_expiry: '12/28', card_cvv: '123', amount: totalAmount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('16 digits');
  });

  test('rejects invalid card number (non-numeric)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: 'abcd-efgh-ijkl-mnop',
        card_expiry: '12/28', card_cvv: '123', amount: totalAmount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects invalid expiry format', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: '13/99', card_cvv: '123', amount: totalAmount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('MM/YY');
  });

  test('rejects invalid CVV (too short)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: '12/28', card_cvv: '12', amount: totalAmount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('CVV');
  });

  test('returns 402 for insufficient funds (declined card)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: DECLINED_CARD.number,
        card_expiry: DECLINED_CARD.expiry, card_cvv: DECLINED_CARD.cvv,
        amount: totalAmount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(402);
    expect((await res.json()).error).toContain('declined');
  });

  test('returns 402 when amount exceeds 1,000,000', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: 1_000_001, currency: 'THB',
      },
    });
    expect(res.status()).toBe(402);
  });

  test('rejects amount below 0.01', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: 0, currency: 'THB',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects unsupported currency', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'GBP',
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('Unsupported currency');
  });

  test('rejects payment on non-accepted quotation', async ({ request }) => {
    const { data } = await (async () => {
      const payload = buildQuotationPayload(3);
      const res = await request.post('/api/v1/quotations', { data: payload });
      return { data: await res.json() };
    })();
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: data.quotation_id, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: data.total_amount, currency: 'THB',
      },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toContain('accepted');
  });

  test('successful payment returns correct shape', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB',
      },
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
    const payload = {
      quotation_id: quotationId, card_number: VALID_CARD.number,
      card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
      amount: totalAmount, currency: 'THB', idempotency_key: key,
    };

    const res1 = await request.post('/api/v1/payments', { data: payload });
    const body1 = await res1.json();
    expect(res1.status()).toBe(200);

    const res2 = await request.post('/api/v1/payments', { data: payload });
    const body2 = await res2.json();
    expect(res2.status()).toBe(200);

    // Must return the exact same payment_id — no double charge
    expect(body2.payment_id).toBe(body1.payment_id);
    expect(body2.paid_at).toBe(body1.paid_at);
  });

  test('different idempotency_key after first payment returns 409', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB', idempotency_key: `key-a-${Date.now()}`,
      },
    });

    // Second attempt with a different key — quotation already paid
    const res2 = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB', idempotency_key: `key-b-${Date.now()}`,
      },
    });
    expect(res2.status()).toBe(409);
  });
});

test.describe('API — Concurrency (Task 9)', () => {

  test('concurrent duplicate requests with same idempotency_key return consistent result', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const key = `concurrent-${Date.now()}`;
    const payload = {
      quotation_id: quotationId, card_number: VALID_CARD.number,
      card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
      amount: totalAmount, currency: 'THB', idempotency_key: key,
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => request.post('/api/v1/payments', { data: payload })),
    );

    const bodies = await Promise.all(results.map(r => r.json()));
    const statuses = results.map(r => r.status());

    // All should succeed
    expect(statuses.every(s => s === 200)).toBe(true);
    // All must return the same payment_id
    const paymentIds = new Set(bodies.map(b => b.payment_id));
    expect(paymentIds.size).toBe(1);
  });
});

test.describe('API — Data consistency (Task 11)', () => {

  test('charged amount matches requested amount exactly', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request, 3, 1100);
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB',
      },
    });
    const body = await res.json();
    expect(body.amount).toBe(totalAmount);
  });

  test('quotation state is "paid" after successful payment', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB',
      },
    });

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
      data: {
        quotation_id: quotationId, card_number: VALID_CARD.number,
        card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
        amount: totalAmount, currency: 'THB',
      },
    });
    expect(payRes.status()).toBe(200);

    // State must have transitioned from accepted → paid (not stuck in accepted)
    const state = await (await request.get(`/api/v1/quotations/${quotationId}`)).json();
    expect(state.status).not.toBe('accepted');
    expect(state.status).toBe('paid');
  });

  test('payment on already-paid quotation is rejected', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);
    const payPayload = {
      quotation_id: quotationId, card_number: VALID_CARD.number,
      card_expiry: VALID_CARD.expiry, card_cvv: VALID_CARD.cvv,
      amount: totalAmount, currency: 'THB',
    };

    await request.post('/api/v1/payments', { data: payPayload });
    const retry = await request.post('/api/v1/payments', { data: { ...payPayload, idempotency_key: undefined } });
    expect(retry.status()).toBe(409);
  });
});
