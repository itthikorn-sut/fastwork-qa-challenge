/**
 * k6 Payment API Load Test
 * Run: k6 run k6/payment-load.js
 *
 * Prerequisites:
 *   1. Start mock server: npm run mock:server
 *   2. Pre-create accepted quotations using the setup script below,
 *      or set env var QUOTATION_IDS as a comma-separated list.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const paymentErrors   = new Rate('payment_errors');
const paymentDuration = new Trend('payment_duration_ms');

export const options = {
  stages: [
    { duration: '30s', target: 1   },  // baseline — single user warm-up
    { duration: '1m',  target: 10  },  // normal load
    { duration: '2m',  target: 100 },  // stress
    { duration: '3m',  target: 500 },  // peak — find breaking point
    { duration: '1m',  target: 0   },  // ramp-down
  ],
  thresholds: {
    http_req_duration:   ['p(95)<2000', 'p(99)<5000'],  // latency SLA
    http_req_failed:     ['rate<0.01'],                  // < 1% errors
    payment_errors:      ['rate<0.01'],
    payment_duration_ms: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const HEADERS  = { 'Content-Type': 'application/json' };

/**
 * Setup: create one accepted quotation per VU to isolate payment performance.
 * k6 calls setup() once before the test and passes the result to default().
 */
export function setup() {
  const quotationIds = [];

  for (let i = 0; i < 10; i++) {
    // Create quotation
    const createRes = http.post(`${BASE_URL}/api/v1/quotations`, JSON.stringify({
      seller_id: `SELLER-LOAD-${i}`,
      buyer_id:  `BUYER-LOAD-${i}`,
      milestones: [
        { title: 'Load Round 1', description: 'Perf test', deliverables: 'Output', due_date: '2027-12-31', amount: 1700 },
        { title: 'Load Round 2', description: 'Perf test', deliverables: 'Output', due_date: '2027-12-31', amount: 1700 },
      ],
    }), { headers: HEADERS });

    if (createRes.status !== 201) continue;

    const { quotation_id } = createRes.json();

    // Accept quotation
    http.post(`${BASE_URL}/api/v1/quotations/${quotation_id}/accept`, null, { headers: HEADERS });
    quotationIds.push({ id: quotation_id, amount: 3400 });
  }

  return { quotationIds };
}

export default function ({ quotationIds }) {
  if (!quotationIds || quotationIds.length === 0) {
    console.error('No pre-loaded quotation IDs available');
    return;
  }

  // Each VU picks a quotation slot by round-robin
  const slot    = quotationIds[__VU % quotationIds.length];
  const idemKey = `k6-pay-${slot.id}-${__VU}-${__ITER}`;

  group('POST /api/v1/payments', () => {
    const res = http.post(`${BASE_URL}/api/v1/payments`, JSON.stringify({
      quotation_id:           slot.id,
      credit_card_number:     '4111111111111111',
      credit_card_owner_name: 'K6 LOAD TEST',
      expiration_date:        '12/28',
      cvv:                    '123',
      amount:                 slot.amount,
      currency:               'THB',
      idempotency_key:        idemKey,
    }), { headers: HEADERS });

    const ok = check(res, {
      'status 200':           (r) => r.status === 200,
      'has payment_id':       (r) => r.json('payment_id') !== undefined,
      'response time < 2s':   (r) => r.timings.duration < 2000,
    });

    paymentErrors.add(!ok);
    paymentDuration.add(res.timings.duration);
  });

  sleep(1);
}
