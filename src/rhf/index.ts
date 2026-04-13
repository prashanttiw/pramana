import type { FieldErrors, Resolver } from 'react-hook-form';
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
import { suggestCorrection } from '../intelligence/correction';

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

export type PramanaResolverSchema = Record<string, DocumentType>;

type PramanaResolverError = {
    type: string;
    message: string;
};

const DOCUMENT_LABELS: Record<DocumentType, string> = {
    aadhaar: 'Aadhaar',
    pan: 'PAN',
    gstin: 'GSTIN',
    ifsc: 'IFSC',
    pincode: 'Pincode',
    tan: 'TAN',
    uan: 'UAN',
    'voter-id': 'Voter ID',
    dl: 'Driving License',
    passport: 'Passport',
    upi: 'UPI',
    phone: 'Phone',
    msme: 'MSME',
};

const CORRECTION_DOC_TYPE: Partial<Record<DocumentType, string>> = {
    aadhaar: 'aadhaar',
    pan: 'pan',
    gstin: 'gstin',
    ifsc: 'ifsc',
    pincode: 'pincode',
    tan: 'tan',
    uan: 'uan',
    'voter-id': 'voterid',
    passport: 'passport',
    upi: 'upi',
    phone: 'phone',
    msme: 'msme',
};

/**
 * @example
 * import { useForm } from 'react-hook-form'
 * import { pramanaResolver } from '@prashanttiw/pramana/rhf'
 *
 * function KYCForm() {
 *   const { register, handleSubmit, formState: { errors } } = useForm({
 *     resolver: pramanaResolver({
 *       aadhaarNumber: 'aadhaar',
 *       panNumber: 'pan',
 *       gstinNumber: 'gstin',
 *     })
 *   })
 *
 *   return (
 *     <form onSubmit={handleSubmit(data => console.log(data))}>
 *       <input {...register('aadhaarNumber')} />
 *       {errors.aadhaarNumber && <p>{errors.aadhaarNumber.message}</p>}
 *
 *       <input {...register('panNumber')} />
 *       {errors.panNumber && <p>{errors.panNumber.message}</p>}
 *
 *       <button type="submit">Validate KYC</button>
 *     </form>
 *   )
 * }
 */
export function pramanaResolver(schema: PramanaResolverSchema): Resolver<Record<string, unknown>> {
    return (values) => {
        const errors: Record<string, PramanaResolverError> = {};

        for (const [fieldName, documentType] of Object.entries(schema)) {
            const rawValue = values[fieldName];
            if (rawValue == null || rawValue === '') continue;

            const value = typeof rawValue === 'string' ? rawValue : String(rawValue);
            const isValid = runValidator(documentType, value);

            if (!isValid) {
                errors[fieldName] = {
                    type: 'pramana',
                    message: getErrorMessage(documentType, value),
                };
            }
        }

        if (Object.keys(errors).length > 0) {
            return {
                values: {},
                errors: errors as unknown as FieldErrors<Record<string, unknown>>,
            };
        }

        return {
            values,
            errors: {},
        };
    };
}

function runValidator(type: DocumentType, value: string): boolean {
    const validators: Record<DocumentType, (v: unknown) => boolean> = {
        aadhaar: isValidAadhaar,
        pan: isValidPAN,
        gstin: isValidGSTIN,
        ifsc: isValidIFSC,
        pincode: isValidPincode,
        tan: isValidTAN,
        uan: isValidUAN,
        'voter-id': isValidVoterID,
        dl: isValidDrivingLicense,
        passport: isValidPassport,
        upi: isValidUPI,
        phone: isValidIndianPhone,
        msme: isValidMSME,
    };

    return validators[type]?.(value) ?? false;
}

function getErrorMessage(type: DocumentType, value: string): string {
    const correctionDocType = CORRECTION_DOC_TYPE[type];
    if (correctionDocType) {
        const correction = suggestCorrection(correctionDocType, value);
        if (correction.primarySuggestion) {
            return `Invalid ${DOCUMENT_LABELS[type]}. Did you mean ${correction.primarySuggestion}?`;
        }
    }

    return `Invalid ${DOCUMENT_LABELS[type]} number`;
}
