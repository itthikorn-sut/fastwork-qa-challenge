# Performance Test Design

## Scope
File upload up to 2 GB and payment API under concurrent load.

## Tool
k6 (JavaScript-based load testing tool, CI-friendly)

## Scenarios

### 1. Payment API Load Test

```javascript
// k6 script outline: payment-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 1   },  // baseline
    { duration: '3m',  target: 10  },  // normal
    { duration: '3m',  target: 100 },  // stress
    { duration: '5m',  target: 500 },  // limit
    { duration: '2m',  target: 0   },  // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:   ['rate<0.01'],   // less than 1% failure rate
  },
};

export default function () {
  const res = http.post('http://localhost:3000/api/v1/payments', JSON.stringify({
    quotation_id: 'QUO-PRELOADED',
    card_number: '4111111111111111',
    card_expiry: '12/28',
    card_cvv: '123',
    amount: 3300,
    currency: 'THB',
    idempotency_key: `k6-${__VU}-${__ITER}`,
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, {
    'status 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
```

### 2. File Upload (2 GB) Stress Test

| Load Level | Users | Purpose         | Target Metric          |
|------------|-------|-----------------|------------------------|
| Baseline   | 1     | Single upload   | Response time < 60s    |
| Normal     | 10    | Concurrent      | Throughput > 50 MB/s   |
| Stress     | 100   | Heavy parallel  | Error rate < 5%        |
| Limit      | 500   | Break point     | Identify OOM/timeout   |

#### Metrics to Capture
- `http_req_duration` — end-to-end response time
- `http_req_receiving` — time to receive response body
- `data_received` / `data_sent` — throughput
- `http_req_failed` — error rate
- CPU and memory on the server side (monitored separately)

## Acceptance Criteria

| Metric              | Threshold          |
|---------------------|--------------------|
| p95 response time   | < 2,000 ms         |
| p99 response time   | < 5,000 ms         |
| Error rate          | < 1%               |
| Throughput          | ≥ 100 req/s at 100 users |

## Notes
- Pre-populate quotation IDs in the test environment to isolate payment API performance from quotation creation.
- Run tests in an environment that mirrors production specs (CPU, RAM, network).
- Monitor for memory leaks during the 500-user stage.
