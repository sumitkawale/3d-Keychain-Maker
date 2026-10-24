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

function Toolbar() {
  const { canUndo, canRedo, actions } = useStore();
  return (
    <div className="row">
      <button type="button" className="sec" disabled={!canUndo} onClick={actions.undo}><Icon name="undo" /> Undo</button>
      <button type="button" className="sec" disabled={!canRedo} onClick={actions.redo}><Icon name="redo" /> Redo</button>
      <button type="button" className="sec" title="Start a new keychain (you can undo this)" onClick={actions.clear}><Icon name="trash" /> New / clear</button>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside>
      <h1>3D Keychain Generator</h1>
      <Toolbar />
      <ComponentsSection />
      <LayoutSection />
      <BaseSection />
      <BorderSection />
      <BorderItemsSection />
      <KeyringSection />
      <FontsSection />
      <ExportSection />
    </aside>
  );
}
