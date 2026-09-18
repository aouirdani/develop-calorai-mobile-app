/**
 * Persistance découplée : le store ne connaît pas AsyncStorage/localStorage.
 * React Native fournit un adaptateur AsyncStorage, la preview web un adaptateur
 * localStorage — la logique métier reste unique et testable.
 */
export interface StorageAdapter {
  read(): string | null | Promise<string | null>;
  write(value: string): void | Promise<void>;
}

export function memoryStorage(): StorageAdapter {
  let value: string | null = null;
  return {
    read: () => value,
    write: (v) => {
      value = v;
    },
  };
}
