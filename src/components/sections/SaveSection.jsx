import { useRef, useState } from 'react';
import { downloadBlob } from '../../lib/exporters.js';
import { createProject, fileSlug, snapshotProject } from '../../lib/library.js';
import { parseProjectFile, serializeProject } from '../../lib/projectFile.js';
import { goHistory } from '../../lib/useRoute.js';
import { useStore } from '../../state/StoreContext.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';

/** Save the current keychain to this browser's history, or as a shareable project file. */
export default function SaveSection() {
  const { comps, bic, settings, loadProject } = useStore();
  const [name, setName] = useState(settings.kname || '');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const project = () => snapshotProject({ comps, bic, settings });
  const label = () => name.trim() || settings.kname || 'My keychain';

  const save = async () => {
    setBusy(true);
    setStatus('Saving…');
    try {
      await createProject(label(), project());
      setStatus('Saved to history in this browser.');
    } catch (e) {
      setStatus(`Could not save: ${e.message}`);
    }
    setBusy(false);
  };

  const download = () => {
    downloadBlob(serializeProject(label(), project()), `${fileSlug(label())}.keychain.json`, 'application/json');
    setStatus('Project file downloaded. Share it, and open it with “Open project file”.');
  };

  const openFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { name: n, project: p } = parseProjectFile(await file.text());
      await loadProject(p);
      setName(n);
      setStatus(`Opened “${n}”. You can undo this.`);
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <Section title="Save project">
      <label>Project name</label>
      <input type="text" value={name} placeholder="My keychain" onChange={(e) => setName(e.target.value)} />
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={save}><Icon name="save" /> Save to history</button>
        <button type="button" className="sec" onClick={download}><Icon name="download" /> Project file</button>
      </div>
      <div className="row">
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="upload" /> Open project file</button>
        <button type="button" className="sec" onClick={goHistory}><Icon name="clock" /> View history</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={openFile} />
      </div>
      <div className="note">
        Your work is also saved automatically in this browser, so a refresh keeps it. “Save to history” keeps a named copy with a preview.
        A project file can be shared: whoever opens it gets the exact same keychain.
      </div>
      {status && <div className="note">{status}</div>}
    </Section>
  );
}
