import { useEffect, useState } from "react";

/**
 * Returns a version of `value` that only updates after `delayMs` of no
 * further changes. Keeping this separate from the fetch logic means it's
 * independently testable and reusable for any other debounced input.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
