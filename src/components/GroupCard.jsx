import { ComponentCard } from './ComponentCard.jsx';

export function GroupCard({ g, fonts, onPatchGroup, onPatchChild, ...cardHandlers }) {
  return (
    <div className={`card gc${g.off ? ' off' : ''}`} data-id={g.id}>
      <div className="hd">
        ☰ Group
        <i data-eye title="Show / hide" onClick={() => onPatchGroup(g.id, { off: !g.off })}>
          {g.off ? '🚫' : '👁'}
        </i>
        <i data-del onClick={() => cardHandlers.onDelete(g.id, false)}>
          ✕
        </i>
      </div>
      <div className="row">
        <div>
          <label>Name</label>
          <input type="text" value={g.name || ''} onChange={(e) => onPatchGroup(g.id, { name: e.target.value })} />
        </div>
        <div>
          <label>Layout</label>
          <select value={g.dir || 'v'} onChange={(e) => onPatchGroup(g.id, { dir: e.target.value })}>
            <option value="v">Stacked</option>
            <option value="h">Side by side</option>
          </select>
        </div>
        <div>
          <label>Gap (mm)</label>
          <input
            type="number"
            step={0.5}
            min={0}
            value={g.gap}
            onChange={(e) => onPatchGroup(g.id, { gap: +e.target.value })}
          />
        </div>
      </div>
      <div className="kids">
        {g.kids.map((k) => (
          <ComponentCard key={k.id} c={k} border={false} fonts={fonts} onPatch={onPatchChild} {...cardHandlers} />
        ))}
      </div>
      <div className="row">
        <button className="sec" type="button" onClick={() => cardHandlers.onAddTextToGroup(g.id)}>
          + Text
        </button>
        <button className="sec" type="button" onClick={() => cardHandlers.onAddIconToGroup(g.id)}>
          + Icon
        </button>
      </div>
    </div>
  );
}
