import { test, expect } from '@playwright/test';
import { buildQuotationPayload } from '../../fixtures/testData';
import { createAndAcceptQuotation } from '../../utils/apiHelper';
import { VALID_CARD } from '../../fixtures/testData';

async function createDraftQuotation(request: any) {
  const res = await request.post('/api/v1/quotations', { data: buildQuotationPayload(2) });
  expect(res.status()).toBe(201);
  return (await res.json()).quotation_id as string;
}

test.describe('API — Quotation rejection by buyer (Task 16)', () => {

  test('[TC-QUO-018] buyer can reject a draft quotation with reason', async ({ request }) => {
    const id = await createDraftQuotation(request);
    const res = await request.post(`/api/v1/quotations/${id}/reject`, {
      data: { reason: 'Budget does not match' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('rejected');
    expect(body.reason).toBe('Budget does not match');
  });

  test('[TC-QUO-019] quotation status is "rejected" after rejection', async ({ request }) => {
    const id = await createDraftQuotation(request);
    await request.post(`/api/v1/quotations/${id}/reject`, { data: { reason: 'Too expensive' } });

    const state = await (await request.get(`/api/v1/quotations/${id}`)).json();
    expect(state.status).toBe('rejected');
  });

  test('[TC-QUO-020] defaults to generic reason when none provided', async ({ request }) => {
    const id = await createDraftQuotation(request);
    const res = await request.post(`/api/v1/quotations/${id}/reject`, { data: {} });
    expect(res.status()).toBe(200);
    expect((await res.json()).reason).toBeTruthy();
  });

  test('[TC-QUO-021] cannot reject a quotation that is already accepted (409)', async ({ request }) => {
    const id = await createDraftQuotation(request);
    await request.post(`/api/v1/quotations/${id}/accept`);

    const res = await request.post(`/api/v1/quotations/${id}/reject`, {
      data: { reason: 'Changed mind' },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toContain('accepted');
  });

  test('[TC-QUO-022] cannot reject a quotation that is already rejected (409)', async ({ request }) => {
    const id = await createDraftQuotation(request);
    await request.post(`/api/v1/quotations/${id}/reject`, { data: { reason: 'First rejection' } });

    const res = await request.post(`/api/v1/quotations/${id}/reject`, {
      data: { reason: 'Second rejection' },
    });
    expect(res.status()).toBe(409);
  });

  test('[TC-QUO-023] cannot pay a rejected quotation (409)', async ({ request }) => {
    const id = await createDraftQuotation(request);
    await request.post(`/api/v1/quotations/${id}/reject`, { data: { reason: 'Rejected' } });

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: id,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: 3200,
        currency: 'THB',
      },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toContain('rejected');
  });

  test('[TC-QUO-024] cannot reject a non-existent quotation (404)', async ({ request }) => {
    const res = await request.post('/api/v1/quotations/INVALID-QUO/reject', {
      data: { reason: 'Test' },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('API — Contract completion state (Task 17)', () => {

  test('[TC-CMP-001] quotation status is "completed" after final milestone is accepted', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request, 2);
    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: 3200,
        currency: 'THB',
      },
    });

    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/accept`);

    const state = await (await request.get(`/api/v1/quotations/${quotationId}`)).json();
    expect(state.status).toBe('completed');
  });

  test('[TC-CMP-002] quotation is NOT completed if only some milestones accepted', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request, 3);
    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: 4800,
        currency: 'THB',
      },
    });

    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);

    const state = await (await request.get(`/api/v1/quotations/${quotationId}`)).json();
    expect(state.status).toBe('in_progress');
    expect(state.status).not.toBe('completed');
  });

  test('[TC-CMP-003] cannot submit work on a completed quotation (409)', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request, 2);
    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: 3200,
        currency: 'THB',
      },
    });
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/accept`);

    // Try to submit again on a completed contract
    const res = await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    expect(res.status()).toBe(409);
  });

  test('[TC-CMP-004] cannot terminate a completed quotation (409)', async ({ request }) => {
    const { quotationId } = await createAndAcceptQuotation(request, 2);
    await request.post('/api/v1/payments', {
      data: {
        quotation_id: quotationId,
        credit_card_number: VALID_CARD.number,
        credit_card_owner_name: VALID_CARD.ownerName,
        expiration_date: VALID_CARD.expiry,
        cvv: VALID_CARD.cvv,
        amount: 3200,
        currency: 'THB',
      },
    });
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/1/accept`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/submit`);
    await request.post(`/api/v1/quotations/${quotationId}/milestones/2/accept`);

    const res = await request.post(`/api/v1/quotations/${quotationId}/terminate`);
    expect(res.status()).toBe(409);
  });
});
