import { useState } from 'react';

export const useStateWithLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  return useState<T>(() => {
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : initialValue;
  });
};
