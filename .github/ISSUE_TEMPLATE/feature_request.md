---
name: Feature Request
about: Suggest a new Indian validator (Voter ID, Driving License, UAN, CIN, etc.)
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

# ✨ Feature Request

## Document Type

What Indian document/ID would you like to validate?

- [ ] Voter ID (EPIC)
- [ ] Driving License (DL)
- [ ] Universal Account Number (UAN)
- [ ] Corporate Identity Number (CIN)
- [ ] Vehicle Registration Number (VRN)
- [ ] Passport Number
- [ ] Other (please specify below)

**Specify:** (e.g., "Voter ID (EPIC)", "Driving License")

---

## Problem Statement

Explain the problem this feature would solve:

- **Is your feature request related to a problem?** Describe it clearly.
  
  *Example: "Many Indian apps need to validate voter IDs, but Pramana doesn't support EPIC validation yet."*

- **What is your use case?** When would you use this validator?
  
  *Example: "We're building a voter registration system that needs to validate EPIC numbers before submission."*

- **Who would benefit?** Are there other developers who might need this?
  
  *Example: "Any Indian app dealing with voting systems, electoral databases, or government integrations."*

---

## Proposed Solution

Describe how the validator should work:

### Format & Structure

What is the format of this document/ID? Break down each component:

```
Example: Voter ID (EPIC)
Format: ABC1234567
- ABC = State code (2-3 letters)
- 1234567 = Unique serial number (7 digits)
- Total: 10 characters
```

### Validation Logic

What rules should the validator follow?

- [ ] Pattern matching (regex)
- [ ] Checksum/mathematical algorithm
- [ ] Whitelist validation (state codes, issuer codes, etc.)
- [ ] Other (describe below)

**Describe the validation rules:**

```
1. Check format: Must be 3 letters + 7 digits
2. Validate state code: Must be in list of 28 valid Indian states
3. No null/undefined/non-string inputs
4. No whitespace or special characters allowed
5. (Optional) Mathematical checksum if applicable
```

### Algorithm Details

If there's a mathematical algorithm, describe it:

```
Example for GSTIN (Mod-36 Checksum):
1. Take first 14 characters
2. Assign weights: 1, 2, 1, 2, ...
3. Multiply each character value by its weight
4. Sum all values
5. Check digit = (36 - (sum % 36)) % 36
```

---

## Example Usage

Show how the validator should be used in code:

```typescript
import { isValidEPIC, getEPICInfo } from '@prashanttiw/pramana';

// Basic validation
isValidEPIC('ABC1234567');        // true (valid)
isValidEPIC('INVALID123');        // false (invalid format)
isValidEPIC('XYZ1234567');        // false (invalid state code)
isValidEPIC(null);                // false (null input)
isValidEPIC('ABC 1234567');       // false (contains whitespace)

// Extract information
const info = getEPICInfo('ABC1234567');
console.log(info.stateCode);      // 'ABC'
console.log(info.state);          // 'Andhra Pradesh' (if mapped)
console.log(info.serialNumber);   // '1234567'
```

### Test Cases

What edge cases should be tested?

```typescript
// Valid cases
- isValidEPIC('ABC1234567') → true
- isValidEPIC('XYZ9876543') → true

// Invalid format
- isValidEPIC('12345678901') → false  (all digits)
- isValidEPIC('ABCDEFGHIJK') → false  (all letters)
- isValidEPIC('ABC12345')   → false   (too short)

// Type/input safety
- isValidEPIC(null)        → false
- isValidEPIC(undefined)   → false
- isValidEPIC(123456)      → false    (number instead of string)
- isValidEPIC({})          → false    (object)

// Edge cases
- isValidEPIC('')          → false    (empty string)
- isValidEPIC('ABC 123456') → false   (whitespace)
- isValidEPIC('abc1234567') → false   (lowercase)
```

---

## Official Specifications

Provide links to official documentation for this document/ID:

- **Government Official Source:** [Insert URL]
  
  *Example: https://www.indiapost.gov.in/*

- **Format Specification:** [Insert URL]
  
  *Example: https://en.wikipedia.org/wiki/Voter_ID_(India)*

- **Validation Rules:** [Insert URL]
  
  *Example: https://election.ec.gov.in/*

- **Algorithm Reference (if applicable):** [Insert URL]
  
  *Example: https://tutorial.gst.gov.in/ (for GSTIN checksum)*

**Important:** Please provide credible, official sources. Government websites, RBI documents, or published standards are preferred.

---

## Implementation Details (Optional)

If you have additional insights:

- **Data Requirements:** Will this need reference data? (e.g., state codes, issuer codes)
  
  *Example: "Yes, need list of valid state codes (28 states)"*

- **Dependencies:** Will this need new dependencies or algorithms?
  
  *Example: "No new dependencies. Can use existing pattern validation."*

- **Performance Considerations:** Any special performance requirements?
  
  *Example: "Must validate <1ms for real-time form validation"*

- **Related Validators:** Does this relate to existing validators?
  
  *Example: "Similar structure to Aadhaar (pattern-based), but simpler"*

---

## Checklist

Before submitting, please verify:

- [ ] I have searched for existing issues/discussions to avoid duplicates
- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- [ ] I have provided a clear document type
- [ ] I have described the problem/use case
- [ ] I have provided format & structure details
- [ ] I have provided validation rules
- [ ] I have shown example usage & test cases
- [ ] I have linked to official specifications
- [ ] This aligns with Pramana's mission (Indian-context validation)

---

## Next Steps

If your feature request is approved:

1. A maintainer will mark it as `accepted`
2. We'll discuss implementation details in comments
3. You (or a contributor) can open a PR with the implementation
4. PR must include:
   - ✅ Complete validator implementation
   - ✅ 100% test coverage
   - ✅ Documentation/JSDoc
   - ✅ Follow existing code patterns
   - ✅ Follow [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines

See [How to Contribute](../CONTRIBUTING.md#3-submit-code-pull-requests-) for detailed PR requirements.

---

## Examples of Great Feature Requests

✅ **Well-structured:**
- Provides official specification links
- Breaks down document format clearly
- Includes example code & test cases
- Links to similar validators
- Explains use case & beneficiaries

❌ **Not helpful:**
- "Add Driving License validation" (too vague)
- No format/structure details
- No test cases
- No official documentation
- No algorithm explanation

---

*Last updated: December 23, 2025*
*For more info, see [CONTRIBUTING.md](../CONTRIBUTING.md) and [README.md](../README.md)*
