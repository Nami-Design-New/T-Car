'use client';

import { useCallback, useState } from 'react';

export function useToggleList(initial: string[] = []) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = useCallback((value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  return { selected, toggle, clear, setSelected };
}