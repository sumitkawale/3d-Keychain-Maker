import { useState } from 'react';
import { addGoogleFonts } from '../../lib/fonts.js';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';

const HINT = 'Paste a fonts.googleapis.com link (several families are fine), or font names separated by commas. They are added to every text component’s font list.';

export default function FontsSection() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState(HINT);

  const add = async () => {
    if (!value.trim()) return;
    setStatus('Loading…');
    setStatus(await addGoogleFonts(value));
  };

  return (
    <Section title="Fonts">
      <label>Google font (link or name)</label>
      <div className="row">
        <div>
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://fonts.googleapis.com/css2?family=Lobster" />
        </div>
        <button type="button" className="sec" style={{ flex: '0 0 auto' }} onClick={add}><Icon name="plus" /> Add</button>
      </div>
      <div className="note">{status}</div>
    </Section>
  );
}
