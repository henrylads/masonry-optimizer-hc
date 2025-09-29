/**
 * Test helper functions
 */

/**
 * Checks if a number has at least 5 decimal places
 * Handles scientific notation and ensures proper decimal place counting
 */
export const hasCorrectPrecision = (num: number): boolean => {
    // Convert to string, handling scientific notation
    const str = num.toString();
    
    // If in scientific notation, convert to standard decimal
    if (str.includes('e')) {
        const [base, exponent] = str.split('e');
        const exp = parseInt(exponent);
        if (exp < 0) {
            // For negative exponents, we need to add leading zeros
            const absExp = Math.abs(exp);
            const [whole = '0', decimal = ''] = base.replace('.', '').split('');
            const result = `0.${'0'.repeat(absExp - 1)}${whole}${decimal}`;
            const decimalPart = result.split('.')[1] || '';
            return decimalPart.length >= 5;
        }
    }
    
    // For regular numbers, just count decimal places
    const decimalPart = str.split('.')[1] || '';
    return decimalPart.length >= 5;
};

/**
 * Compares two numbers for equality up to 5 decimal places
 * This is sufficient for engineering calculations while allowing for minor floating point differences
 */
export const numbersEqualToFiveDecimals = (a: number, b: number): boolean => {
    const multiplier = Math.pow(10, 5);
    return Math.round(a * multiplier) === Math.round(b * multiplier);
}; 