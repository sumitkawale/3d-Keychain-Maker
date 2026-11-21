import { useEffect, useState } from 'react';
import { getItemDefaults } from '../../lib/presets.js';
import { goSettings } from '../../lib/useRoute.js';
import { usePresets } from '../../state/PresetsContext.jsx';
import { useStore } from '../../state/StoreContext.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';

/** Save the current values as a settings preset: update the selected one (after confirming) or create a new one. */
export default function PresetSection() {
  const { settings } = useStore();
  const { info, actions } = usePresets();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  // The setting the work is using (selected, or the default it still matches) is the one "Update" changes.
  const target = info.kind === 'preset' ? info.preset : null;

  useEffect(() => { if (target) setName(target.name); }, [target && target.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (mode) => {
    setBusy(true);
    const r = await actions.save({ name, settings, itemDefaults: getItemDefaults(), mode, targetId: target && target.id });
    setStatus(r.message);
    if (r.ok) actions.select(r.preset.id);
    setBusy(false);
  };

  return (
    <Section title="Settings preset">
      <div className="idline">
        {info.kind === 'preset' && <>Using <b>{info.preset.name}</b>{info.modified ? ' (changed since)' : ''}</>}
        {info.kind === 'builtin' && 'Using the built-in defaults.'}
        {info.kind === 'custom' && 'Custom values, not saved as a setting.'}
      </div>
      <label>Setting name</label>
      <input type="text" value={name} placeholder="e.g. Name tag, thin border" onChange={(e) => setName(e.target.value)} />
      <div className="row">
        {target && (
          <button type="button" className="primary" disabled={busy} onClick={() => run('update')}><Icon name="save" /> Update “{target.name}”</button>
        )}
        <button type="button" className={target ? 'sec' : 'primary'} disabled={busy} onClick={() => run('create')}><Icon name="plus" /> Save as new</button>
      </div>
      <button type="button" className="sec wide" onClick={goSettings}><Icon name="sliders" /> Open settings page</button>
      <div className="note">Saves the current base, border, keyring and export values, plus the size and colour new components start with.</div>
      {status && <div className="note">{status}</div>}
    </Section>
  );
}
