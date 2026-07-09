/**
 * Formatting Utility Functions
 */

/**
 * Format standard numeric values into USD currency representation
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
}

/**
 * Format ISO datetime string to localized string representations
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Format ISO datetime string to localized time representation
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}
