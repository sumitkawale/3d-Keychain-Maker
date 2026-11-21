import { usePresets } from '../state/PresetsContext.jsx';
import { useStore } from '../state/StoreContext.jsx';
import Icon from './ui/Icon.jsx';
import BaseSection from './sections/BaseSection.jsx';
import BorderItemsSection from './sections/BorderItemsSection.jsx';
import BorderSection from './sections/BorderSection.jsx';
import ComponentsSection from './sections/ComponentsSection.jsx';
import ExportSection from './sections/ExportSection.jsx';
import FontsSection from './sections/FontsSection.jsx';
import KeyringSection from './sections/KeyringSection.jsx';
import LayoutSection from './sections/LayoutSection.jsx';
import PresetSection from './sections/PresetSection.jsx';
import SaveSection from './sections/SaveSection.jsx';
import { goHistory, goSettings } from '../lib/useRoute.js';

/** Shows which settings the current work uses; opens the Settings page. */
function PresetBadge() {
  const { info, defaultId } = usePresets();
  let label = 'Built-in defaults';
  if (info.kind === 'preset') label = `Settings: ${info.preset.name}${info.preset.id === defaultId ? ' (default)' : ''}`;
  if (info.kind === 'custom') label = 'Custom settings (not saved)';
  return (
    <button type="button" className="pbadge" onClick={goSettings} title="Open the Settings page">
      <Icon name="sliders" size={15} />
      <span className="ptxt">{label}</span>
      {info.kind === 'preset' && info.modified && <em>modified</em>}
    </button>
  );
}

function Toolbar() {
  const { canUndo, canRedo, actions } = useStore();
  const { actions: presetActions } = usePresets();
  return (
    <div className="row">
      <button type="button" className="sec" disabled={!canUndo} onClick={actions.undo}><Icon name="undo" /> Undo</button>
      <button type="button" className="sec" disabled={!canRedo} onClick={actions.redo}><Icon name="redo" /> Redo</button>
      <button type="button" className="sec" title="Start a new keychain (you can undo this)" onClick={() => { actions.clear(); presetActions.clearActive(); }}><Icon name="trash" /> New / clear</button>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside>
      <div className="titlebar">
        <h1>3D Keychain Generator</h1>
        <button type="button" className="sec" onClick={goHistory}><Icon name="clock" /> History</button>
      </div>
      <PresetBadge />
      <Toolbar />
      <ComponentsSection />
      <LayoutSection />
      <BaseSection />
      <BorderSection />
      <BorderItemsSection />
      <KeyringSection />
      <FontsSection />
      <ExportSection />
      <PresetSection />
      <SaveSection />
    </aside>
  );
}
