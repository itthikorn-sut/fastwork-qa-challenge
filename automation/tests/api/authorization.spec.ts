import { test, expect } from '@playwright/test';
import { buildQuotationPayload } from '../../fixtures/testData';
import { createAndAcceptQuotation } from '../../utils/apiHelper';
import { VALID_CARD } from '../../fixtures/testData';

test.describe('API — Cross-user authorization (Task 14)', () => {

  test('buyer B cannot pay for buyer A quotation (403)', async ({ request }) => {
    // Quotation created with buyer_id = BUYER-TEST (default)
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount,
        currency: 'THB',
      },
      headers: { 'x-user-id': 'BUYER-OTHER' },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain('Forbidden');
  });

  test('seller cannot initiate payment for own quotation (403)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    // Seller tries to pay — seller_id is SELLER-TEST
    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount,
        currency: 'THB',
      },
      headers: { 'x-user-id': 'SELLER-TEST' },
    });
    expect(res.status()).toBe(403);
  });

  test('correct buyer can pay own quotation (200)', async ({ request }) => {
    const { quotationId, totalAmount } = await createAndAcceptQuotation(request);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: totalAmount,
        currency: 'THB',
      },
      headers: { 'x-user-id': 'BUYER-TEST' },
    });
    expect(res.status()).toBe(200);
  });

  test('third-party user cannot view another user quotation (403)', async ({ request }) => {
    const payload = buildQuotationPayload(2);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    const res = await request.get(`/api/v1/quotations/${quotation_id}`, {
      headers: { 'x-user-id': 'STRANGER-999' },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain('Forbidden');
  });

  test('seller can view own quotation (200)', async ({ request }) => {
    const payload = buildQuotationPayload(2);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    const res = await request.get(`/api/v1/quotations/${quotation_id}`, {
      headers: { 'x-user-id': 'SELLER-TEST' },
    });
    expect(res.status()).toBe(200);
  });

  test('buyer can view own quotation (200)', async ({ request }) => {
    const payload = buildQuotationPayload(2);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    const res = await request.get(`/api/v1/quotations/${quotation_id}`, {
      headers: { 'x-user-id': 'BUYER-TEST' },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('API — Account status must be active', () => {

  test('inactive buyer cannot pay — rejected at payment (403)', async ({ request }) => {
    // Create quotation with inactive buyer_id — account status is checked at payment, not creation
    const payload = { ...buildQuotationPayload(2), buyer_id: 'INACTIVE-BUYER-001' };
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id, total_amount } = await created.json();
    await request.post(`/api/v1/quotations/${quotation_id}/accept`);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: total_amount,
        currency: 'THB',
      },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain('inactive');
  });

  test('inactive seller blocks payment (403)', async ({ request }) => {
    const payload = { ...buildQuotationPayload(2), seller_id: 'INACTIVE-SELLER-001' };
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id, total_amount } = await created.json();
    await request.post(`/api/v1/quotations/${quotation_id}/accept`);

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: total_amount,
        currency: 'THB',
      },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain('inactive');
  });
});
