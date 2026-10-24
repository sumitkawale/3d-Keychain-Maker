import { useEffect, useState } from 'react';
import { FIELDS } from '../../lib/constants.js';
import { useStore } from '../../state/StoreContext.jsx';

/** Number input that lets you clear and retype freely; only valid numbers are sent up. */
export function NumberField({ value, onChange, min, step, positive = false }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    if (parseFloat(draft) !== value) setDraft(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = parseFloat(e.target.value);
        if (!Number.isNaN(v) && (!positive || v > 0)) onChange(v);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}

export function Field({ label, children }) {
  return (
    <>
      {label && <label>{label}</label>}
      {children}
    </>
  );
}

/* ---- fields bound to a global setting ---- */

export function SettingNumber({ k, label }) {
  const { settings, actions } = useStore();
  const f = FIELDS[k];
  return (
    <Field label={label === undefined ? f.label : label}>
      <NumberField value={settings[k]} min={f.min} step={f.step} onChange={(v) => actions.setSetting(k, v, true)} />
    </Field>
  );
}

export function SettingSelect({ k, label, options, disabled = false }) {
  const { settings, actions } = useStore();
  return (
    <Field label={label}>
      <select value={settings[k]} disabled={disabled} onChange={(e) => actions.setSetting(k, e.target.value)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Field>
  );
}

export function SettingColor({ k, label }) {
  const { settings, actions } = useStore();
  return (
    <Field label={label}>
      <input type="color" value={settings[k]} onChange={(e) => actions.setSetting(k, e.target.value, true)} />
    </Field>
  );
}

export function SettingCheck({ k, children }) {
  const { settings, actions } = useStore();
  return (
    <label className="ck">
      <input type="checkbox" checked={settings[k]} onChange={(e) => actions.setSetting(k, e.target.checked)} /> {children}
    </label>
  );
}

/** A row of labelled number inputs bound to settings, e.g. top / bottom / left / right. */
export function SettingRow({ items }) {
  return (
    <div className="row">
      {items.map(([k, label]) => (
        <div key={k}><SettingNumber k={k} label={label} /></div>
      ))}
    </div>
  );
}
