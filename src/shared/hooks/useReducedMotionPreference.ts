import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
export function useReducedMotionPreference() {
  const systemReduced = useReducedMotion();
  const [localReduced, setLocalReduced] = useState(
    () =>
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('algo-atlas-reduced-motion') === 'true',
  );
  useEffect(() => {
    const sync = () =>
      setLocalReduced(localStorage.getItem('algo-atlas-reduced-motion') === 'true');
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  return !!systemReduced || localReduced;
}
