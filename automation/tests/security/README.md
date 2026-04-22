# Security & Compliance Testing

This folder contains security and compliance test cases validating **PCI-DSS** and **GDPR** requirements for the Milestone Quotation and Payment Flow API.

## Overview

Payment systems handling cardholder data must comply with strict industry standards. This test suite ensures:

- **PCI-DSS Requirement 3:** Cardholder data is never stored or returned in plaintext
- **PCI-DSS Requirement 4:** All data transmission is encrypted (HTTPS)
- **PCI-DSS Requirement 6:** Application development follows secure practices (input validation)
- **PCI-DSS Requirement 8:** User access is properly authenticated and authorized
- **PCI-DSS Requirement 10:** All access is logged for audit trails
- **GDPR Article 5:** Data collection, processing, and retention follow data protection principles
- **GDPR Article 32:** Technical and organizational measures protect personal data

## Test Suites

### `compliance.spec.ts` — 20 Security & Compliance Tests

Automated Playwright tests covering PCI-DSS and GDPR requirements.

#### Section 1: Card Data Protection (S-01 to S-04)

**PCI-DSS Requirement 3:** Protect stored cardholder data

| Test | Scope | What It Validates |
|------|-------|-------------------|
| **S-01** | Card number not stored in plaintext in response | Full PAN (16 digits) must NOT appear in API response |
| **S-02** | Card number masked in API response | Response includes `masked_card` format: `****-****-****-XXXX` |
| **S-03** | CVV not returned in any API response | CVV field must NEVER appear in response body |
| **S-04** | Payment response contains no raw card data | Only safe fields (payment_id, amount, masked_card) in response |

**Expected Results:**
```javascript
// Good (compliant):
{
  "payment_id": "PAY-abc123",
  "amount": 5000,
  "currency": "THB",
  "masked_card": "****-****-****-1111",
  "status": "SUCCESS",
  "paid_at": "2026-04-23T10:30:00Z"
}

// Bad (non-compliant) — would fail tests:
{
  "payment_id": "PAY-abc123",
  "credit_card_number": "4111111111111111",  // ❌ Full PAN exposed
  "cvv": "123",                              // ❌ CVV exposed
  "credit_card_owner_name": "John Doe"       // ❌ Raw cardholder name
}
```

#### Section 2: Input Validation & Injection Prevention (S-08 to S-11)

**PCI-DSS Requirement 6:** Develop and maintain secure applications

| Test | Attack Type | Payload | Expected Response |
|------|-------------|---------|-------------------|
| **S-08** | SQL Injection | `'; DROP TABLE quotations; --` | 400 (rejected) or 201 (sanitized), never 500 |
| **S-09** | Cross-Site Scripting (XSS) | `<img src=x onerror="alert(1)">` | Script NOT executed in DOM |
| **S-10** | Oversized Payload | > 10 MB JSON body | 400 Bad Request or 413 Payload Too Large |
| **S-11** | Invalid Amount | `"amount": -9999` | 400 (amount must be positive) |

**Why This Matters:**
- SQL injection could expose entire database
- XSS could steal user session tokens
- Oversized payloads can cause DoS (memory exhaustion)
- Negative amounts could create refund exploits

#### Section 3: Authentication & Authorization (S-12 to S-14)

**PCI-DSS Requirement 8:** Identify and authenticate access

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| **S-12** | Invalid auth token | 401 Unauthorized (refuse access) |
| **S-13** | Buyer A tries to access Buyer B's quotation | 403 Forbidden (cross-user isolation) |
| **S-14** | Seller tries to initiate fund transfer directly | 403 Forbidden (role-based access control) |

**Why This Matters:**
- Unauthenticated access could allow payment fraud
- Cross-user access could expose other buyers' payment data
- Missing RBAC could allow unauthorized fund transfers

#### Section 4: Audit Logging (S-15 to S-17)

**PCI-DSS Requirement 10:** Track and monitor all access

| Test | Requirement | What's Logged | What's NOT Logged |
|------|-------------|---------------|--------------------|
| **S-15** | Card numbers absent from logs | — | Full PAN ("4111111111111111") |
| **S-16** | CVV absent from logs | — | CVV values ("123", "456", etc.) |
| **S-17** | Successful payments logged | payment_id, amount, timestamp | Card data, CVV, cardholder name |

**Compliance:**
```
✓ SAFE to log:
  - payment_id: "PAY-abc123"
  - amount: 5000
  - currency: "THB"
  - timestamp: "2026-04-23T10:30:00Z"
  - masked_card: "****-****-****-1111"

✗ NEVER log:
  - credit_card_number: "4111111111111111"
  - cvv: "123"
  - credit_card_owner_name (if PII sensitive in jurisdiction)
```

#### Section 5: Transport Security (S-05 to S-07)

**PCI-DSS Requirement 4:** Encrypt transmission of cardholder data

| Test | Control | Expected |
|------|---------|----------|
| **S-05** | HTTPS enforcement | HTTP requests redirect to HTTPS (301/302) |
| **S-06** | Authorization header | Bearer token prevents plaintext transmission |
| **S-07** | Security headers | Response includes security directives |

**Production Requirements:**
- TLS 1.2+ (no TLS 1.0/1.1)
- Strong ciphers (no weak algorithms)
- HSTS header: `Strict-Transport-Security: max-age=31536000`
- X-Content-Type-Options: `nosniff`
- X-Frame-Options: `DENY`

#### Section 6: Data Minimization & GDPR (GDPR-01 to GDPR-03)

**GDPR Article 5(1)(c) — Data Minimization:** Only collect necessary data

| Test | Requirement | What's Collected | What's NOT |
|------|-------------|------------------|-----------|
| **GDPR-01** | Data minimization | seller_id, buyer_id, milestones, card info | email, phone, SSN, IP address |
| **GDPR-02** | Storage limitation | Payment data deleted after retention period | Card data kept indefinitely |
| **GDPR-03** | Right to erasure | DELETE endpoint supports user data removal | Permanent record-keeping |

**Compliance Principle:**
```
Collect ONLY:
- Information needed to complete transaction
- Legally required data

Do NOT collect:
- Optional personal data (email, phone)
- Sensitive data (SSN, health, ethnicity)
- Data beyond retention period
```

## Running Security Tests

### Run All Security Tests

```bash
npx playwright test automation/tests/security/compliance.spec.ts
```

### Run Specific Test Category

```bash
# Card data protection only
npx playwright test automation/tests/security/compliance.spec.ts -g "Card Data Protection"

# Input validation only
npx playwright test automation/tests/security/compliance.spec.ts -g "Input Validation"

# Authentication only
npx playwright test automation/tests/security/compliance.spec.ts -g "Authentication"
```

### Run with Verbose Output

```bash
npx playwright test automation/tests/security/compliance.spec.ts --reporter=verbose
```

### Generate HTML Report

```bash
npx playwright test automation/tests/security/compliance.spec.ts
npx playwright show-report
```

## Understanding Compliance Failures

### Example: Failed Card Masking Test (S-02)

**Scenario:** Test expects `****-****-****-1111` but API returns `4111111111111111`

```
❌ FAILED: S-02 Card number masked in response
Expected: masked_card to match /^\*{4}-\*{4}-\*{4}-\d{4}$/
Actual: "4111111111111111"

Action: Fix API to mask card number before returning:
- Store full PAN in vault (not in code/DB)
- Return only last 4 digits in response
- Use format: ****-****-****-XXXX
```

### Example: Failed Authorization Test (S-13)

**Scenario:** Test expects 403 when Buyer A accesses Buyer B's quotation

```
❌ FAILED: S-13 Cross-user access prevention
Expected status: 403
Actual status: 200

Action: Implement buyer_id check in API:
- Extract buyer_id from JWT/auth context
- Before returning quotation, verify auth.buyer_id === quotation.buyer_id
- Return 403 Forbidden if mismatch
```

## Compliance Standards Reference

### PCI-DSS (Payment Card Industry Data Security Standard)

**Scope:** Any system handling credit card data

**Key Requirements:**
1. **Network security:** Firewall, secure network architecture
2. **Cardholder data protection:** Encryption, access control
3. **Vulnerability management:** Regular patching, testing
4. **Access control:** Authentication, authorization, logging
5. **Regular monitoring:** Audit trails, intrusion detection

**Our Coverage:**
- ✅ Req 3: Cardholder data protection (masked, not stored)
- ✅ Req 4: Encrypted transmission (HTTPS)
- ✅ Req 6: Secure application development (input validation)
- ✅ Req 8: User identification & authentication (auth tests)
- ✅ Req 10: Logging & monitoring (audit trail tests)

### GDPR (General Data Protection Regulation)

**Scope:** Any system processing personal data of EU residents

**Key Principles:**
1. **Lawfulness, fairness, transparency:** Legal basis for processing
2. **Purpose limitation:** Collect only for specified purpose
3. **Data minimization:** Only necessary data
4. **Accuracy:** Keep data accurate and up-to-date
5. **Storage limitation:** Keep only as long as necessary
6. **Integrity and confidentiality:** Secure processing
7. **Accountability:** Demonstrate compliance

**Our Coverage:**
- ✅ Article 5(1)(c): Data minimization (GDPR-01)
- ✅ Article 5(1)(e): Storage limitation (GDPR-02)
- ✅ Article 17: Right to erasure (GDPR-03)
- ✅ Article 32: Security of processing (all S-* tests)

## Compliance Checklist

Before deploying to production, verify:

- [ ] All card numbers are masked (S-02)
- [ ] CVV is never stored or logged (S-03, S-16)
- [ ] All API endpoints enforce HTTPS (S-05)
- [ ] Authentication required for sensitive endpoints (S-12)
- [ ] Cross-user access is prevented (S-13)
- [ ] Input validation prevents injection attacks (S-08 to S-11)
- [ ] Audit logs contain safe fields only (S-17)
- [ ] Only necessary personal data is collected (GDPR-01)
- [ ] Data deletion is possible (GDPR-03)
- [ ] Security headers are present (S-07)

## Audit Trail Example

**Compliant audit log entry:**
```json
{
  "timestamp": "2026-04-23T10:30:00Z",
  "event": "payment_success",
  "payment_id": "PAY-abc123def456",
  "quotation_id": "QUO-xyz789",
  "amount": 5000,
  "currency": "THB",
  "masked_card": "****-****-****-1111",
  "user_id": "BUYER-123",
  "user_ip": "192.0.2.1"
}
```

**Non-compliant log entry (DO NOT DO THIS):**
```json
{
  "timestamp": "2026-04-23T10:30:00Z",
  "event": "payment_success",
  "credit_card_number": "4111111111111111",  // ❌ PCI-DSS VIOLATION
  "cvv": "123",                              // ❌ NEVER LOG THIS
  "cardholder_name": "John Doe",             // ⚠️  May be PII
  "expiration_date": "12/28"                 // ⚠️  Linked to card
}
```

## Further Reading

- [PCI-DSS Compliance Handbook](https://www.pcisecuritystandards.org/document_library)
- [GDPR Official Text](https://gdpr-info.eu/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## Questions & Escalation

If a security test fails:

1. **Understand the requirement** — Read the test case and PCI-DSS/GDPR reference
2. **Fix the code** — Don't bypass the test; fix the underlying issue
3. **Verify the fix** — Run the test again to confirm compliance
4. **Document** — Add a comment explaining how compliance is met

**Never:**
- Skip security tests (marked with `test.skip()`)
- Disable auth checks (e.g., accept unauthenticated requests)
- Log sensitive data (card numbers, CVV, passwords)
- Store plaintext PAN (always mask or tokenize)

---

*Security & Compliance Test Suite for Fastwork QA Challenge*
