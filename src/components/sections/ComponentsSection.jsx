import { useRef, useState } from 'react';
import { getLastFont } from '../../lib/fonts.js';
import { readIcon } from '../../lib/icons.js';
import { useStore } from '../../state/StoreContext.jsx';
import { flat } from '../../state/tree.js';
import GroupCard from '../list/GroupCard.jsx';
import ItemCard from '../list/ItemCard.jsx';
import useDragReorder from '../list/useDragReorder.js';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';

export default function ComponentsSection() {
  const { comps, selection, actions } = useStore();
  const fileRef = useRef(null);
  const [svgCode, setSvgCode] = useState('');
  const { rootRef, dragId, handlers } = useDragReorder({ comps, onMove: actions.moveNode });

  const addIcons = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const f of files) {
      let r = null;
      try { r = await readIcon(f); } catch { /* unreadable file */ }
      if (r) actions.addItem(r);
    }
  };

  const addPasted = () => {
    if (!/<svg/i.test(svgCode)) return;
    actions.addItem({ type: 'svg', name: 'pasted', data: svgCode.trim() });
    setSvgCode('');
  };

  return (
    <Section title="Components" focus={!!selection && selection.kind === 'item' && flat(comps).some((n) => n.id === selection.id)} focusKey={selection}>
      <div ref={rootRef} data-container="root" {...handlers}>
        {comps.map((n) => (n.type === 'group'
          ? <GroupCard key={n.id} node={n} dragId={dragId} />
          : <ItemCard key={n.id} node={n} dragging={dragId === n.id} />))}
      </div>
      <div className="row">
        <button type="button" className="sec" onClick={() => actions.addItem({ type: 'text', text: 'Text', font: getLastFont(), size: 12 })}><Icon name="type" /> Add text</button>
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="image" /> Add icon (SVG / PNG / STL / OBJ)</button>
      </div>
      <button type="button" className="sec wide" onClick={() => actions.addGroup()}><Icon name="folder" /> Add group (parent for several components)</button>
      <input ref={fileRef} type="file" accept=".svg,.png,.stl,.obj" multiple hidden onChange={addIcons} />
      <Section title="Paste SVG code instead" sub>
        <textarea value={svgCode} onChange={(e) => setSvgCode(e.target.value)} placeholder="<svg ...>...</svg>" />
        <button type="button" className="sec wide" onClick={addPasted}><Icon name="code" /> Add pasted SVG</button>
        <div className="note">Only filled shapes are used. Colours inside an SVG are kept until you change that component’s colour.</div>
      </Section>
    </Section>
  );
}
