# Contributing to Pramana 🇮🇳

Welcome to the Pramana project! We're excited that you want to contribute to making validation for Indian identity and financial documents **fast, accurate, and accessible to everyone**.

> **Pramana** (प्रमाण) means "evidence" or "proof" in Sanskrit. Every contribution helps build more accurate, trustworthy validation tools for the Indian context.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Security Vulnerabilities](#security-vulnerabilities)
3. [How Can I Contribute?](#how-can-i-contribute)
4. [Development Setup](#development-setup)
5. [Making Changes](#making-changes)
6. [Commit Guidelines](#commit-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Pull Request Process](#pull-request-process)
9. [Style Guide](#style-guide)
10. [Community](#community)
11. [Recognition](#recognition)
12. [Questions?](#questions)

---

## Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, gender identity, experience level, nationality, personal appearance, race, religion, sexual identity, or sexual orientation.

### Expected Behavior

- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing opinions and experiences
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members

### Unacceptable Behavior

- ❌ Harassment, discrimination, or derogatory comments
- ❌ Unwelcome sexual attention or advances
- ❌ Trolling, insulting, or derogatory comments
- ❌ Public or private attacks
- ❌ Publishing others' private information without permission

### Enforcement

Contributors who violate this code of conduct may be temporarily or permanently banned from the project.

**Report violations to:** [maintainer contact information]

---

## Security Vulnerabilities

### Responsible Disclosure

We take security seriously. If you discover a security vulnerability in Pramana, **please do NOT report it publicly** via GitHub issues or discussions.

### How to Report Security Issues

Instead, please email your findings directly to:

📧 **hook.crook1@gmail.com**

Include the following information:

- **Description**: Clear description of the vulnerability
- **Affected Version(s)**: Which version(s) of Pramana are affected?
- **Proof of Concept**: Steps to reproduce or code demonstrating the issue
- **Potential Impact**: What's the severity? Who could be affected?
- **Suggested Fix**: (Optional) If you have a suggested patch

### Security Response Timeline

- **48 hours**: Initial acknowledgment of your report
- **7 days**: Confirmation of the issue and proposed timeline for fix
- **30 days**: Target for releasing a patched version
- **Public Disclosure**: After patch release, we'll publicly acknowledge the fix and credit the reporter

### What Qualifies as a Security Issue?

✅ **Report privately:**
- Algorithm flaws that could lead to invalid validation acceptance
- Checksum bypass techniques
- Input injection vulnerabilities
- Dependency vulnerabilities affecting security

❌ **OK to report publicly:**
- Generic bugs
- Documentation typos
- Test failures
- Performance issues

Thank you for helping keep Pramana secure! 🔒

---

## How Can I Contribute?

### 1. Report Bugs 🐛

Found a bug? Help us fix it!

#### Before Submitting a Bug Report

- Check the [existing issues](https://github.com/prashanttiw/pramana/issues) to avoid duplicates
- Check the [Troubleshooting Guide](#troubleshooting-guide) below
- Gather information about the issue (see below)

#### Submitting a Bug Report

When creating a bug report, please include as much detail as possible:

**Title:** A clear, descriptive title

**Description:** Include the following:

```
### Expected Behavior
What should happen when you use the validator?

### Actual Behavior
What actually happened?

### Steps to Reproduce
1. Step 1
2. Step 2
3. ...

### Environment
- Node.js version: [e.g., 18.x, 20.x]
- npm version: [e.g., 9.x, 10.x]
- pramana version: [e.g., 1.0.0]
- OS: [Windows, macOS, Linux]

### Code Sample
```typescript
// Minimal reproducible example
import { isValidAadhaar } from '@prashanttiw/pramana';
console.log(isValidAadhaar('999999990019')); // What did you expect?
```
```

**Example Bug Report:**

```markdown
### Expected Behavior
isValidAadhaar('123456789012') should return false (invalid checksum)

### Actual Behavior
isValidAadhaar('123456789012') returns true unexpectedly

### Steps to Reproduce
1. Install pramana v1.0.0
2. Import isValidAadhaar
3. Run the validator on '123456789012'
4. Check the result

### Environment
- Node.js: 18.16.0
- npm: 9.6.7
- pramana: 1.0.0
- OS: macOS
```

### 2. Suggest Features or New Validators ✨

Have an idea for a new Indian validator? We'd love to hear it!

#### Before Suggesting a Feature

- Check existing [issues](https://github.com/prashanttiw/pramana/issues) and [discussions](https://github.com/prashanttiw/pramana/discussions)
- Ensure it aligns with Pramana's mission: **accurate validation for Indian-context documents**

#### Suggesting a Feature

**Title:** `[FEATURE] Brief description`

**Description:** Include the following:

```markdown
### Document Type
[e.g., Voter ID (EPIC), Driving License, UAN, CIN, Vehicle RC]

### Description
Clear description of what you want to add and why.

### Motivation
Why is this feature important? What problem does it solve?

### Proposed Implementation
How should it work? Include:
- Algorithm or validation logic needed
- Example inputs/outputs
- Edge cases to handle
- References (official documentation, specs)

### Examples
```typescript
import { isValidEPIC } from '@prashanttiw/pramana';
isValidEPIC('123456789123'); // true/false
```
```

**Example Feature Request:**

```markdown
### Document Type
Voter ID (EPIC) Validation

### Description
Add support for validating Indian Voter IDs (EPIC numbers)

### Motivation
Many Indian applications need to validate voter IDs. Currently no validator exists.

### Proposed Implementation
EPIC Structure: 3 letters (State code) + 7 digits (Unique identifier)
Algorithm: Pattern-based with state code validation

### Examples
EPIC Format: ABC1234567 where:
- ABC = State code (valid states: all 28 states)
- 1234567 = Serial number
```

### 3. Submit Code (Pull Requests) 🚀

#### Types of Contributions We Accept

- ✅ New validators for Indian documents (Voter ID, Driving License, etc.)
- ✅ Bug fixes with test coverage
- ✅ Performance improvements
- ✅ Documentation improvements
- ✅ Test coverage enhancements
- ✅ Build system improvements

#### Not Accepting

- ❌ Validators for non-Indian documents
- ❌ Code without comprehensive tests
- ❌ Changes without proper documentation
- ❌ PR without proper commit messages

---

## Development Setup

### Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Basic TypeScript knowledge**

### Step 1: Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/pramana.git
cd pramana
```

### Step 2: Add Upstream Remote

```bash
# Add the original repo as upstream
git remote add upstream https://github.com/prashanttiw/pramana.git
git fetch upstream
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Verify Setup

```bash
# Run tests
npm test

# Type check
npm run lint

# Build
npm run build
```

You should see:
- ✅ 86 tests passing
- ✅ 0 TypeScript errors
- ✅ Build output in `dist/`

### Step 5: Testing Locally in Your App

Before submitting a PR, test your changes in a real application using `npm link`:

```bash
# In the Pramana directory, create a global symlink
cd /path/to/pramana
npm link

# In your test app directory, link Pramana
cd /path/to/your-test-app
npm link @prashanttiw/pramana

# Now your app uses your local Pramana build
import { isValidAadhaar } from '@prashanttiw/pramana';

# After testing, unlink to restore npm registry version
npm unlink @prashanttiw/pramana
cd /path/to/pramana
npm unlink
```

**Why test locally?**
- Catch integration issues before PR
- Verify the validator works in real-world scenarios
- Test both CommonJS and ES Module imports
- Ensure no unexpected side effects

---

## Making Changes

### Create a Feature Branch

```bash
# Create and checkout a new branch
git checkout -b feat/your-feature-name
```

**Branch naming convention:**
- `feat/new-validator-epic` - New feature
- `fix/aadhaar-validation-bug` - Bug fix
- `docs/update-readme` - Documentation
- `test/add-edge-cases` - Test improvements
- `perf/optimize-gstin-validation` - Performance

### Project Structure

```
src/
├── validators/           # Business logic
│   ├── aadhaar.ts       # Aadhaar validator
│   ├── pan.ts           # PAN validator
│   ├── gstin.ts         # GSTIN validator
│   ├── ifsc.ts          # IFSC validator
│   ├── pincode.ts       # Pincode validator
│   └── index.ts         # Exports
├── utils/               # Core algorithms
│   ├── verhoeff.ts      # Verhoeff algorithm
│   ├── checksum.ts      # Luhn algorithm
│   ├── mod36.ts         # Mod-36 algorithm
│   └── index.ts         # Exports
├── data/                # Reference data
│   ├── banks.ts         # Bank codes
│   ├── gst_states.ts    # GST state codes
│   ├── pincodes.ts      # Postal circles
│   └── index.ts         # Exports
├── zod/                 # Zod schema integration
│   └── index.ts         # Zod schemas
└── index.ts             # Main entry point
```

---

## Commit Guidelines

We use **Conventional Commits** for clear, semantic version control.

### SemVer & Automatic Versioning

Pramana strictly follows **Semantic Versioning (SemVer)**:

```
MAJOR.MINOR.PATCH
X.Y.Z
```

**Version bumping is automated based on commit types:**

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor (0.1.0 → 0.2.0) | New validator added |
| `fix:` | Patch (0.1.0 → 0.1.1) | Bug fix |
| `feat!:` or `BREAKING CHANGE:` | Major (0.1.0 → 1.0.0) | API change |
| `docs:`, `test:`, `chore:` | No version bump | Documentation updates |

**What this means:**
- ✅ Always use the correct commit type
- ✅ Breaking changes must be marked with `!` or footer
- ✅ This enables automated release workflows
- ✅ Semantic versioning builds trust with users

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Purpose | Example |
|------|---------|---------|
| **feat** | New feature/validator | `feat(validators): add voter-id validator` |
| **fix** | Bug fix | `fix(aadhaar): handle null input correctly` |
| **docs** | Documentation changes | `docs(readme): update installation instructions` |
| **test** | Test additions/updates | `test(gstin): add edge case tests` |
| **perf** | Performance improvements | `perf(verhoeff): optimize algorithm` |
| **refactor** | Code refactoring | `refactor(utils): simplify checksum logic` |
| **style** | Formatting/linting | `style: fix eslint violations` |
| **chore** | Build/tooling | `chore: update typescript version` |

### Scope

The scope should specify what part of the codebase is affected:
- `validators`
- `utils`
- `zod`
- `data`
- `build`
- `deps`

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Max 50 characters

### Examples

```bash
# Good
git commit -m "feat(validators): add epic voter id validator with pattern validation"

git commit -m "fix(aadhaar): reject inputs with leading zeros"

git commit -m "test(pincode): add edge cases for 99xxxx region"

git commit -m "docs(contributing): update development setup instructions"

git commit -m "perf(mod36): optimize weight calculation with lookup table"
```

```bash
# Bad
git commit -m "Fixed bug"
git commit -m "Updated stuff"
git commit -m "added new feature" # No scope
git commit -m "feat(validators): Add Epic Voter Id Validator." # Capitalized, period
```

---

## Testing Requirements

### ✅ Critical: 100% Test Coverage Required

**No PR will be merged without test coverage for new code.**

### What Needs Tests

1. **New Validators**: All logic paths must be tested
2. **Bug Fixes**: Add test case that demonstrates the bug, then fix it
3. **Utility Functions**: All edge cases covered
4. **Data Helpers**: All branches tested

### Test File Structure

Create tests in the same directory as the source file:

```
src/validators/epic.ts       # Source
src/validators/epic.test.ts  # Tests
```

### Writing Tests

We use **Vitest**. Here's the template:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEPIC } from './epic';

describe('isValidEPIC', () => {
  // Valid cases
  it('should accept valid EPIC numbers', () => {
    expect(isValidEPIC('ABC1234567')).toBe(true);
  });

  // Invalid format
  it('should reject invalid format', () => {
    expect(isValidEPIC('12345678901')).toBe(false);
    expect(isValidEPIC('ABCD123456')).toBe(false);
  });

  // Null/undefined handling
  it('should reject null and undefined', () => {
    expect(isValidEPIC(null)).toBe(false);
    expect(isValidEPIC(undefined)).toBe(false);
  });

  // Type safety
  it('should reject non-string inputs', () => {
    expect(isValidEPIC(12345678901 as any)).toBe(false);
    expect(isValidEPIC({} as any)).toBe(false);
    expect(isValidEPIC([] as any)).toBe(false);
  });

  // Edge cases
  it('should reject empty strings', () => {
    expect(isValidEPIC('')).toBe(false);
  });

  it('should reject whitespace', () => {
    expect(isValidEPIC('ABC 1234567')).toBe(false);
    expect(isValidEPIC('ABC1234567\n')).toBe(false);
  });

  // Invalid state codes
  it('should reject invalid state codes', () => {
    expect(isValidEPIC('XYZ1234567')).toBe(false);
  });

  // Checksum validation (if applicable)
  it('should validate checksum correctly', () => {
    expect(isValidEPIC('ABC1234566')).toBe(false); // Wrong checksum
    expect(isValidEPIC('ABC1234567')).toBe(true);  // Correct checksum
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test epic.test.ts

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Check coverage
npm test -- --coverage
```

### Test Coverage Threshold

- **Lines**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Statements**: 100%

---

## Pull Request Process

### Step 1: Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### Step 2: Push Your Changes

```bash
# Make sure your code is clean
npm run lint
npm test

# Push to your fork
git push origin feat/your-feature-name
```

### Step 3: Open a Pull Request

Go to https://github.com/prashanttiw/pramana and create a PR.

**Title Format:**
```
[TYPE] Brief description

feat: Add voter ID validator
fix: Handle null input in aadhaar validator
docs: Update installation guide
```

**Description Template:**

```markdown
## Description
What does this PR do? Explain the changes clearly.

## Type of Change
- [ ] New validator
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement
- [ ] Test coverage
- [ ] Other (describe)

## Related Issue
Fixes #123 (if applicable)

## How to Test
Steps to verify the changes work:
1. Step 1
2. Step 2

## Checklist
- [ ] I have read the CONTRIBUTING guide
- [ ] My code follows the style guidelines
- [ ] I have added tests (100% coverage)
- [ ] All tests pass (`npm test`)
- [ ] TypeScript checks pass (`npm run lint`)
- [ ] I have updated documentation if needed
- [ ] My commit messages follow Conventional Commits
- [ ] No breaking changes (or documented if there are)
- [ ] I have tested locally using `npm link` (for new validators)
- [ ] **License Agreement**: By submitting this PR, I agree that my contributions will be licensed under the project's **ISC License**

## Screenshots (if applicable)
<!-- Add screenshots for documentation/UI changes -->
```

### Step 4: Review Process

1. **Automated Checks** (GitHub Actions)
   - ✅ All tests pass
   - ✅ TypeScript linting passes
   - ✅ Code coverage maintained at 100%

2. **Code Review**
   - At least 1 maintainer review required
   - May request changes, improvements, or tests
   - Be responsive to feedback

3. **Approval & Merge**
   - Once approved, maintainer will merge your PR
   - Your contribution will be credited

---

## Style Guide

### TypeScript Standards

#### 1. Type Safety

```typescript
// ✅ Good: Explicit types
export const isValidAadhaar = (input: any): boolean => {
  if (input == null) return false;
  if (typeof input !== 'string') return false;
  // ... validation logic
  return true;
};

// ❌ Bad: Implicit any
export const isValidAadhaar = (input) => {
  // ...
};
```

#### 2. Null/Undefined Checks

Always guard against null/undefined:

```typescript
// ✅ Good
if (input == null) return false;

// ❌ Bad: Allows null to pass
if (input !== '')  return false;
```

#### 3. Input Validation Pattern

```typescript
export const isValidXxx = (input: any): boolean => {
  // Step 1: Type check
  if (input == null) return false;
  if (typeof input !== 'string') return false;

  // Step 2: Format check
  if (!/^[A-Z]{2}[0-9]{4}/.test(input)) return false;

  // Step 3: Checksum validation
  if (!validateChecksum(input)) return false;

  return true;
};
```

#### 4. Documentation

Add JSDoc comments:

```typescript
/**
 * Validates an Indian voter ID (EPIC).
 *
 * @param input - The voter ID to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidEPIC('ABC1234567'); // true
 * isValidEPIC('invalid');     // false
 *
 * @remarks
 * - Validates state code against list of valid states
 * - Checks format: 3 letters + 7 digits
 * - Rejects null, undefined, and non-string inputs
 */
export const isValidEPIC = (input: any): boolean => {
  // ...
};
```

### Code Organization

```typescript
// 1. Imports
import { validateVerhoeff } from '../utils/verhoeff';
import { STATE_CODES } from '../data/states';

// 2. Constants
const EPIC_PATTERN = /^[A-Z]{3}[0-9]{7}$/;

// 3. Helper functions (if needed)
const isValidStateCode = (code: string): boolean => {
  return STATE_CODES.has(code);
};

// 4. Main validator function
export const isValidEPIC = (input: any): boolean => {
  // ...
};

// 5. Info extractor (if applicable)
export const getEPICInfo = (epic: string) => {
  return {
    stateCode: epic.substring(0, 3),
    state: STATE_CODES.get(epic.substring(0, 3)),
  };
};
```

### Error Handling

```typescript
// ✅ Return false, don't throw
if (!isValidInput) {
  return false; // Safe
}

// ❌ Avoid throwing errors
if (!isValidInput) {
  throw new Error('Invalid input'); // Unsafe in validation library
}
```

### Naming Conventions

```typescript
// ✅ Good
isValidAadhaar()     // Function: verb + Noun
getGSTINInfo()       // Info extractor
validateVerhoeff()   // Validation helper
STATE_CODES          // Constants: UPPER_CASE
stateCode            // Variables: camelCase
EPIC_PATTERN         // Regex: UPPER_CASE

// ❌ Bad
checkAadhaar()       // Use "isValid" prefix
getAadhaarInfo       // Be specific
validate()           // Be specific
state_code           // snake_case not used
epicRegex            // Not uppercase for constants
```

---

## Recognition

We believe in recognizing all contributions, big and small.

### Contributors

All contributors will be:
- ✅ Credited in the [CONTRIBUTORS.md](./CONTRIBUTORS.md) file
- ✅ Listed in the GitHub contributors section
- ✅ Mentioned in release notes for significant contributions
- ✅ Added to npm package as a contributor (if applicable)

### Recognition Tiers

| Contribution | Recognition |
|--------------|-------------|
| Bug reports | Listed in issue |
| Documentation | CONTRIBUTORS.md + release notes |
| Small fixes | CONTRIBUTORS.md + release notes |
| New validators | CONTRIBUTORS.md + release notes + npm package |
| Major features | CONTRIBUTORS.md + release notes + npm package + special mention |

---

## Questions?

Have questions about contributing?

1. **Check existing docs:**
   - [README.md](./README.md)
   - [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md)
   - [TECHNICAL_CHANGES_SUMMARY.md](./TECHNICAL_CHANGES_SUMMARY.md)

2. **Ask in discussions:**
   - [GitHub Discussions](https://github.com/prashanttiw/pramana/discussions)

3. **Report issues:**
   - [GitHub Issues](https://github.com/prashanttiw/pramana/issues)

---

## Troubleshooting Guide

### Tests Failing After Setup

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test
```

### TypeScript Errors

```bash
# Type check
npm run lint

# May need to reload TypeScript in your editor (VS Code: Cmd+Shift+P > TypeScript: Restart TS Server)
```

### Build Failing

```bash
# Clean and rebuild
npm run build

# Ensure dist/ directory is created
ls dist/
```

### Git Issues

```bash
# Sync with upstream
git fetch upstream
git rebase upstream/main

# Resolve conflicts if any, then force push to your fork
git push origin feat/your-feature-name --force
```

---

## Learning Resources

### Understanding the Validators

- **Aadhaar Validation**: [Verhoeff Algorithm](https://en.wikipedia.org/wiki/Verhoeff_algorithm)
- **PAN Validation**: [PAN Format](https://www.utiitsl.com/eregister/PAN-format.html)
- **GSTIN Validation**: [GST Specification](https://tutorial.gst.gov.in/)
- **IFSC Codes**: [RBI IFSC Database](https://www.rbi.org.in/Scripts/PaymentSystems/ReturnsFrequency.aspx)
- **Postal Circles**: [India Post Postal Codes](https://www.indiapost.gov.in/)

### TypeScript & Testing

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Additional Notes

- **No cryptocurrency/commercial solicitation** in contributions
- **Respect intellectual property** rights
- **Test locally before submitting** PR
- **Keep PRs focused** on single features/fixes
- **Respond to reviews promptly**
- **Thank maintainers for their time** reviewing your work

---

## Thank You! 🙏

Thank you for considering contributing to Pramana. Your work helps make validation better for the entire Indian developer community.

**Happy contributing!**

---

*Last updated: December 23, 2025*
*Pramana is maintained with ❤️ by the community*
