/**
 * k6 Quotation Creation Load Test
 * Run: k6 run k6/quotation-load.js
 *
 * Tests quotation creation endpoint under concurrent load.
 * Each VU creates a fresh quotation — measures API throughput and latency.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const createErrors   = new Rate('quotation_create_errors');
const createDuration = new Trend('quotation_create_duration_ms');
const quotationsCreated = new Counter('quotations_created_total');

export const options = {
  stages: [
    { duration: '30s', target: 1   },  // baseline
    { duration: '1m',  target: 10  },  // normal
    { duration: '2m',  target: 100 },  // stress
    { duration: '1m',  target: 0   },  // ramp-down
  ],
  thresholds: {
    http_req_duration:            ['p(95)<2000', 'p(99)<5000'],
    http_req_failed:              ['rate<0.01'],
    quotation_create_errors:      ['rate<0.01'],
    quotation_create_duration_ms: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const HEADERS  = { 'Content-Type': 'application/json' };

function makeMilestones(count) {
  return Array.from({ length: count }, (_, i) => ({
    title:        `Round ${i + 1}`,
    description:  `Load test round ${i + 1}`,
    deliverables: `Output ${i + 1}`,
    due_date:     '2027-12-31',
    amount:       1700,
  }));
}

export default function () {
  const vuId = `VU-${__VU}-${__ITER}`;

  group('POST /api/v1/quotations', () => {
    const res = http.post(`${BASE_URL}/api/v1/quotations`, JSON.stringify({
      seller_id:  `SELLER-${vuId}`,
      buyer_id:   `BUYER-${vuId}`,
      milestones: makeMilestones(2),
    }), { headers: HEADERS });

    const ok = check(res, {
      'status 201':           (r) => r.status === 201,
      'has quotation_id':     (r) => String(r.json('quotation_id')).startsWith('QUO-'),
      'status is draft':      (r) => r.json('status') === 'draft',
      'response time < 2s':   (r) => r.timings.duration < 2000,
    });

    createErrors.add(!ok);
    createDuration.add(res.timings.duration);
    if (ok) quotationsCreated.add(1);
  });

  group('POST /api/v1/quotations/:id/accept', () => {
    // Create & immediately accept to test full pre-payment setup time
    const createRes = http.post(`${BASE_URL}/api/v1/quotations`, JSON.stringify({
      seller_id:  `SELLER-ACC-${vuId}`,
      buyer_id:   `BUYER-ACC-${vuId}`,
      milestones: makeMilestones(2),
    }), { headers: HEADERS });

    if (createRes.status === 201) {
      const { quotation_id } = createRes.json();
      const acceptRes = http.post(
        `${BASE_URL}/api/v1/quotations/${quotation_id}/accept`,
        null,
        { headers: HEADERS },
      );
      check(acceptRes, {
        'accept status 200': (r) => r.status === 200,
        'status is accepted': (r) => r.json('status') === 'accepted',
      });
    }
  });

  sleep(1);
}
