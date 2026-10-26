import { useRef, useState } from 'react';
import { downloadBlob } from '../../lib/exporters.js';
import { displayId, fileSlug, saveProject, snapshotProject } from '../../lib/library.js';
import { parseProjectFile, serializeProject } from '../../lib/projectFile.js';
import { goHistory } from '../../lib/useRoute.js';
import { useStore } from '../../state/StoreContext.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';

/** Save the current keychain to this browser's history, or as a shareable project file. */
export default function SaveSection() {
  const { comps, bic, settings, meta, loadProject, actions } = useStore();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const project = () => snapshotProject({ comps, bic, settings });
  const label = () => meta.name.trim() || settings.kname || 'My keychain';

  /** Saves under the current id (updating that entry), or under a brand new id when `asNew` or never saved before. */
  const save = async (asNew = false) => {
    setBusy(true);
    setStatus('Saving…');
    try {
      const { project: saved, updated } = await saveProject({ id: asNew ? null : meta.id, name: label(), data: project() });
      actions.setMeta({ id: saved.id, name: saved.name }, { silent: true });
      setStatus(`${updated ? 'Updated' : 'Saved as'} ${displayId(saved.id)}.`);
    } catch (e) {
      setStatus(`Could not save: ${e.message}`);
    }
    setBusy(false);
  };

  const download = () => {
    downloadBlob(serializeProject(label(), project(), meta.id), `${fileSlug(label())}.keychain.json`, 'application/json');
    setStatus('Project file downloaded. Share it, and open it with “Open project file”.');
  };

  const openFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { id, name, project: p } = parseProjectFile(await file.text());
      await loadProject(p, { meta: { id, name } });
      setStatus(`Opened “${name}”${id ? ` (${displayId(id)})` : ''}. You can undo this.`);
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <Section title="Save project">
      <label>Project name</label>
      <input type="text" value={meta.name} placeholder="My keychain" onChange={(e) => actions.setMeta({ name: e.target.value }, { coalesce: true })} />
      <div className="idline">{meta.id ? <>ID <b>{displayId(meta.id)}</b></> : 'Not saved yet. It gets a unique ID when you save.'}</div>
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={() => save(false)}>
          <Icon name="save" /> {meta.id ? `Update ${displayId(meta.id)}` : 'Save to history'}
        </button>
        {meta.id && (
          <button type="button" className="sec" disabled={busy} onClick={() => save(true)}><Icon name="plus" /> Save as new</button>
        )}
      </div>
      <div className="row">
        <button type="button" className="sec" onClick={download}><Icon name="download" /> Project file</button>
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="upload" /> Open project file</button>
      </div>
      <button type="button" className="sec wide" onClick={goHistory}><Icon name="clock" /> View history</button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={openFile} />
      <div className="note">
        Your work is also saved automatically in this browser, so a refresh keeps it.
        Each keychain has a unique ID: saving again updates the same history entry, and “Save as new” makes a separate copy with a new ID.
        A project file can be shared: whoever opens it gets the exact same keychain.
      </div>
      {status && <div className="note">{status}</div>}
    </Section>
  );
}
