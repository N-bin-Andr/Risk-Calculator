import { useState, useEffect } from 'react';

/**
 * Хук для дебаунса значения
 * @param value Значение, которое нужно дебаунсить
 * @param delay Задержка в миллисекундах
 * @returns Дебауншенное значение
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления дебауншенного значения
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при каждом изменении value или delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Хук для дебаунса функции обратного вызова
 * @param callback Функция, которую нужно дебаунсить
 * @param delay Задержка в миллисекундах
 * @returns Дебауншенная функция
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Очищаем таймер при размонтировании
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(id);
  };
}

/**
 * Хук для дебаунса с возможностью немедленного вызова
 * @param callback Функция, которую нужно дебаунсить
 * @param delay Задержка в миллисекундах
 * @returns Объект с дебауншенной функцией и функцией отмены
 */
export function useDebouncedCallbackWithCancel<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): {
  debouncedCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastArgs, setLastArgs] = useState<Parameters<T> | null>(null);

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setLastArgs(null);
  };

  const flush = () => {
    if (lastArgs) {
      callback(...lastArgs);
      cancel();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const debouncedCallback = (...args: Parameters<T>) => {
    setLastArgs(args);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      callback(...args);
      setTimeoutId(null);
      setLastArgs(null);
    }, delay);

    setTimeoutId(id);
  };

  return { debouncedCallback, cancel, flush };
}

/**
 * Хук для дебаунса с сохранением предыдущего значения
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @returns Объект с текущим, предыдущим и дебауншенным значениями
 */
export function useDebounceWithPrevious<T>(
  value: T,
  delay: number
): {
  current: T;
  previous: T | null;
  debounced: T;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [previousValue, setPreviousValue] = useState<T | null>(null);

  useEffect(() => {
    setPreviousValue(value);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {
    current: value,
    previous: previousValue,
    debounced: debouncedValue
  };
}

/**
 * Хук для дебаунса с возможностью сброса
 * @param initialValue Начальное значение
 * @param delay Задержка в миллисекундах
 * @returns Объект с дебауншенным значением, функцией установки и функцией сброса
 */
export function useDebounceState<T>(
  initialValue: T,
  delay: number
): {
  debouncedValue: T;
  setValue: (value: T) => void;
  reset: () => void;
} {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  const reset = () => {
    setValue(initialValue);
    setDebouncedValue(initialValue);
  };

  return {
    debouncedValue,
    setValue,
    reset
  };
}

/**
 * Хук для дебаунса с зависимостью от условия
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @param condition Условие, при котором дебаунс активен
 * @returns Дебауншенное значение
 */
export function useConditionalDebounce<T>(
  value: T,
  delay: number,
  condition: boolean
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (!condition) {
      // Если условие false, сразу обновляем значение
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, condition]);

  return debouncedValue;
}

export default {
  useDebounce,
  useDebouncedCallback,
  useDebouncedCallbackWithCancel,
  useDebounceWithPrevious,
  useDebounceState,
  useConditionalDebounce
};
