import { test, expect } from '@playwright/test';
import { buildQuotationPayload, buildMilestones, pastDate, futureDate } from '../../fixtures/testData';

test.describe('API — Quotation validation rules', () => {

  test('[TC-QUO-001] rejects quotation with fewer than 2 rounds', async ({ request }) => {
    const payload = buildQuotationPayload(1);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2 and 5');
  });

  test('[TC-QUO-002] rejects quotation with more than 5 rounds', async ({ request }) => {
    const payload = buildQuotationPayload(6);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2 and 5');
  });

  test('[TC-QUO-003] rejects when any round amount is exactly 100 THB', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[1].amount = 100;
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('greater than 100'))).toBe(true);
  });

  test('[TC-QUO-004] rejects when any round amount is 0', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].amount = 0;
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
  });

  test('[TC-QUO-005] rejects when total amount is exactly 3000 THB', async ({ request }) => {
    // 3 rounds × 1000 = 3000 (not > 3000)
    const payload = buildQuotationPayload(3, 1000);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('3000 THB'))).toBe(true);
  });

  test('[TC-QUO-006] rejects due_date in the past', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].due_date = pastDate();
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('future date'))).toBe(true);
  });

  test('[TC-QUO-007] rejects missing title', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].title = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('title'))).toBe(true);
  });

  test('[TC-QUO-008] rejects missing description', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].description = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('description'))).toBe(true);
  });

  test('[TC-QUO-009] rejects missing deliverables', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].deliverables = '';
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('deliverables'))).toBe(true);
  });

  test('[TC-QUO-010] rejects missing seller_id', async ({ request }) => {
    const payload = { buyer_id: 'B1', milestones: buildMilestones(3) };
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(400);
  });

  test('[TC-QUO-011] accepts valid 2-round quotation (minimum)', async ({ request }) => {
    const payload = buildQuotationPayload(2, 1600);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.quotation_id).toMatch(/^QUO-/);
    expect(body.status).toBe('draft');
    expect(body.total_amount).toBe(3200);
  });

  test('[TC-QUO-012] accepts valid 5-round quotation (maximum)', async ({ request }) => {
    const payload = buildQuotationPayload(5, 700);
    const res = await request.post('/api/v1/quotations', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.total_amount).toBe(3500);
  });

  test('[TC-QUO-013] cannot accept a quotation that does not exist', async ({ request }) => {
    const res = await request.post('/api/v1/quotations/INVALID-999/accept');
    expect(res.status()).toBe(404);
  });

  test('[TC-QUO-014] rejects title exceeding 100 characters', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].title = 'T'.repeat(101);
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('100 characters'))).toBe(true);
  });

  test('[TC-QUO-015] rejects description exceeding 2000 characters', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].description = 'D'.repeat(2001);
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('2000 characters'))).toBe(true);
  });

  test('[TC-QUO-016] rejects deliverables exceeding 500 characters', async ({ request }) => {
    const milestones = buildMilestones(3, 1100);
    milestones[0].deliverables = 'X'.repeat(501);
    const res = await request.post('/api/v1/quotations', {
      data: { seller_id: 'S1', buyer_id: 'B1', milestones },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.details.some((d: string) => d.includes('500 characters'))).toBe(true);
  });

  test('[TC-QUO-017] cannot accept a quotation twice', async ({ request }) => {
    const payload = buildQuotationPayload(3);
    const created = await request.post('/api/v1/quotations', { data: payload });
    const { quotation_id } = await created.json();

    await request.post(`/api/v1/quotations/${quotation_id}/accept`);
    const secondAccept = await request.post(`/api/v1/quotations/${quotation_id}/accept`);
    expect(secondAccept.status()).toBe(409);
  });
});
