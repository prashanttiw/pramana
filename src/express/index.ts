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

export type DocumentType =
    'aadhaar' | 'pan' | 'gstin' | 'ifsc' | 'pincode' |
    'tan' | 'uan' | 'voter-id' | 'dl' | 'passport' |
    'upi' | 'phone' | 'msme';

export type FieldLocation = 'body' | 'query' | 'params';

export interface FieldRule {
    field: string;
    type: DocumentType;
    location?: FieldLocation;
    optional?: boolean;
    message?: string;
}

export interface ValidationError {
    field: string;
    value: unknown;
    message: string;
    type: DocumentType;
}

export interface Request {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
}

export interface Response {
    status: (code: number) => Response;
    json: (body: unknown) => unknown;
}

export type NextFunction = (err?: unknown) => void;

const validatorByType: Record<DocumentType, (value: unknown) => boolean> = {
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

const defaultErrorMessageByType: Record<DocumentType, string> = {
    aadhaar: 'Invalid Aadhaar number',
    pan: 'Invalid PAN number',
    gstin: 'Invalid GSTIN',
    ifsc: 'Invalid IFSC code',
    pincode: 'Invalid pincode',
    tan: 'Invalid TAN',
    uan: 'Invalid UAN',
    'voter-id': 'Invalid voter ID',
    dl: 'Invalid driving license',
    passport: 'Invalid passport number',
    upi: 'Invalid UPI ID',
    phone: 'Invalid Indian phone number',
    msme: 'Invalid MSME number',
};

const getValueFromLocation = (
    req: Request,
    location: FieldLocation,
    field: string,
): unknown => {
    const source = req[location];
    if (!source || typeof source !== 'object') {
        return undefined;
    }

    return source[field];
};

/**
 * @example
 * import express from 'express'
 * import { pramanaMiddleware, validateAadhaar } from '@prashanttiw/pramana/express'
 *
 * const app = express()
 * app.use(express.json())
 *
 * // Validate multiple fields
 * app.post('/api/kyc',
 *   pramanaMiddleware([
 *     { field: 'aadhaar', type: 'aadhaar' },
 *     { field: 'pan', type: 'pan' },
 *     { field: 'gstin', type: 'gstin', optional: true },
 *   ]),
 *   (req, res) => res.json({ success: true })
 * )
 *
 * // Single field shorthand
 * app.post('/api/verify', validateAadhaar(), (req, res) => ...)
 */
export function pramanaMiddleware(
    rules: FieldRule[],
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: ValidationError[] = [];

        for (const rule of rules) {
            const location: FieldLocation = rule.location ?? 'body';
            const value = getValueFromLocation(req, location, rule.field);

            if (value === undefined || value === null) {
                if (rule.optional === true) {
                    continue;
                }

                errors.push({
                    field: rule.field,
                    value,
                    message: rule.message ?? `${rule.field} is required`,
                    type: rule.type,
                });
                continue;
            }

            const validator = validatorByType[rule.type];
            if (!validator(value)) {
                errors.push({
                    field: rule.field,
                    value,
                    message: rule.message ?? defaultErrorMessageByType[rule.type],
                    type: rule.type,
                });
            }
        }

        if (errors.length > 0) {
            res.status(422).json({
                status: 'error',
                message: 'Document validation failed',
                errors,
            });
            return;
        }

        next();
    };
}

export const validateAadhaar = (field = 'aadhaar') =>
    pramanaMiddleware([{ field, type: 'aadhaar' }]);

export const validatePAN = (field = 'pan') =>
    pramanaMiddleware([{ field, type: 'pan' }]);

export const validateGSTIN = (field = 'gstin') =>
    pramanaMiddleware([{ field, type: 'gstin' }]);

export const validateIFSC = (field = 'ifsc') =>
    pramanaMiddleware([{ field, type: 'ifsc' }]);

export const validatePincode = (field = 'pincode') =>
    pramanaMiddleware([{ field, type: 'pincode' }]);

export const validateTAN = (field = 'tan') =>
    pramanaMiddleware([{ field, type: 'tan' }]);

export const validateUAN = (field = 'uan') =>
    pramanaMiddleware([{ field, type: 'uan' }]);

export const validateVoterID = (field = 'voterId') =>
    pramanaMiddleware([{ field, type: 'voter-id' }]);

export const validateDL = (field = 'dl') =>
    pramanaMiddleware([{ field, type: 'dl' }]);

export const validatePassport = (field = 'passport') =>
    pramanaMiddleware([{ field, type: 'passport' }]);

export const validateUPI = (field = 'upi') =>
    pramanaMiddleware([{ field, type: 'upi' }]);

export const validatePhone = (field = 'phone') =>
    pramanaMiddleware([{ field, type: 'phone' }]);

export const validateMSME = (field = 'msme') =>
    pramanaMiddleware([{ field, type: 'msme' }]);
