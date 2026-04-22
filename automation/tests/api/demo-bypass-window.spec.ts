import { test, expect } from '@playwright/test';
import { buildQuotationPayload } from '../../fixtures/testData';

/**
 * DEMO: How BYPASS_WINDOW works
 *
 * The mock server checks the 'x-simulated-time' header to decide if we're
 * in the maintenance window (23:55–00:15). This file shows how to test
 * different times without waiting for the actual time.
 */

test.describe('DEMO — Maintenance Window Bypass', () => {

  test('❌ [WILL FAIL] payment rejected WITHOUT the header (uses real time)', async ({ request }) => {
    // No 'x-simulated-time' header — server uses real time
    // If you run this between 23:55–00:15, you'll get 503
    // If you run it at other times, you'll get 400 (validation error)

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: 'TEST-123',
        credit_card_number: '4111111111111111',
        credit_card_owner_name: 'John Doe',
        expiration_date: '12/28',
        cvv: '123',
        amount: 100,
        currency: 'THB',
      },
      // NO headers property — will use real server time
    });

    // Right now (00:08), this will get 503 because we're in the window
    console.log('Response status:', res.status());
    // If run at 12:00 PM instead, status would be 400 (missing quotation)
  });

  test('✅ [WILL PASS] payment succeeds WITH header set to 12:00 (normal business hours)', async ({ request }) => {
    // 'x-simulated-time: 12:00' — server thinks it's noon, not in maintenance window

    const res = await request.post('/api/v1/payments', {
      data: {
        quotation_id: 'TEST-123',
        credit_card_number: '4111111111111111',
        credit_card_owner_name: 'John Doe',
        expiration_date: '12/28',
        cvv: '123',
        amount: 100,
        currency: 'THB',
      },
      headers: { 'x-simulated-time': '12:00' },
    });

    // Status will be 400 (quotation not found) — not 503!
    // This proves the header worked and we're not in the window
    expect(res.status()).not.toBe(503);
    console.log('✅ Bypass worked! Status:', res.status(), '(not 503)');
  });

  test('🕐 Test different times — shows window boundaries', async ({ request }) => {
    // Test each boundary
    const times = [
      { time: '23:54', inWindow: false, label: 'just before window' },
      { time: '23:55', inWindow: true,  label: 'window starts' },
      { time: '00:00', inWindow: true,  label: 'midnight' },
      { time: '00:15', inWindow: true,  label: 'window ends' },
      { time: '00:16', inWindow: false, label: 'just after window' },
      { time: '12:00', inWindow: false, label: 'normal business hours' },
    ];

    for (const { time, inWindow, label } of times) {
      const res = await request.post('/api/v1/payments', {
        data: {
          quotation_id: 'DUMMY',
          credit_card_number: '4111111111111111',
          credit_card_owner_name: 'Test',
          expiration_date: '12/28',
          cvv: '123',
          amount: 100,
          currency: 'THB',
        },
        headers: { 'x-simulated-time': time },
      });

      const status = res.status();
      const is503 = status === 503;
      const checkmark = is503 === inWindow ? '✅' : '❌';

      console.log(
        `${checkmark} ${time} (${label}): ${status} ${is503 ? '(maintenance)' : '(service available)'}`
      );
    }
  });

  test('🎯 Practical example: How we use it in real tests', async ({ request }) => {
    // This is how we bypass the window in production tests
    // Set it ONCE in the helper function, use everywhere

    const headers = { 'x-simulated-time': '12:00' }; // Simulated time: noon

    const res1 = await request.post('/api/v1/quotations', {
      data: {
        seller_id: 'SELLER-TEST',
        buyer_id: 'BUYER-TEST',
        milestones: [
          {
            title: 'Phase 1',
            description: 'Work',
            deliverables: 'Stuff',
            due_date: '2026-05-01',
            amount: 2000,
          },
          {
            title: 'Phase 2',
            description: 'More work',
            deliverables: 'More stuff',
            due_date: '2026-06-01',
            amount: 2000,
          },
        ],
      },
      headers, // ← Use the header
    });

    console.log('Created quotation:', res1.status());
    expect(res1.status()).toBe(201); // Success!
  });
});

/**
 * KEY TAKEAWAY:
 *
 * The 'x-simulated-time' header is a TESTING TOOL that lets you:
 * 1. Bypass the maintenance window without waiting until 00:16
 * 2. Test different times of day instantly
 * 3. Make tests reproducible and fast
 *
 * In production, the server would use real time and reject requests
 * during the actual maintenance window.
 */
