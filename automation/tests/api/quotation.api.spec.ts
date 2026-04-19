import { test, expect } from '@playwright/test';
import { buildQuotationPayload, buildMilestones, pastDate, futureDate } from '../../fixtures/testData';

test.describe('API — Quotation validation rules', () => {

  test('rejects quotation with fewer than 2 rounds', async ({ request }) => {
    const payload = buildQuotationPayload(1);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2 and 5');
  });

  test('rejects quotation with more than 5 rounds', async ({ request }) => {
    const payload = buildQuotationPayload(6);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2 and 5');
  });

  test('rejects when any round amount is exactly 100 THB', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[1].amount = 100;
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('greater than 100'))).toBe(true);
  });

  test('rejects when any round amount is 0', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].amount = 0;
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects when total amount is exactly 3000 THB', async ({ request }) => {
    // 3 rounds × 1000 = 3000 (not > 3000)
    const payload = buildQuotationPayload(3, 1000);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('3000 THB'))).toBe(true);
  });

  test('rejects due_date in the past', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].due_date = pastDate();
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('future date'))).toBe(true);
  });

  test('rejects missing title', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].title = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('title'))).toBe(true);
  });

  test('rejects missing description', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].description = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('description'))).toBe(true);
  });

  test('rejects missing deliverables', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].deliverables = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('deliverables'))).toBe(true);
  });

  test('rejects missing seller_id', async ({ request }) => {
    const payload = { buyer_id: 'B1', milestones: buildMilestones(3) };
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
  });

  test('accepts valid 2-round quotation (minimum)', async ({ request }) => {
    const payload = buildQuotationPayload(2, 1600);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.quotation_id).toMatch(/^QUO-/);
    expect(body.status).toBe('draft');
    expect(body.total_amount).toBe(3200);
  });

  test('accepts valid 5-round quotation (maximum)', async ({ request }) => {
    const payload = buildQuotationPayload(5, 700);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.total_amount).toBe(3500);
  });

  test('cannot accept a quotation that does not exist', async ({ request }) => {
    const res = await request.post('/api/v1/quotations/INVALID-999/accept');
    expect(res.status()).toBe(404);
  });

  test('cannot accept a quotation twice', async ({ request }) => {
    const payload = buildQuotationPayload(3);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    await request.post(`/api/v1/quotations/${quotation_id}/accept`);
    const secondAccept = await request.post(`/api/v1/quotations/${quotation_id}/accept`);
    expect(secondAccept.status()).toBe(409);
  });
});
