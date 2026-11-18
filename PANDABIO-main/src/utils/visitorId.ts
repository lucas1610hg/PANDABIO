const STORAGE_KEY = 'pandabio-analytics-visitor-id';

const createVisitorId = (): string =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const getOrCreateVisitorId = (
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  onStorageError?: (error: unknown) => void,
): string => {
  try {
    const existing = storage?.getItem(STORAGE_KEY);
    if (existing) return existing;

    const visitorId = createVisitorId();
    storage?.setItem(STORAGE_KEY, visitorId);
    return visitorId;
  } catch (error) {
    onStorageError?.(error);
    return createVisitorId();
  }
};
