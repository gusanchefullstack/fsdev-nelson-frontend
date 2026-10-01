import { useEffect, useState } from 'react';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** False when the user prefers reduced motion or WebGL is unavailable (FR-044). */
export function useMotionOk(): boolean {
  const [ok, setOk] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches && webglAvailable());
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setOk(!mq.matches && webglAvailable());
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return ok;
}
