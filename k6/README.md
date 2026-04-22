# k6 Performance Load Tests

This folder contains load testing scripts for the Fastwork Quotation & Payment API using [k6](https://k6.io), an open-source load testing tool written in Go.

## Overview

Performance testing validates that the API meets latency and throughput SLAs under concurrent load, catching scalability issues before production.

## Tests Included

### 1. Quotation Creation Load Test (`quotation-load.js`)

**What it tests:**
- Quotation creation endpoint throughput under concurrent load
- Each Virtual User (VU) creates a fresh quotation with 2 milestones
- Immediate acceptance to test full pre-payment setup pipeline

**Load profile:**
```
Ramp-up: 1 VU → 10 VU → 100 VU (baseline → normal → stress)
Duration: 30s + 1m + 2m + 1m ramp-down = 4m 30s
```

**Performance SLA:**
- HTTP request duration p(95) < 2000ms
- HTTP request duration p(99) < 5000ms
- Error rate < 1%
- Custom metric: `quotation_create_errors` < 1%

**Metrics produced:**
- `quotation_create_errors` — failure rate
- `quotation_create_duration_ms` — latency trend
- `quotations_created_total` — total successful creates

### 2. Payment Processing Load Test (`payment-load.js`)

**What it tests:**
- Payment API performance under high concurrency
- Simulates repeated payment attempts with idempotency keys
- Tests payment gateway throughput at scale

**Load profile:**
```
Ramp-up: 1 VU → 10 → 100 → 500 VU (warm-up → normal → stress → peak)
Duration: 30s + 1m + 2m + 3m + 1m ramp-down = 7m 30s
```

**Performance SLA:**
- HTTP request duration p(95) < 2000ms
- HTTP request duration p(99) < 5000ms
- Error rate < 1%
- Custom metric: `payment_errors` < 1%

**Setup phase:**
- Creates 10 pre-accepted quotations (each with 2 milestones, $3,400 total)
- Quotations are reused by VUs in round-robin fashion
- Ensures payment testing is isolated from quotation creation bottlenecks

**Metrics produced:**
- `payment_errors` — failure rate
- `payment_duration_ms` — latency trend
- HTTP standard metrics (duration, failed requests)

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Or download binary:** https://k6.io/docs/getting-started/installation/

### Start the Mock API Server

```bash
cd /path/to/fastwork-qa-challenge
npm install  # if not already done
npm run mock:server
# Server starts on http://localhost:3000
```

## Running Tests

### Quick Start

```bash
# Run quotation load test
npm run perf:quotation

# Run payment load test
npm run perf:payment
```

### Manual Execution with k6

```bash
# In the project root directory:
k6 run k6/quotation-load.js
k6 run k6/payment-load.js
```

### With Custom Base URL

```bash
# Test against a different server
k6 run -e BASE_URL=http://api.example.com:3000 k6/payment-load.js
```

### With Custom Stages (for quick testing)

Create a wrapper script to override stages:

```javascript
// k6/quotation-load-quick.js
import scenario from './quotation-load.js';

export const options = {
  ...scenario.options,
  stages: [
    { duration: '10s', target: 5 },   // Quick ramp
    { duration: '20s', target: 0 },   // Ramp down
  ],
};

export default scenario.default;
```

## Understanding k6 Concepts

### Virtual Users (VUs)
A VU is a thread that executes your test script. If your load test has 100 VUs, k6 spawns 100 concurrent workers hitting your API.

### Stages
Define how VU count changes over time:
```javascript
stages: [
  { duration: '30s', target: 1 },    // Ramp-up to 1 VU over 30s
  { duration: '1m',  target: 10 },   // Ramp to 10 VU over 1m
  { duration: '2m',  target: 100 },  // Ramp to 100 VU over 2m
  { duration: '1m',  target: 0 },    // Ramp down to 0 over 1m
]
```

### Thresholds
Define pass/fail criteria for the test:
```javascript
thresholds: {
  http_req_duration: ['p(95)<2000'],   // 95th percentile < 2 seconds
  http_req_failed: ['rate<0.01'],      // Error rate < 1%
}
```
If any threshold fails, k6 exits with a non-zero status (CI/CD fails).

### Custom Metrics
Beyond built-in metrics, you can define custom ones:
```javascript
import { Rate, Trend, Counter } from 'k6/metrics';

const paymentErrors = new Rate('payment_errors');       // 0-1, rate of true/false
const paymentDuration = new Trend('payment_duration_ms'); // histogram of values
const quotationsCreated = new Counter('quotations_created_total'); // counter
```

### Check vs Threshold

- **`check()`** — individual assertion, doesn't fail the test but records pass/fail
- **`threshold`** — aggregate metric over entire test; if it fails, exit with error code

Both are useful: checks document what you're validating, thresholds define SLAs.

## Sample Output

```
     data_received..................: 105 kB  28 B/s
     data_sent.......................: 110 kB  29 B/s
     http_req_blocked................: avg=10.15ms   min=0s    med=0s       max=50.12ms  p(90)=28.5ms  p(95)=35.2ms
     http_req_connecting.............: avg=5.2ms    min=0s    med=0s       max=25.3ms  p(90)=15.1ms  p(95)=20.5ms
     http_req_duration...............: avg=1456ms   min=112ms med=1400ms   max=4850ms  p(90)=2100ms  p(95)=2450ms  ✓ < 2000ms (58%)
     http_req_failed.................: 0.50%   ✓ < 1%
     http_req_receiving.............: avg=1.2ms    min=0s    med=1ms      max=15ms    p(90)=2ms     p(95)=3ms
     http_req_sending................: avg=0.5ms    min=0s    med=0s       max=8ms     p(90)=1ms     p(95)=1ms
     http_req_tls_handshaking........: avg=0s       min=0s    med=0s       max=0s      p(90)=0s      p(95)=0s
     http_req_waiting................: avg=1454ms   min=110ms med=1398ms   max=4848ms  p(90)=2098ms  p(95)=2448ms
     http_reqs........................: 145     38.667234/s
     payment_duration_ms.............: avg=1456ms   min=112ms med=1400ms   max=4850ms  p(90)=2100ms  p(95)=2450ms  ✓ < 2000ms
     payment_errors..................: 0.50%   ✓ < 1%
     vus............................: 98      min=1       max=500
     vus_max..........................: 500     min=500     max=500

running (3m45.2s), 0/500 VU, 145 complete and 0 interrupted iterations

✓ All checks passed!
```

## Interpreting Results

### Key Metrics to Watch

1. **HTTP request duration (p95, p99)**
   - p(95) < 2000ms: 95% of requests complete within 2 seconds
   - If p(95) exceeds SLA, you have a latency problem even if average is fine

2. **http_req_failed**
   - % of requests that got HTTP 5xx or connection errors
   - Ideally 0%, threshold set to < 1% to catch degradation

3. **VUs**
   - Current active Virtual Users during test
   - Should ramp smoothly; sudden drops indicate crashes

4. **Data received/sent**
   - Network throughput per second
   - Helps identify bandwidth bottlenecks

### Common Issues

**All requests fail at a certain VU count:**
- API is crashing or running out of connections
- Check server logs: `npm run mock:server` should show errors

**Latency increases dramatically above 100 VUs:**
- Server hitting CPU/memory limits
- Or database connection pool exhausted
- Profile server with `node --prof` or APM tool

**Threshold failures but no actual failures:**
- SLA is too aggressive for current infra
- Renegotiate SLA or scale infrastructure

## Integration with CI/CD

k6 can be integrated into GitHub Actions:

```yaml
- name: Run k6 load tests
  run: |
    npm run mock:server &
    sleep 2
    npm run perf:quotation
    npm run perf:payment
```

If a threshold fails, k6 exits with code 1, failing the workflow.

## References

- [k6 Official Docs](https://k6.io/docs/)
- [k6 HTTP API](https://k6.io/docs/javascript-api/k6-http/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)

---

*Performance tests for Fastwork QA Challenge*
