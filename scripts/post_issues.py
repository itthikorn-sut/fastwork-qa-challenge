#!/usr/bin/env python3
"""
Automated GitHub Issues poster for test case documentation
Posts 5 test case issues, adds labels, pins findings issue
"""

import subprocess
import json
import os
import sys
import io

# Fix Windows encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REPO = "itthikorn-sut/fastwork-qa-challenge"

# Issue definitions
ISSUES = [
    {
        "num": 1,
        "title": "📋 Test Cases: API — Quotation Validation (TC-QUO-001 to TC-QUO-024)",
        "labels": "documentation,test-cases,api,quotation"
    },
    {
        "num": 2,
        "title": "📋 Test Cases: API — Payment Processing (TC-PAY-001 to TC-PAY-023)",
        "labels": "documentation,test-cases,api,payment"
    },
    {
        "num": 3,
        "title": "📋 Test Cases: API — Authorization & Security (TC-AUTH-* and S-*)",
        "labels": "documentation,test-cases,security,pci-dss,gdpr"
    },
    {
        "num": 4,
        "title": "📋 Test Cases: E2E & State Machine (TC-E2E-*, TC-REJ-*, TC-TER-*)",
        "labels": "documentation,test-cases,e2e,state-machine"
    },
    {
        "num": 5,
        "title": "⚠️ FINDINGS: Known Defects (FINDING-001 through FINDING-006)",
        "labels": "bug,findings,test-documentation"
    }
]

def extract_issue_body(issue_num):
    """Extract issue body from GITHUB-ISSUES.md"""
    with open("docs/GITHUB-ISSUES.md", "r", encoding="utf-8") as f:
        content = f.read()

    # Find issue section
    start_marker = f"## Issue #{issue_num}:"
    if issue_num == 5:
        end_marker = "## Summary"
    else:
        end_marker = f"## Issue #{issue_num + 1}:"

    start_idx = content.find(start_marker)
    if start_idx == -1:
        raise ValueError(f"Could not find issue #{issue_num}")

    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        end_idx = len(content)

    # Extract and clean body
    body = content[start_idx:end_idx]
    # Remove the header line
    lines = body.split('\n')[1:]
    body = '\n'.join(lines).strip()

    return body

def create_issue(title, body, labels):
    """Create issue using gh CLI"""
    cmd = [
        "gh", "issue", "create",
        "--title", title,
        "--body", body,
        "--label", labels,
        "--repo", REPO
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None

    # Extract issue number from URL
    url = result.stdout.strip()
    issue_num = url.split('/')[-1]
    return int(issue_num)

def pin_issue(issue_num):
    """Pin issue to repo"""
    cmd = ["gh", "issue", "pin", str(issue_num), "--repo", REPO]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

def main():
    print("🚀 Starting GitHub Issues automation...")
    print(f"📦 Repository: {REPO}")
    print()

    created_issues = {}

    print("📄 Creating 5 GitHub Issues...")
    print()

    for issue_config in ISSUES:
        issue_num = issue_config["num"]
        title = issue_config["title"]
        labels = issue_config["labels"]

        print(f"[Issue #{issue_num}] {title}")

        try:
            body = extract_issue_body(issue_num)
            github_issue_num = create_issue(title, body, labels)

            if github_issue_num:
                created_issues[issue_num] = github_issue_num
                print(f"✓ Created Issue #{github_issue_num}")
            else:
                print(f"✗ Failed to create issue")
                return 1
        except Exception as e:
            print(f"✗ Error: {e}")
            return 1

        print()

    print()
    print("🎯 Created issues:")
    for orig_num, github_num in sorted(created_issues.items()):
        print(f"  Issue #{github_num}: {ISSUES[orig_num-1]['title']}")
    print()

    # Pin findings issue
    findings_issue = created_issues[5]
    print(f"[PIN] Pinning Issue #{findings_issue} (Findings)")
    if pin_issue(findings_issue):
        print(f"✓ Issue #{findings_issue} pinned")
    else:
        print(f"Note: Could not pin issue (may need additional permissions)")
    print()

    # Update TEST-CASES.md
    print("[UPDATE] Updating TEST-CASES.md with issue numbers...")

    test_cases_file = "automation/tests/TEST-CASES.md"
    with open(test_cases_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace placeholder numbers with actual GitHub issue numbers
    for orig_num, github_num in created_issues.items():
        content = content.replace(f"issues/{orig_num}", f"issues/{github_num}")

    with open(test_cases_file, "w", encoding="utf-8") as f:
        f.write(content)

    print("✓ TEST-CASES.md updated")
    print()

    # Git commit
    print("[COMMIT] Committing changes...")

    commit_body = f"""docs: post test case documentation to GitHub Issues

- Issue #{created_issues[1]}: API Quotation Validation (17 tests)
- Issue #{created_issues[2]}: API Payment Processing (23 tests)
- Issue #{created_issues[3]}: API Authorization & Security (28 tests)
- Issue #{created_issues[4]}: E2E & State Machine Testing (16 tests)
- Issue #{created_issues[5]}: Findings - Known Defects (9 bugs, pinned)

Updated TEST-CASES.md navigation links with actual issue numbers."""

    subprocess.run(["git", "add", test_cases_file], check=True)
    subprocess.run(["git", "commit", "-m", commit_body], check=True)
    subprocess.run(["git", "push"], check=True)

    print("✓ Changes committed and pushed")
    print()

    print("════════════════════════════════════════════════════════════════")
    print("✅ COMPLETE!")
    print("════════════════════════════════════════════════════════════════")
    print()
    print("📋 GitHub Issues created:")
    for orig_num in sorted(created_issues.keys()):
        github_num = created_issues[orig_num]
        print(f"  🔗 https://github.com/itthikorn-sut/fastwork-qa-challenge/issues/{github_num}")
    print()
    print("✨ Next steps:")
    print("  1. Visit the issues above")
    print("  2. Share links with your team")
    print("  3. Start referencing tests in PRs")
    print()

    return 0

if __name__ == "__main__":
    sys.exit(main())
