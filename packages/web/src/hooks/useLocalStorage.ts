import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, (value: SetValue<T>) => void, () => void] {
  // Custom serialization functions
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        window.localStorage.setItem(key, serialize(valueToStore));
        
        // Dispatch storage event for other tabs
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: serialize(valueToStore),
            url: window.location.href,
            storageArea: window.localStorage,
          })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      // Dispatch storage event for other tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: null,
          url: window.location.href,
          storageArea: window.localStorage,
        })
      );
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, deserialize]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common types
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean
): [boolean, (value: SetValue<boolean>) => void, () => void] {
  return useLocalStorage<boolean>(key, initialValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => value === 'true',
  });
}

export function useLocalStorageNumber(
  key: string,
  initialValue: number
): [number, (value: SetValue<number>) => void, () => void] {
  return useLocalStorage<number>(key, initialValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => parseFloat(value),
  });
}

// Hook for storing complex objects with versioning
export function useLocalStorageWithVersion<T>(
  key: string,
  initialValue: T,
  version: number
): [T, (value: SetValue<T>) => void, () => void] {
  type VersionedData = {
    version: number;
    data: T;
  };

  const [data, setData, removeData] = useLocalStorage<VersionedData>(
    key,
    { version, data: initialValue }
  );

  // If version doesn't match, reset to initial value
  useEffect(() => {
    if (data.version !== version) {
      setData({ version, data: initialValue });
    }
  }, [data.version, version, initialValue, setData]);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      setData((prevValue) => ({
        version,
        data: value instanceof Function ? value(prevValue.data) : value,
      }));
    },
    [setData, version]
  );

  return [data.data, setValue, removeData];
}