import { describe, it, expect } from 'vitest';
import { aadhaarSchema, panSchema, tanSchema, gstinSchema } from '../../src/zod';

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

    it('should validate TAN schema', () => {
        expect(tanSchema.safeParse('dela12345b').success).toBe(true);
        expect(tanSchema.safeParse('DELA-12345-B').success).toBe(true);
    });

    // We can rely on core validators logic being tested elsewhere.
    // This just tests the wiring.
});
