import { useEffect, useRef, useState } from 'react';
import { previewFont, useFonts } from '../../lib/fonts.js';
import Icon from './Icon.jsx';

/** Font dropdown: each option is drawn in its own font, opens at the selected font, and supports Up/Down keys. */
export default function FontPicker({ value, onChange }) {
  const fonts = useFonts();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const idx = Math.max(0, fonts.findIndex((f) => f.n === value));
  const cur = fonts[idx];

  const scrollToSelected = () => {
    const l = listRef.current;
    const q = l && l.querySelector('.sel');
    if (q) l.scrollTop = q.offsetTop - (l.clientHeight - q.offsetHeight) / 2;
  };

  useEffect(() => {
    if (!open) return undefined;
    scrollToSelected();
    const close = (e) => { if (!rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => { if (open) scrollToSelected(); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const n = Math.min(fonts.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)));
    if (n !== idx) onChange(fonts[n].n);
  };

  return (
    <div className="fsel" ref={rootRef}>
      <button type="button" className="sec fbtn" style={{ font: previewFont(cur) }} onClick={() => setOpen((o) => !o)} onKeyDown={onKeyDown}>
        <span>{cur.n}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div className="fl" ref={listRef}>
          {fonts.map((f) => (
            <div key={f.n} className={`fo${f.n === value ? ' sel' : ''}`} style={{ font: previewFont(f) }} onClick={() => { onChange(f.n); setOpen(false); }}>
              {f.n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
