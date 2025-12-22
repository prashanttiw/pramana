
// This is a temporary script to generate valid test data
const { generateVerhoeff } = require('./dist/utils/verhoeff');
// We need to implement a calc for GSTIN locally to print one
const { validateGSTCheckDigit } = require('./dist/utils/mod36');

console.log('Valid Aadhaar Base 99999999001:', generateVerhoeff('99999999001'));

// For GSTIN, we implemented check logic but not generate logic.
// We can brute force the check digit for '29ABCDE1234F1Z'
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base = '29ABCDE1234F1Z';

// Need to import validateGSTCheckDigit but it's typescript source.
// Can't run blindly. 
