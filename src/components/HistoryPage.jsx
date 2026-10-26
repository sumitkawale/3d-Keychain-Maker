import { useEffect, useRef, useState } from 'react';
import { deleteProject, listProjects, putProject } from '../lib/db.js';
import { downloadBlob } from '../lib/exporters.js';
import { createProject, fileSlug } from '../lib/library.js';
import { parseProjectFile, serializeProject } from '../lib/projectFile.js';
import { goEditor } from '../lib/useRoute.js';
import { useStore } from '../state/StoreContext.jsx';
import Icon, { IconButton } from './ui/Icon.jsx';

const fmtDate = (t) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Page listing every keychain saved in this browser, with a preview image for each. */
export default function HistoryPage() {
  const { loadProject } = useStore();
  const [items, setItems] = useState(null);
  const [message, setMessage] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [draft, setDraft] = useState('');
  const fileRef = useRef(null);

  const refresh = () => listProjects().then(setItems);
  useEffect(() => { refresh(); }, []);

  const open = async (p) => {
    await loadProject(p.data);
    goEditor();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}” from this browser?`)) return;
    await deleteProject(p.id);
    refresh();
  };

  const download = (p) => downloadBlob(serializeProject(p.name, p.data), `${fileSlug(p.name)}.keychain.json`, 'application/json');

  const commitRename = async (p) => {
    const name = draft.trim();
    setRenaming(null);
    if (name && name !== p.name) {
      await putProject({ ...p, name });
      refresh();
    }
  };

  const importFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    let added = 0;
    for (const f of files) {
      try {
        const { name, project } = parseProjectFile(await f.text());
        await createProject(name, project);
        added += 1;
      } catch (err) {
        setMessage(`${f.name}: ${err.message}`);
        return;
      }
    }
    setMessage(added ? `Imported ${added} project${added > 1 ? 's' : ''}.` : '');
    refresh();
  };

  return (
    <div className="page">
      <header className="page-head">
        <button type="button" className="sec" onClick={goEditor}><Icon name="arrowLeft" /> Back to editor</button>
        <h1>Saved keychains</h1>
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="upload" /> Import project file</button>
        <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={importFiles} />
      </header>
      {message && <div className="note">{message}</div>}
      {items === null && <div className="note">Loading…</div>}
      {items && items.length === 0 && (
        <div className="empty">
          <Icon name="clock" size={32} />
          <p>Nothing saved yet. In the editor, use “Save to history” at the bottom of the panel, or import a project file here.</p>
        </div>
      )}
      <div className="hgrid">
        {(items || []).map((p) => (
          <div className="hcard" key={p.id}>
            <img src={p.thumb} alt={`Preview of ${p.name}`} />
            <div className="hbody">
              {renaming === p.id ? (
                <input
                  autoFocus
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRename(p)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(p); if (e.key === 'Escape') setRenaming(null); }}
                />
              ) : (
                <div className="hname" title={p.name}>{p.name}</div>
              )}
              <div className="note">{fmtDate(p.savedAt)}</div>
              <div className="hactions">
                <button type="button" className="primary" onClick={() => open(p)}><Icon name="folder" /> Open</button>
                <IconButton name="pencil" title="Rename" onClick={() => { setRenaming(p.id); setDraft(p.name); }} />
                <IconButton name="download" title="Download project file" onClick={() => download(p)} />
                <IconButton name="trash" title="Delete" onClick={() => remove(p)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
