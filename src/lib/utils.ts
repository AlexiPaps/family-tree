/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate age difference in whole years between two dates
 */
export function getAgeDifferenceInYears(olderDate: string, youngerDate: string): number {
    const older = new Date(olderDate);
    const younger = new Date(youngerDate);

    let years = younger.getFullYear() - older.getFullYear();
    const monthDiff = younger.getMonth() - older.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && younger.getDate() < older.getDate())) {
        years--;
    }

    return years;
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date > today;
}

/**
 * Check if a string is a valid date
 */
export function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
