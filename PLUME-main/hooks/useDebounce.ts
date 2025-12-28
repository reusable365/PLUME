import { useState, useEffect } from 'react';

/**
 * useDebounce - Custom hook for debouncing values
 * 
 * Delays updating a value until a specified delay has passed without changes.
 * Useful for auto-save, search inputs, and API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 5000ms for auto-save)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const debouncedDraft = useDebounce(draftContent, 5000);
 * 
 * useEffect(() => {
 *   if (debouncedDraft) {
 *     saveDraft(debouncedDraft);
 *   }
 * }, [debouncedDraft]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 5000): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Default delays for common use cases
 */
export const DEBOUNCE_DELAYS = {
    AUTO_SAVE: 5000,      // 5 seconds for draft auto-save
    SEARCH: 300,          // 300ms for search inputs
    RESIZE: 150,          // 150ms for resize handlers
    SCROLL: 100,          // 100ms for scroll handlers
} as const;
