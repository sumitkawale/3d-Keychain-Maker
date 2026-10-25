import { NumberField } from '../ui/fields.jsx';

/** Top / bottom / left / right nudge for a component or group (applied after the layout). */
export default function MoveFields({ node, onChange }) {
  return (
    <>
      <label>Move (mm) — each value pushes it away from that side</label>
      <div className="row">
        {[['mt', 'Top'], ['mb', 'Bottom'], ['ml', 'Left'], ['mr', 'Right']].map(([k, t]) => (
          <div key={k}>
            <label>{t}</label>
            <NumberField value={node[k] || 0} step={0.5} onChange={(v) => onChange({ [k]: v }, true)} />
          </div>
        ))}
      </div>
    </>
  );
}
