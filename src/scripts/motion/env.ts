const query = (q: string): boolean => {
  try {
    return typeof matchMedia === 'function' && matchMedia(q).matches;
  } catch {
    return false;
  }
};

export const prefersReducedMotion = (): boolean => query('(prefers-reduced-motion: reduce)');
export const hasFinePointer = (): boolean => query('(pointer: fine)');
