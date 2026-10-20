export function NumberFields({ fields, ui, onChange }) {
  return fields.map(([id, label, min, , , step]) => (
    <div key={id}>
      <label htmlFor={id}>{label}</label>
      <input
        type="number"
        id={id}
        min={min}
        step={step}
        value={ui[id]}
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  ));
}
