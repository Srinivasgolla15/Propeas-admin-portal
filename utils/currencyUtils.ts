/**
 * Formats a number as Indian Rupees (INR)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted currency string with ₹ symbol
 */
export const formatINR = (amount: number, decimals: number = 2): string => {
  if (isNaN(amount)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Converts a formatted currency string back to a number
 * @param currencyString - The formatted currency string (e.g., "₹1,23,456.78")
 * @returns The numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  // Remove all non-numeric characters except decimal point
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
};
