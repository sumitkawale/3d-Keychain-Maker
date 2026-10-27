import { useRef } from 'react';
import { getLastFont } from '../../lib/fonts.js';
import { readIcon } from '../../lib/icons.js';
import { useStore } from '../../state/StoreContext.jsx';
import { NumberField } from '../ui/fields.jsx';
import Icon, { IconButton } from '../ui/Icon.jsx';
import ItemCard from './ItemCard.jsx';
import MoveFields from './MoveFields.jsx';
import RotateFields from './RotateFields.jsx';

/** Parent card: holds child components (and other groups) laid out together, with its own direction, gap, move and visibility. */
export default function GroupCard({ node, dragId }) {
  const { actions } = useStore();
  const fileRef = useRef(null);
  const up = (patch, coalesce = false) => actions.patchNode(node.id, patch, coalesce);

  const addIcons = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const f of files) {
      let r = null;
      try { r = await readIcon(f); } catch { /* unreadable file */ }
      if (r) actions.addItem(r, { parentId: node.id });
    }
  };

  return (
    <div className={`card gc${node.off ? ' off' : ''}${dragId === node.id ? ' drag' : ''}`} data-id={node.id}>
      <div className="hd">
        <Icon name="grip" size={14} className="grip" />
        <span className="ttl">Group</span>
        <IconButton name={node.off ? 'eyeOff' : 'eye'} title={node.off ? 'Show' : 'Hide'} onClick={() => up({ off: !node.off })} />
        <IconButton name="x" title="Remove group" onClick={() => actions.removeNode(node.id)} />
      </div>
      <div className="row">
        <div>
          <label>Name</label>
          <input type="text" value={node.name || ''} onChange={(e) => up({ name: e.target.value }, true)} />
        </div>
        <div>
          <label>Layout</label>
          <select value={node.dir === 'v' ? 'v' : 'h'} onChange={(e) => up({ dir: e.target.value })}>
            <option value="v">Stacked</option>
            <option value="h">Side by side</option>
          </select>
        </div>
        <div>
          <label>Gap (mm)</label>
          <NumberField value={node.gap} min={0} step={0.5} onChange={(v) => up({ gap: v }, true)} />
        </div>
      </div>
      <MoveFields node={node} onChange={up} />
      <RotateFields node={node} onChange={up} zKey="rz" />
      <div className="kids" data-container={node.id}>
        {node.kids.map((k) => (k.type === 'group'
          ? <GroupCard key={k.id} node={k} dragId={dragId} />
          : <ItemCard key={k.id} node={k} dragging={dragId === k.id} />))}
      </div>
      <div className="row">
        <button type="button" className="sec" onClick={() => actions.addItem({ type: 'text', text: 'Text', font: getLastFont(), size: 12 }, { parentId: node.id })}><Icon name="type" /> Text</button>
        <button type="button" className="sec" onClick={() => fileRef.current.click()}><Icon name="image" /> Icon</button>
        <button type="button" className="sec" onClick={() => actions.addGroup(node.id)}><Icon name="folder" /> Group</button>
        <input ref={fileRef} type="file" accept=".svg,.png,.stl,.obj" multiple hidden onChange={addIcons} />
      </div>
    </div>
  );
}
