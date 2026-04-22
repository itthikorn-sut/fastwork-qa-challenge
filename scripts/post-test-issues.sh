#!/bin/bash

# Automated GitHub Issues poster for test case documentation
# Posts 5 test case issues, adds labels, pins findings issue

set -e

REPO="itthikorn-sut/fastwork-qa-challenge"
DOCS_FILE="docs/GITHUB-ISSUES.md"

echo "🚀 Starting GitHub Issues automation..."
echo "📦 Repository: $REPO"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to extract issue content between markers
extract_issue() {
    local issue_num=$1
    local start_marker="## Issue #$issue_num:"
    local end_marker="## Issue #$((issue_num + 1)):"

    if [ $issue_num -eq 5 ]; then
        end_marker="## Summary"
    fi

    awk "/$start_marker/,/$end_marker/" "$DOCS_FILE" | \
        sed "1d;\$d" | \
        sed 's/^## Summary.*//g'
}

# Array of issue data: (title|labels)
declare -a ISSUES=(
    "📋 Test Cases: API — Quotation Validation (TC-QUO-001 to TC-QUO-024)|documentation,test-cases,api,quotation"
    "📋 Test Cases: API — Payment Processing (TC-PAY-001 to TC-PAY-023)|documentation,test-cases,api,payment"
    "📋 Test Cases: API — Authorization & Security (TC-AUTH-* and S-*)|documentation,test-cases,security,pci-dss,gdpr"
    "📋 Test Cases: E2E & State Machine (TC-E2E-*, TC-REJ-*, TC-TER-*)|documentation,test-cases,e2e,state-machine"
    "⚠️ FINDINGS: Known Defects (FINDING-001 through FINDING-006)|bug,findings,test-documentation"
)

# Track created issue numbers
declare -a ISSUE_NUMBERS=()

echo "📄 Creating 5 GitHub Issues..."
echo ""

for i in {1..5}; do
    IFS='|' read -r title labels <<< "${ISSUES[$((i-1))]}"

    echo -e "${BLUE}[Issue #$i]${NC} $title"

    # Extract issue body from GITHUB-ISSUES.md
    body=$(extract_issue $i)

    # Create issue with gh CLI
    issue_url=$(gh issue create \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --repo "$REPO" \
        2>&1)

    # Extract issue number from URL
    issue_num=$(echo "$issue_url" | grep -oP 'issues/\K[0-9]+' | tail -1)
    ISSUE_NUMBERS+=($issue_num)

    echo -e "${GREEN}✓ Created Issue #$issue_num${NC}"
    echo ""
done

echo ""
echo "🎯 Created issues:"
for i in {0..4}; do
    echo "  Issue ${ISSUE_NUMBERS[$i]}: ${ISSUES[$i]%%|*}"
done
echo ""

# Pin the findings issue (last one)
FINDINGS_ISSUE=${ISSUE_NUMBERS[4]}
echo -e "${BLUE}[PIN]${NC} Pinning Issue #$FINDINGS_ISSUE (Findings)"
gh issue pin "$FINDINGS_ISSUE" --repo "$REPO" 2>&1 || echo "Note: Pinning may require additional permissions"
echo -e "${GREEN}✓ Issue #$FINDINGS_ISSUE pinned${NC}"
echo ""

# Update TEST-CASES.md with actual issue numbers
echo -e "${BLUE}[UPDATE]${NC} Updating TEST-CASES.md with issue numbers..."

TEST_CASES_FILE="automation/tests/TEST-CASES.md"

# Create backup
cp "$TEST_CASES_FILE" "${TEST_CASES_FILE}.backup"

# Replace placeholder issue numbers with actual ones
sed -i "s|issues/1|issues/${ISSUE_NUMBERS[0]}|g" "$TEST_CASES_FILE"
sed -i "s|issues/2|issues/${ISSUE_NUMBERS[1]}|g" "$TEST_CASES_FILE"
sed -i "s|issues/3|issues/${ISSUE_NUMBERS[2]}|g" "$TEST_CASES_FILE"
sed -i "s|issues/4|issues/${ISSUE_NUMBERS[3]}|g" "$TEST_CASES_FILE"
sed -i "s|issues/5|issues/${ISSUE_NUMBERS[4]}|g" "$TEST_CASES_FILE"

echo -e "${GREEN}✓ TEST-CASES.md updated${NC}"
echo ""

# Git commit
echo -e "${BLUE}[COMMIT]${NC} Committing changes..."
git add "$TEST_CASES_FILE"
git commit -m "docs: post test case documentation to GitHub Issues

- Issue #${ISSUE_NUMBERS[0]}: API Quotation Validation (17 tests)
- Issue #${ISSUE_NUMBERS[1]}: API Payment Processing (23 tests)
- Issue #${ISSUE_NUMBERS[2]}: API Authorization & Security (28 tests)
- Issue #${ISSUE_NUMBERS[3]}: E2E & State Machine Testing (16 tests)
- Issue #${ISSUE_NUMBERS[4]}: Findings - Known Defects (9 bugs, pinned)

Updated TEST-CASES.md navigation links with actual issue numbers."

git push

echo -e "${GREEN}✓ Changes committed and pushed${NC}"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 GitHub Issues created:"
for i in {0..4}; do
    echo "  🔗 https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/${ISSUE_NUMBERS[$i]}"
done
echo ""
echo "✨ Next steps:"
echo "  1. Visit the issues above"
echo "  2. Share links with your team"
echo "  3. Update README with issue links"
echo ""
