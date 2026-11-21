import { DEFAULT_SETTINGS } from '../../lib/constants.js';
import { BUILTIN_ITEM_DEFAULTS, getItemDefaults, pickSettings } from '../../lib/presets.js';
import { useStore } from '../../state/StoreContext.jsx';
import BaseSection from '../sections/BaseSection.jsx';
import BorderSection from '../sections/BorderSection.jsx';
import KeyringSection from '../sections/KeyringSection.jsx';
import LayoutSection from '../sections/LayoutSection.jsx';
import FontPicker from '../ui/FontPicker.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';
import { BindingContext, NumberField, SettingCheck, SettingSelect } from '../ui/fields.jsx';

function ItemDefaults({ items, onChange }) {
  const num = (k, label, step = 0.5) => (
    <div key={k}>
      <label>{label}</label>
      <NumberField value={items[k]} min={0.2} step={step} positive onChange={(v) => onChange({ [k]: v })} />
    </div>
  );
  return (
    <>
      <div className="row">{num('textSize', 'Text size (mm)')}{num('iconSize', 'Icon size (mm)')}</div>
      <div className="row">{num('borderTextSize', 'Border text size (mm)')}{num('borderIconSize', 'Border icon size (mm)')}</div>
      <div className="row">
        {num('height', 'Height (mm)', 0.2)}
        <div>
          <label>Text colour</label>
          <input type="color" value={items.textColor} onChange={(e) => onChange({ textColor: e.target.value })} />
        </div>
      </div>
      <label>Font for new text</label>
      <FontPicker value={items.textFont} onChange={(f) => onChange({ textFont: f })} />
    </>
  );
}

/**
 * Form for creating or editing a settings preset. The same setting fields as the editor are used, but they are
 * bound to the draft values instead of the keychain being edited.
 */
export default function PresetEditor({ draft, setDraft, editingName, onSave, onSaveNew, onCancelEdit, busy }) {
  const { settings: current } = useStore();
  const binding = {
    settings: draft.settings,
    set: (k, v) => setDraft((d) => ({ ...d, settings: { ...d.settings, [k]: v } })),
  };
  const patchItems = (p) => setDraft((d) => ({ ...d, items: { ...d.items, ...p } }));

  return (
    <div className="editor">
      <h2>{draft.editingId ? `Editing “${editingName}”` : 'New setting'}</h2>
      <label>Name</label>
      <input type="text" value={draft.name} placeholder="e.g. Name tag, thin border" onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
      <div className="row">
        <button type="button" className="sec" onClick={() => setDraft((d) => ({ ...d, settings: pickSettings(DEFAULT_SETTINGS), items: { ...BUILTIN_ITEM_DEFAULTS } }))}>
          Start from built-in defaults
        </button>
        <button type="button" className="sec" onClick={() => setDraft((d) => ({ ...d, settings: pickSettings(current), items: { ...getItemDefaults() } }))}>
          Copy the current work
        </button>
      </div>

      <BindingContext.Provider value={binding}>
        <LayoutSection />
        <BaseSection />
        <BorderSection />
        <Section title="Border icons & text">
          <SettingCheck k="fillb">Fill the base under border icons/text so they stay attached</SettingCheck>
        </Section>
        <KeyringSection />
        <Section title="Export">
          <SettingSelect
            k="fmt"
            label="Default export format"
            options={[['3mf', '3MF for Bambu Studio / OrcaSlicer (colour parts)'], ['3mf-prusa', '3MF for PrusaSlicer'], ['obj', 'OBJ + MTL (colours)'], ['stl', 'STL (full model + one STL per colour)']]}
          />
        </Section>
      </BindingContext.Provider>
      <Section title="New components start with">
        <ItemDefaults items={draft.items} onChange={patchItems} />
      </Section>

      <div className="saverow">
        {draft.editingId ? (
          <>
            <button type="button" className="primary" disabled={busy} onClick={onSave}><Icon name="save" /> Update “{editingName}”</button>
            <button type="button" className="sec" disabled={busy} onClick={onSaveNew}><Icon name="plus" /> Save as new</button>
            <button type="button" className="sec" onClick={onCancelEdit}>Stop editing</button>
          </>
        ) : (
          <button type="button" className="primary" disabled={busy} onClick={onSaveNew}><Icon name="save" /> Save settings</button>
        )}
      </div>
    </div>
  );
}
