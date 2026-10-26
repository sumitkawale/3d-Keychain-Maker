import { useEffect, useState } from 'react';

/** Minimal hash router (#/history or the editor), so it also works on GitHub Pages sub-paths. */
export function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.startsWith('#/history') ? 'history' : 'editor';
}

export const goHistory = () => { window.location.hash = '#/history'; };
export const goEditor = () => { window.location.hash = '#/'; };
