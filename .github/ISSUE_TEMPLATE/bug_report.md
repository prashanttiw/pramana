---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

# 🐛 Bug Report

## Description

Provide a clear and concise description of the bug. What went wrong?

**Example:** "The `isValidAadhaar()` function returns `true` for an invalid checksum."

---

## Steps to Reproduce

Provide step-by-step instructions to reproduce the issue:

1. Step 1
2. Step 2
3. Step 3
4. ...

**Example:**
1. Install pramana v1.0.0
2. Import `isValidAadhaar` from '@prashanttiw/pramana'
3. Call `isValidAadhaar('999999990018')`
4. Observe the result

---

## Expected Behavior

What should happen? Describe the expected outcome.

**Example:** "The function should return `false` because the checksum is invalid."

---

## Actual Behavior

What actually happens? Describe the actual outcome.

**Example:** "The function returns `true` even though the checksum is invalid."

---

## Environment

Please provide details about your environment:

- **Node.js version:** (e.g., 18.16.0)
- **npm version:** (e.g., 9.6.7)
- **Pramana version:** (e.g., 1.0.0, 1.0.1)
- **Operating System:** (e.g., Windows 11, macOS 13, Ubuntu 22.04)
- **Package Manager:** (npm, yarn, pnpm)

**Example:**
```
- Node.js: 18.16.0
- npm: 9.6.7
- Pramana: 1.0.0
- OS: macOS 13.4
```

---

## Code Sample

Provide a minimal reproducible example (MRE) that demonstrates the bug:

```typescript
import { isValidAadhaar } from '@prashanttiw/pramana';

// This should return false but returns true
const result = isValidAadhaar('999999990018');
console.log(result); // Expected: false, Actual: true
```

**Requirements for MRE:**
- ✅ Minimal: Remove all unnecessary code
- ✅ Reproducible: Others can run it and see the issue
- ✅ Complete: Includes all imports and setup

---

## Additional Context

Add any other context about the problem here:

- **When did you first notice this?** (e.g., "After upgrading from v0.9.0 to v1.0.0")
- **Does this happen consistently?** (e.g., "Only when input is 12 digits", "Always happens")
- **Have you tried any workarounds?** (e.g., "I'm manually validating with regex as a workaround")
- **Related issues:** (e.g., "Related to #123")

---

## Checklist

Before submitting, please verify:

- [ ] I have searched for existing issues to avoid duplicates
- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- [ ] I have provided a clear, concise description
- [ ] I have included steps to reproduce
- [ ] I have provided minimal reproducible example (MRE)
- [ ] I have included environment details
- [ ] I have labeled this issue appropriately

---

## Additional Notes

**Security Issue?**
⚠️ If this is a security vulnerability, **please do NOT post it here publicly**. Instead, email [hook.crook1@gmail.com](mailto:hook.crook1@gmail.com) with:
- Description of the vulnerability
- Affected version(s)
- Proof of concept
- Potential impact
- Suggested fix (optional)

See [Security Vulnerabilities](../CONTRIBUTING.md#security-vulnerabilities) in CONTRIBUTING.md for more details.

---

*Last updated: December 23, 2025*
