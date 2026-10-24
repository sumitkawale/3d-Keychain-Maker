import { useRef, useState } from 'react';

/**
 * Pointer-based drag and drop for the component list. Cards can be reordered at the top level,
 * or moved into / out of groups (groups themselves stay top-level). Works with mouse and touch.
 */
export default function useDragReorder({ comps, onMove }) {
  const rootRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const first = useRef(true);
  const lastPos = useRef(null);

  const onPointerDown = (e) => {
    if (e.target.closest('i,input,select,button,textarea,.fl')) return;
    const handle = e.target.closest('.hd');
    const card = handle && handle.closest('.card');
    if (!card) return;
    setDragId(Number(card.dataset.id));
    first.current = true;
    lastPos.current = null;
    rootRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (dragId == null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    let c = el && el.closest('[data-container]');
    if (!c || !rootRef.current.contains(c)) return;
    const dragged = comps.find((n) => n.id === dragId) || comps.flatMap((n) => n.kids || []).find((n) => n.id === dragId);
    if (dragged && dragged.type === 'group') c = rootRef.current;
    const siblings = [...c.children].filter((x) => x.classList.contains('card') && Number(x.dataset.id) !== dragId);
    let index = siblings.findIndex((x) => {
      const r = x.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    if (index < 0) index = siblings.length;
    const container = c.dataset.container === 'root' ? 'root' : Number(c.dataset.container);
    const key = `${container}:${index}`;
    if (lastPos.current === key) return;
    lastPos.current = key;
    onMove(dragId, container, index, first.current);
    first.current = false;
  };

  const end = () => setDragId(null);

  return { rootRef, dragId, handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}
