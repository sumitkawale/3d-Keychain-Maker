import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Collapsible panel section (open by default). When `focus` turns on (e.g. its part was clicked in the
 * preview) the section opens, is highlighted and, with `scroll`, scrolled into view. `focusKey` re-triggers it.
 */
export default function Section({ title, sub = false, focus = false, focusKey = null, scroll = false, children }) {
  const [open, setOpen] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!focus) return undefined;
    setOpen(true);
    if (!scroll) return undefined;
    const t = setTimeout(() => ref.current && ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    return () => clearTimeout(t);
  }, [focus, focusKey, scroll]);

  const cls = [sub ? 'sub' : '', focus ? 'focus' : ''].filter(Boolean).join(' ') || undefined;
  return (
    <details ref={ref} className={cls} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><Icon name="chevron" size={14} className="chev" />{title}</summary>
      {children}
    </details>
  );
}
