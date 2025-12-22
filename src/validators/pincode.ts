import { PINCODE_REGIONS } from '../data/pincodes';

/**
 * Validates an Indian Pincode.
 * @param pincode The 6-digit Pincode string.
 * @returns True if valid, false otherwise.
 */
export const isValidPincode = (pincode: string): boolean => {
    // 1. Structure: 6 digits, first digit 1-9
    const regex = /^[1-9][0-9]{5}$/;
    if (!regex.test(pincode)) return false;

    // 2. Knowledge: Check if the Region (first 2 digits) exists in our map
    const regionKey = pincode.substring(0, 2);
    return Object.prototype.hasOwnProperty.call(PINCODE_REGIONS, regionKey);
};
