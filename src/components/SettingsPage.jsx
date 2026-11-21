import { useRef, useState } from 'react';
import { getItemDefaults, pickSettings } from '../lib/presets.js';
import { goEditor } from '../lib/useRoute.js';
import { usePresets } from '../state/PresetsContext.jsx';
import { useStore } from '../state/StoreContext.jsx';
import PresetCard from './settings/PresetCard.jsx';
import PresetEditor from './settings/PresetEditor.jsx';
import Icon from './ui/Icon.jsx';

const BUILTIN_NOTE = 'The values that come with the app. No saved setting is the default.';

/** Page for managing saved settings: what is the default, what is in use, the saved list and an editor. */
export default function SettingsPage() {
  const { settings } = useStore();
  const { presets, defaultId, activeId, defaultPreset, info, actions } = usePresets();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(() => ({ editingId: null, name: '', settings: pickSettings(settings), items: { ...getItemDefaults() } }));
  const fileRef = useRef(null);
  const editorRef = useRef(null);

  const editing = presets.find((p) => p.id === draft.editingId) || null;

  const edit = (p) => {
    setDraft({ editingId: p.id, name: p.name, settings: pickSettings(p.settings), items: { ...getItemDefaults(), ...p.itemDefaults } });
    setStatus('');
    setTimeout(() => editorRef.current && editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const finish = (r) => {
    setStatus(r.message);
    if (r.ok) setDraft((d) => ({ ...d, editingId: r.preset.id, name: r.preset.name }));
  };
  const update = async () => {
    setBusy(true);
    finish(await actions.save({ name: draft.name, settings: draft.settings, itemDefaults: draft.items, mode: 'update', targetId: draft.editingId }));
    setBusy(false);
  };
  const create = async () => {
    setBusy(true);
    finish(await actions.save({ name: draft.name, settings: draft.settings, itemDefaults: draft.items, mode: 'create' }));
    setBusy(false);
  };
  const importFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    const r = await actions.importFiles(files);
    setStatus(r.message);
  };

  /* ---- the two information cards ---- */
  const isDefaultInUse = (info.kind === 'preset' && info.preset.id === defaultId && !info.modified) || (info.kind === 'builtin' && !defaultPreset);
  const currentName = info.kind === 'preset' ? info.preset.name : info.kind === 'builtin' ? 'Built-in defaults' : 'Custom settings (not saved)';
  const currentNote = info.kind === 'preset'
    ? `${info.preset.id}${info.preset.id === defaultId ? ' · this is also the default' : ''}`
    : info.kind === 'builtin' ? BUILTIN_NOTE : 'The values in the editor do not match any saved setting. Save them below to keep them.';
  const canSetDefault = (info.kind === 'preset' && info.preset.id !== defaultId) || (info.kind === 'builtin' && !!defaultPreset);

  return (
    <div className="page">
      <header className="page-head">
        <button type="button" className="sec" onClick={goEditor}><Icon name="arrowLeft" /> Back to editor</button>
        <h1>Settings</h1>
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="upload" /> Import</button>
        <button type="button" className="sec" disabled={!presets.length} onClick={actions.exportAll}><Icon name="download" /> Export all</button>
        <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={importFiles} />
      </header>
      {status && <div className="note status">{status}</div>}

      <div className="cards2">
        <div className="icard">
          <div className="ictitle"><Icon name="star" /> Default setting</div>
          <div className="icname">{defaultPreset ? defaultPreset.name : 'Built-in defaults'}</div>
          <div className="note">{defaultPreset ? `${defaultPreset.id} · new keychains and “New / clear” start from this.` : BUILTIN_NOTE}</div>
          <div className="iactions">
            <button type="button" className="sec" onClick={actions.useDefault} title="Put the default on the current work"><Icon name="play" /> Use now</button>
            {defaultPreset && <button type="button" className="sec" onClick={() => edit(defaultPreset)}><Icon name="pencil" /> Edit</button>}
            {defaultPreset && <button type="button" className="sec" onClick={() => actions.setDefault(null)}><Icon name="x" /> Use built-in as default</button>}
          </div>
        </div>
        <div className="icard cur">
          <div className="ictitle"><Icon name="play" /> Currently using{info.modified && info.kind === 'preset' ? ' · modified' : ''}</div>
          <div className="icname">{currentName}</div>
          <div className="note">{currentNote}{info.modified && info.kind === 'preset' ? ' You have changed some values since choosing it.' : ''}</div>
          <div className="iactions">
            <button type="button" className="sec" disabled={!canSetDefault} onClick={() => actions.setDefault(info.kind === 'preset' ? info.preset.id : null)}>
              <Icon name="star" /> Set as default
            </button>
            <button type="button" className="sec" disabled={isDefaultInUse} onClick={actions.useDefault}><Icon name="replace" /> Switch to default</button>
            {info.kind === 'preset' && <button type="button" className="sec" onClick={() => edit(info.preset)}><Icon name="pencil" /> Edit</button>}
            {info.kind !== 'builtin' && <button type="button" className="sec" onClick={actions.useBuiltin}><Icon name="x" /> Use built-in</button>}
          </div>
        </div>
      </div>

      <h2 className="sub-h">Saved settings{presets.length ? ` (${presets.length})` : ''}</h2>
      {!presets.length && (
        <div className="empty">
          <Icon name="sliders" size={32} />
          <p>No saved settings yet. Set the values below, give them a name and save. Until then the built-in defaults are in use.</p>
        </div>
      )}
      <div className="hgrid">
        {presets.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            isDefault={p.id === defaultId}
            isActive={p.id === activeId}
            onUse={() => actions.useNow(p.id)}
            onDefault={() => actions.setDefault(p.id)}
            onEdit={() => edit(p)}
            onExport={() => actions.exportOne(p.id)}
            onDelete={async () => { if (await actions.remove(p.id) && draft.editingId === p.id) setDraft((d) => ({ ...d, editingId: null })); }}
          />
        ))}
      </div>

      <div ref={editorRef} />
      <PresetEditor
        draft={draft}
        setDraft={setDraft}
        editingName={editing ? editing.name : ''}
        busy={busy}
        onSave={update}
        onSaveNew={create}
        onCancelEdit={() => setDraft((d) => ({ ...d, editingId: null }))}
      />
    </div>
  );
}
