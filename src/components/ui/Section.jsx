import { useState } from 'react';
import Icon from './Icon.jsx';

/** Collapsible panel section (open by default). */
export default function Section({ title, sub = false, children }) {
  const [open, setOpen] = useState(true);
  return (
    <details className={sub ? 'sub' : undefined} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><Icon name="chevron" size={14} className="chev" />{title}</summary>
      {children}
    </details>
  );
}
