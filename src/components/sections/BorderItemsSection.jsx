import { useRef, useState } from 'react';
import { getLastFont } from '../../lib/fonts.js';
import { readIcon } from '../../lib/icons.js';
import { useStore } from '../../state/StoreContext.jsx';
import ItemCard from '../list/ItemCard.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';
import { SettingCheck } from '../ui/fields.jsx';

/** Icons and text that sit on the border of the base. */
export default function BorderItemsSection() {
  const { bic, actions } = useStore();
  const fileRef = useRef(null);
  const [svgCode, setSvgCode] = useState('');

  const addIcons = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const f of files) {
      let r = null;
      try { r = await readIcon(f); } catch { /* unreadable file */ }
      if (r) actions.addItem(r, { border: true });
    }
  };

  const addPasted = () => {
    if (!/<svg/i.test(svgCode)) return;
    actions.addItem({ type: 'svg', name: 'pasted', data: svgCode.trim() }, { border: true });
    setSvgCode('');
  };

  return (
    <Section title="Border icons & text">
      <SettingCheck k="fillb">Fill the base under border icons/text so they stay attached</SettingCheck>
      <div>
        {bic.map((n) => <ItemCard key={n.id} node={n} border />)}
      </div>
      <div className="row">
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="image" /> Add border icon (SVG / PNG / STL / OBJ)</button>
        <button type="button" className="sec" onClick={() => actions.addItem({ type: 'text', text: 'Text', font: getLastFont() }, { border: true })}><Icon name="type" /> Add border text</button>
      </div>
      <input ref={fileRef} type="file" accept=".svg,.png,.stl,.obj" multiple hidden onChange={addIcons} />
      <textarea style={{ marginTop: 6 }} value={svgCode} onChange={(e) => setSvgCode(e.target.value)} placeholder="Paste SVG code for a border icon" />
      <button type="button" className="sec wide" onClick={addPasted}><Icon name="code" /> Add pasted SVG to border</button>
      <div className="note">Each icon sits centred on the border. The border is cut away under the icon’s whole area (gaps and openings included), so it never shows through.</div>
    </Section>
  );
}
