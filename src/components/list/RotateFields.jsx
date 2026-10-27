import { NumberField } from '../ui/fields.jsx';

/** Rotation around the X, Y and Z axes in degrees. `zKey` is the field that holds the Z rotation. */
export default function RotateFields({ node, onChange, zKey }) {
  return (
    <>
      <label>Rotate (°) around the X, Y and Z axes</label>
      <div className="row">
        {[['rx', 'X'], ['ry', 'Y'], [zKey, 'Z']].map(([k, t]) => (
          <div key={k}>
            <label>{t}</label>
            <NumberField value={node[k] || 0} step={5} onChange={(v) => onChange({ [k]: v }, true)} />
          </div>
        ))}
      </div>
    </>
  );
}
