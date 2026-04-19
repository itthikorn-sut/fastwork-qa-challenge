# Security Test Design

## Scope
PCI-DSS relevant controls and general OWASP Top 10 for the payment and quotation flow.

## Test Cases

### 1. Sensitive Data Handling

| ID   | Test Case                                    | Method          | Expected Result                        |
|------|----------------------------------------------|-----------------|----------------------------------------|
| S-01 | Card number not stored in plaintext           | DB/log inspection | No 16-digit PAN in logs or DB         |
| S-02 | Card number masked in API response            | API response check | `masked_card` shows `****-****-****-XXXX` only |
| S-03 | CVV not returned in any response              | API response check | CVV field absent from all responses   |
| S-04 | Payment ID response contains no raw card data | API response check | Only `masked_card` field present       |

### 2. Transport Security

| ID   | Test Case                                    | Method              | Expected Result                |
|------|----------------------------------------------|---------------------|--------------------------------|
| S-05 | All endpoints enforce HTTPS                  | HTTP → HTTPS redirect | HTTP requests redirect to HTTPS |
| S-06 | TLS version ≥ 1.2                            | `nmap --script ssl-enum-ciphers` | No TLS 1.0/1.1 |
| S-07 | HSTS header present                          | Response header check | `Strict-Transport-Security` set |

### 3. Input Validation & Injection

| ID   | Test Case                                    | Payload                     | Expected Result   |
|------|----------------------------------------------|-----------------------------|-------------------|
| S-08 | SQL injection in quotation fields            | `'; DROP TABLE quotations;--` | 400 / sanitized  |
| S-09 | XSS in milestone title field                 | `<script>alert(1)</script>` | Escaped in UI     |
| S-10 | Oversized payload (> 10 MB body)             | Padded JSON body            | 413 or rejected   |
| S-11 | Negative amount in payment                   | `"amount": -9999`           | 400               |

### 4. Authentication & Authorization

| ID   | Test Case                                    | Method              | Expected Result          |
|------|----------------------------------------------|---------------------|--------------------------|
| S-12 | Unauthenticated access to payment endpoint   | Request without auth token | 401 Unauthorized   |
| S-13 | Buyer cannot accept another buyer's quotation | Cross-user request  | 403 Forbidden            |
| S-14 | Seller cannot trigger fund transfer directly  | Direct API call     | 403 Forbidden            |

### 5. Logging

| ID   | Test Case                                    | Method              | Expected Result                      |
|------|----------------------------------------------|---------------------|--------------------------------------|
| S-15 | Card number absent from application logs     | Log file inspection | No PAN in any log line               |
| S-16 | CVV absent from application logs             | Log file inspection | CVV value never logged               |
| S-17 | Successful payments are audit-logged         | Log file inspection | `payment_id`, `amount`, `timestamp` present |

## Tools
- **OWASP ZAP** — automated scan for injection, XSS, security headers
- **nmap / testssl.sh** — TLS configuration verification
- **Burp Suite** — manual interception and payload testing

## Compliance Reference
- PCI-DSS Requirement 3: Protect stored cardholder data
- PCI-DSS Requirement 4: Encrypt transmission of cardholder data
- PCI-DSS Requirement 10: Track and monitor all access
