import * as yup from 'yup';
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

type PramanaYupMethod = (this: yup.StringSchema, message?: string) => yup.StringSchema;
type PramanaValidator = (value: unknown) => boolean;

const createMethod = (
    testName: string,
    defaultMessage: string,
    validator: PramanaValidator,
): PramanaYupMethod => {
    return function pramanaStringMethod(
        this: yup.StringSchema,
        message = defaultMessage,
    ): yup.StringSchema {
        return this.test(testName, message, (value) => {
            if (!value) return true;
            return validator(value);
        });
    };
};

export function aadhaarMethod(message = 'Invalid Aadhaar number'): PramanaYupMethod {
    return createMethod('pramana-aadhaar', message, isValidAadhaar);
}

export function panMethod(message = 'Invalid PAN number'): PramanaYupMethod {
    return createMethod('pramana-pan', message, isValidPAN);
}

export function gstinMethod(message = 'Invalid GSTIN'): PramanaYupMethod {
    return createMethod('pramana-gstin', message, isValidGSTIN);
}

export function ifscMethod(message = 'Invalid IFSC code'): PramanaYupMethod {
    return createMethod('pramana-ifsc', message, isValidIFSC);
}

export function pincodeMethod(message = 'Invalid pincode'): PramanaYupMethod {
    return createMethod('pramana-pincode', message, isValidPincode);
}

export function tanMethod(message = 'Invalid TAN'): PramanaYupMethod {
    return createMethod('pramana-tan', message, isValidTAN);
}

export function uanMethod(message = 'Invalid UAN'): PramanaYupMethod {
    return createMethod('pramana-uan', message, isValidUAN);
}

export function voterIdMethod(message = 'Invalid voter ID'): PramanaYupMethod {
    return createMethod('pramana-voter-id', message, isValidVoterID);
}

export function dlMethod(message = 'Invalid driving license'): PramanaYupMethod {
    return createMethod('pramana-dl', message, isValidDrivingLicense);
}

export function passportMethod(message = 'Invalid passport number'): PramanaYupMethod {
    return createMethod('pramana-passport', message, isValidPassport);
}

export function upiMethod(message = 'Invalid UPI ID'): PramanaYupMethod {
    return createMethod('pramana-upi', message, isValidUPI);
}

export function phoneMethod(message = 'Invalid Indian phone number'): PramanaYupMethod {
    return createMethod('pramana-phone', message, isValidIndianPhone);
}

export function msmeMethod(message = 'Invalid MSME number'): PramanaYupMethod {
    return createMethod('pramana-msme', message, isValidMSME);
}

/**
 * @example
 * import * as yup from 'yup'
 * import { setupPramanaYup } from '@prashanttiw/pramana/yup'
 * setupPramanaYup()
 *
 * const KYCSchema = yup.object({
 *   name: yup.string().required(),
 *   aadhaar: yup.string().required().aadhaar(),
 *   pan: yup.string().required().pan(),
 *   gstin: yup.string().gstin(),  // optional field
 * })
 */
export function setupPramanaYup(): void {
    yup.addMethod(yup.string, 'aadhaar', aadhaarMethod());
    yup.addMethod(yup.string, 'pan', panMethod());
    yup.addMethod(yup.string, 'gstin', gstinMethod());
    yup.addMethod(yup.string, 'ifsc', ifscMethod());
    yup.addMethod(yup.string, 'pincode', pincodeMethod());
    yup.addMethod(yup.string, 'tan', tanMethod());
    yup.addMethod(yup.string, 'uan', uanMethod());
    yup.addMethod(yup.string, 'voterId', voterIdMethod());
    yup.addMethod(yup.string, 'dl', dlMethod());
    yup.addMethod(yup.string, 'passport', passportMethod());
    yup.addMethod(yup.string, 'upi', upiMethod());
    yup.addMethod(yup.string, 'phone', phoneMethod());
    yup.addMethod(yup.string, 'msme', msmeMethod());
}

declare module 'yup' {
    interface StringSchema<
        TType extends yup.Maybe<string> = string | undefined,
        TContext = yup.AnyObject,
        TDefault = undefined,
        TFlags extends yup.Flags = '',
    > {
        aadhaar(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        pan(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        gstin(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        ifsc(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        pincode(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        tan(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        uan(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        voterId(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        dl(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        passport(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        upi(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        phone(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
        msme(message?: string): StringSchema<TType, TContext, TDefault, TFlags>;
    }
}
