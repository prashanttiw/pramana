// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateVerhoeff } from '../src/utils/verhoeff';
import { useKYCValidator, useValidator } from '../src/react';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;
const VALID_AADHAAR = buildAadhaar('28473910582');
const INVALID_AADHAAR = '999999990018';
const VALID_PAN = 'ABCPE1234F';

const inputChangeEvent = (value: string) => ({
    target: { value },
}) as any;

afterEach(() => {
    vi.useRealTimers();
});

describe('React hooks integration', () => {
    it('useValidator(aadhaar) starts with empty value', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        expect(result.current.value).toBe('');
    });

    it('useValidator(aadhaar) starts as not yet validated', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        expect(result.current.isValid).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isTouched).toBe(false);
        expect(result.current.fraudRisk).toBeNull();
    });

    it('validate(validAadhaar) sets isValid true and clears error', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        act(() => {
            result.current.validate(VALID_AADHAAR);
        });

        expect(result.current.isValid).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.value).toBe(VALID_AADHAAR);
    });

    it('validate(invalidAadhaar) sets isValid false with message', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        act(() => {
            result.current.validate(INVALID_AADHAAR);
        });

        expect(result.current.isValid).toBe(false);
        expect(result.current.error).toContain('Invalid Aadhaar');
    });

    it('validate() marks field as touched', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        act(() => {
            result.current.validate(INVALID_AADHAAR);
        });

        expect(result.current.isTouched).toBe(true);
    });

    it('handleBlur marks touched when validateOnBlur is false', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { validateOnBlur: false }));
        act(() => {
            result.current.handleBlur();
        });
        expect(result.current.isTouched).toBe(true);
        expect(result.current.isValid).toBeNull();
    });

    it('handleBlur triggers validation when validateOnBlur is true', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { validateOnChange: false }));

        act(() => {
            result.current.handleChange(inputChangeEvent(INVALID_AADHAAR));
            result.current.handleBlur();
        });

        expect(result.current.isTouched).toBe(true);
        expect(result.current.isValid).toBe(false);
    });

    it('handleChange updates the current value', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { validateOnChange: false }));
        act(() => {
            result.current.handleChange(inputChangeEvent(VALID_AADHAAR));
        });
        expect(result.current.value).toBe(VALID_AADHAAR);
    });

    it('debounce does not validate immediately on change', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useValidator('aadhaar', { debounceMs: 300 }));

        act(() => {
            result.current.handleChange(inputChangeEvent(INVALID_AADHAAR));
        });

        expect(result.current.isValid).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('debounce validates after configured delay', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useValidator('aadhaar', { debounceMs: 300 }));

        act(() => {
            result.current.handleChange(inputChangeEvent(INVALID_AADHAAR));
        });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current.isValid).toBe(false);
        expect(result.current.error).toContain('Invalid Aadhaar');
    });

    it('rapid changes keep only latest debounced validation result', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useValidator('aadhaar', { debounceMs: 300 }));

        act(() => {
            result.current.handleChange(inputChangeEvent(INVALID_AADHAAR));
            result.current.handleChange(inputChangeEvent(VALID_AADHAAR));
        });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current.value).toBe(VALID_AADHAAR);
        expect(result.current.isValid).toBe(true);
    });

    it('validateOnChange=false prevents automatic debounce validation', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useValidator('aadhaar', {
            validateOnChange: false,
            debounceMs: 100,
        }));

        act(() => {
            result.current.handleChange(inputChangeEvent(INVALID_AADHAAR));
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(result.current.isValid).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('reset() restores initial state after a valid value', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        act(() => {
            result.current.validate(VALID_AADHAAR);
            result.current.reset();
        });

        expect(result.current.value).toBe('');
        expect(result.current.isValid).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isTouched).toBe(false);
    });

    it('reset() restores initial state after an invalid touched flow', () => {
        const { result } = renderHook(() => useValidator('aadhaar'));
        act(() => {
            result.current.validate(INVALID_AADHAAR);
            result.current.reset();
        });

        expect(result.current.value).toBe('');
        expect(result.current.isValid).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.fraudRisk).toBeNull();
    });

    it('detectFraud=false keeps fraudRisk null', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { detectFraud: false }));
        act(() => {
            result.current.validate(VALID_AADHAAR);
        });

        expect(result.current.isValid).toBe(true);
        expect(result.current.fraudRisk).toBeNull();
    });

    it('detectFraud=true populates fraudRisk for valid value', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { detectFraud: true }));
        act(() => {
            result.current.validate(VALID_AADHAAR);
        });

        expect(result.current.isValid).toBe(true);
        expect(result.current.fraudRisk).not.toBeNull();
    });

    it('detectFraud=true keeps fraudRisk null for invalid value', () => {
        const { result } = renderHook(() => useValidator('aadhaar', { detectFraud: true }));
        act(() => {
            result.current.validate(INVALID_AADHAAR);
        });

        expect(result.current.isValid).toBe(false);
        expect(result.current.fraudRisk).toBeNull();
    });

    it('useKYCValidator starts with empty bundle and null result', () => {
        const { result } = renderHook(() => useKYCValidator());
        expect(result.current.bundle).toEqual({});
        expect(result.current.result).toBeNull();
        expect(result.current.isValidating).toBe(false);
    });

    it('useKYCValidator setDocument updates bundle', () => {
        const { result } = renderHook(() => useKYCValidator());
        act(() => {
            result.current.setDocument('aadhaar', VALID_AADHAAR);
            result.current.setDocument('pan', VALID_PAN);
        });

        expect(result.current.bundle.aadhaar).toBe(VALID_AADHAAR);
        expect(result.current.bundle.pan).toBe(VALID_PAN);
    });

    it('useKYCValidator validate() populates result and resets isValidating', () => {
        const { result } = renderHook(() => useKYCValidator());
        act(() => {
            result.current.setDocument('aadhaar', VALID_AADHAAR);
            result.current.setDocument('pan', VALID_PAN);
            result.current.validate();
        });

        expect(result.current.result).not.toBeNull();
        expect(result.current.isValidating).toBe(false);
    });
});
