import Icon, { IconButton } from '../ui/Icon.jsx';

const fmtDate = (t) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const SHAPES = { rect: 'rounded rectangle', pill: 'pill', ellipse: 'oval', hex: 'hexagon', cont: 'contour' };

/** One-line summary of what a preset configures. */
export function summarize(s) {
  const base = `Base: ${SHAPES[s.shape] || s.shape}`;
  const border = s.bs === 'none' ? 'no border' : `${s.bs} border ${s.bord} mm`;
  const ring = s.ringOn ? `${s.rso} ring, hole ${s.hole} mm` : 'no hole';
  return `${base} · ${border} · ${ring}`;
}

/** A saved settings preset with its actions. */
export default function PresetCard({ preset, isDefault, isActive, onUse, onDefault, onEdit, onExport, onDelete }) {
  return (
    <div className={`hcard pcard${isActive ? ' using' : ''}`}>
      <div className="hbody">
        <div className="hname" title={preset.name}>{preset.name}</div>
        <div className="pills">
          <span className="hid">{preset.id}</span>
          {isDefault && <span className="pill def"><Icon name="star" size={11} /> Default</span>}
          {isActive && <span className="pill use"><Icon name="check" size={11} /> In use</span>}
        </div>
        <div className="note">{summarize(preset.settings)}</div>
        <div className="note">Updated {fmtDate(preset.updatedAt)}</div>
        <div className="hactions pactions">
          <button type="button" className="primary" onClick={onUse} title="Use these settings on the current work, for this session only">
            <Icon name="play" /> Use now
          </button>
          <button type="button" className="sec" disabled={isDefault} onClick={onDefault} title="Start new keychains with these settings">
            <Icon name="star" /> {isDefault ? 'Default' : 'Set as default'}
          </button>
        </div>
        <div className="hactions">
          <button type="button" className="sec" onClick={onEdit}><Icon name="pencil" /> Edit</button>
          <IconButton name="download" title="Export this setting to a file" onClick={onExport} />
          <IconButton name="trash" title="Delete" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}
