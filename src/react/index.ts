import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    isValidAadhaar,
    isValidPAN,
    isValidGSTIN,
    isValidIFSC,
    isValidPincode,
    isValidTAN,
    isValidUAN,
    isValidVoterID,
    isValidDrivingLicense,
    isValidPassport,
    isValidUPI,
    isValidIndianPhone,
    isValidMSME,
} from '../validators';
import { detectFraudSignals, type FraudRisk } from '../intelligence/fraudSignals';
import { validateKYCBundle, type KYCBundleInput, type KYCBundleResult } from '../intelligence/kycBundle';

export type DocumentType =
    | 'aadhaar'
    | 'pan'
    | 'gstin'
    | 'ifsc'
    | 'pincode'
    | 'tan'
    | 'uan'
    | 'voter-id'
    | 'dl'
    | 'passport'
    | 'upi'
    | 'phone'
    | 'msme';

export type ValidatorState = {
    value: string;
    isValid: boolean | null;
    error: string | null;
    isTouched: boolean;
    fraudRisk: FraudRisk | null;
};

export interface UseValidatorOptions {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    detectFraud?: boolean;
    debounceMs?: number;
}

type ValidationResolver = {
    validate: (value: string) => boolean;
    errorMessage: string;
    requiredMessage: string;
    fraudType: string;
};

const validationResolverByType: Record<DocumentType, ValidationResolver> = {
    aadhaar: {
        validate: isValidAadhaar,
        errorMessage: 'Invalid Aadhaar number',
        requiredMessage: 'Aadhaar is required',
        fraudType: 'aadhaar',
    },
    pan: {
        validate: isValidPAN,
        errorMessage: 'Invalid PAN number',
        requiredMessage: 'PAN is required',
        fraudType: 'pan',
    },
    gstin: {
        validate: isValidGSTIN,
        errorMessage: 'Invalid GSTIN',
        requiredMessage: 'GSTIN is required',
        fraudType: 'gstin',
    },
    ifsc: {
        validate: isValidIFSC,
        errorMessage: 'Invalid IFSC code',
        requiredMessage: 'IFSC is required',
        fraudType: 'ifsc',
    },
    pincode: {
        validate: isValidPincode,
        errorMessage: 'Invalid pincode',
        requiredMessage: 'Pincode is required',
        fraudType: 'pincode',
    },
    tan: {
        validate: isValidTAN,
        errorMessage: 'Invalid TAN',
        requiredMessage: 'TAN is required',
        fraudType: 'tan',
    },
    uan: {
        validate: isValidUAN,
        errorMessage: 'Invalid UAN',
        requiredMessage: 'UAN is required',
        fraudType: 'uan',
    },
    'voter-id': {
        validate: isValidVoterID,
        errorMessage: 'Invalid voter ID',
        requiredMessage: 'Voter ID is required',
        fraudType: 'voterid',
    },
    dl: {
        validate: isValidDrivingLicense,
        errorMessage: 'Invalid driving license',
        requiredMessage: 'Driving License is required',
        fraudType: 'drivinglicense',
    },
    passport: {
        validate: isValidPassport,
        errorMessage: 'Invalid passport number',
        requiredMessage: 'Passport is required',
        fraudType: 'passport',
    },
    upi: {
        validate: isValidUPI,
        errorMessage: 'Invalid UPI ID',
        requiredMessage: 'UPI ID is required',
        fraudType: 'upi',
    },
    phone: {
        validate: isValidIndianPhone,
        errorMessage: 'Invalid Indian phone number',
        requiredMessage: 'Phone number is required',
        fraudType: 'phone',
    },
    msme: {
        validate: isValidMSME,
        errorMessage: 'Invalid MSME number',
        requiredMessage: 'MSME number is required',
        fraudType: 'msme',
    },
};

const createInitialState = (): ValidatorState => ({
    value: '',
    isValid: null,
    error: null,
    isTouched: false,
    fraudRisk: null,
});

/**
 * @example
 * import { useValidator } from '@prashanttiw/pramana/react'
 *
 * function AadhaarInput() {
 *   const { isValid, error, inputProps } = useValidator('aadhaar', {
 *     validateOnChange: true,
 *     detectFraud: true,
 *   })
 *
 *   return (
 *     <div>
 *       <input placeholder="Enter Aadhaar" {...inputProps} />
 *       {error && <span style={{ color: 'red' }}>{error}</span>}
 *       {isValid && <span style={{ color: 'green' }}>Valid</span>}
 *     </div>
 *   )
 * }
 */
export function useValidator(documentType: DocumentType, options?: UseValidatorOptions) {
    const validateOnChange = options?.validateOnChange ?? true;
    const validateOnBlur = options?.validateOnBlur ?? true;
    const detectFraud = options?.detectFraud ?? false;
    const debounceMs = options?.debounceMs ?? 300;

    const [state, setState] = useState<ValidatorState>(createInitialState);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestValueRef = useRef<string>('');

    const runValidation = useCallback((value: string, markTouched: boolean) => {
        const resolver = validationResolverByType[documentType];

        setState((prev) => {
            const touched = markTouched || prev.isTouched;
            const normalized = value.trim();
            let isValid: boolean | null = null;
            let error: string | null = null;
            let fraudRisk: FraudRisk | null = null;

            if (normalized.length === 0) {
                if (touched) {
                    isValid = false;
                    error = resolver.requiredMessage;
                }
            } else {
                isValid = resolver.validate(value);
                error = isValid ? null : resolver.errorMessage;

                if (detectFraud && isValid) {
                    fraudRisk = detectFraudSignals(resolver.fraudType, value).risk;
                }
            }

            return {
                ...prev,
                value,
                isTouched: touched,
                isValid,
                error,
                fraudRisk,
            };
        });
    }, [detectFraud, documentType]);

    const validate = useCallback((value: string = latestValueRef.current) => {
        latestValueRef.current = value;
        runValidation(value, true);
    }, [runValidation]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        latestValueRef.current = value;

        setState((prev) => ({
            ...prev,
            value,
        }));

        if (!validateOnChange) return;

        if (debounceRef.current != null) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            runValidation(value, false);
        }, debounceMs);
    }, [debounceMs, runValidation, validateOnChange]);

    const handleBlur = useCallback(() => {
        if (debounceRef.current != null) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        if (validateOnBlur) {
            runValidation(latestValueRef.current, true);
            return;
        }

        setState((prev) => ({
            ...prev,
            isTouched: true,
        }));
    }, [runValidation, validateOnBlur]);

    const reset = useCallback(() => {
        if (debounceRef.current != null) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        latestValueRef.current = '';
        setState(createInitialState());
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current != null) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        value: state.value,
        isValid: state.isValid,
        error: state.error,
        isTouched: state.isTouched,
        fraudRisk: state.fraudRisk,
        validate,
        handleChange,
        handleBlur,
        reset,
        inputProps: {
            value: state.value,
            onChange: handleChange,
            onBlur: handleBlur,
        },
    };
}

export function useKYCValidator() {
    const [bundle, setBundle] = useState<KYCBundleInput>({});
    const [result, setResult] = useState<KYCBundleResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const setDocument = useCallback((type: string, value: string) => {
        setBundle((prev) => ({
            ...prev,
            [type]: value,
        } as KYCBundleInput));
    }, []);

    const validate = useCallback(() => {
        setIsValidating(true);
        const validationResult = validateKYCBundle(bundle);
        setResult(validationResult);
        setIsValidating(false);
    }, [bundle]);

    return {
        bundle,
        setDocument,
        validate,
        result,
        isValidating,
    };
}
