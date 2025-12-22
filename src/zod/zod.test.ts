import { describe, it, expect } from 'vitest';
import { aadhaarSchema, panSchema, gstinSchema } from './index';

describe('Zod Adapters', () => {
    it('should validate valid ID via Zod', () => {
        expect(panSchema.safeParse('ABCPE1234F').success).toBe(true);
    });

    it('should return error for invalid ID', () => {
        const result = panSchema.safeParse('ABCDE1234F'); // Invalid 4th char
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid PAN Number');
        }
    });

    // We can rely on core validators logic being tested elsewhere.
    // This just tests the wiring.
});
