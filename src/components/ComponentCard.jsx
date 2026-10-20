import { useState } from 'react';
import { BORDER_POSITIONS } from '../lib/constants.js';
import { COMPONENT_DEFAULTS } from '../lib/defaults/components.js';
import { fontPreviewStyle } from '../lib/fonts.js';

export function ComponentCard({
  c,
  border,
  fonts,
  onPatch,
  onDelete,
  onToggleVisible,
  onReplace,
  onUseOriginalColors,
}) {
  const [fontOpen, setFontOpen] = useState(false);
  const title =
    c.type === 'text'
      ? 'Text'
      : `${c.type.toUpperCase()} · ${c.name || 'icon'}`;

  const patch = (k, v) => onPatch(c.id, border, { [k]: v });

  return (
    <div className={`card${c.off ? ' off' : ''}${border ? '' : ''}`} data-id={c.id}>
      <div className="hd" style={border ? { cursor: 'default' } : undefined}>
        {!border && '☰ '}
        {title}
        <i data-eye title="Show / hide" onClick={() => onToggleVisible(c.id, border)}>
          {c.off ? '🚫' : '👁'}
        </i>
        <i data-del onClick={() => onDelete(c.id, border)}>
          ✕
        </i>
      </div>
      {c.type === 'text' && (
        <>
          <textarea value={c.text} onChange={(e) => patch('text', e.target.value)} />
          <label>Font</label>
          <div className="fsel">
            <button
              className="sec"
              type="button"
              style={{
                font: fontPreviewStyle(fonts, c.font),
                width: '100%',
                textAlign: 'left',
              }}
              onClick={() => setFontOpen((o) => !o)}
            >
              {c.font} ▾
            </button>
            {!fontOpen ? null : (
              <div className="fl">
                {fonts.map((f) => (
                  <div
                    key={f.n}
                    className={`fo${f.n === c.font ? ' sel' : ''}`}
                    style={{ font: fontPreviewStyle(fonts, f.n) }}
                    onClick={() => {
                      patch('font', f.n);
                      setFontOpen(false);
                    }}
                  >
                    {f.n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {border && (
        <>
          <label>Position on border</label>
          <select value={c.pos || 'tl'} onChange={(e) => patch('pos', e.target.value)}>
            {BORDER_POSITIONS.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </>
      )}
      <div className="row">
        <div>
          <label>Rotate (°)</label>
          <input
            type="number"
            step={5}
            value={c.rot || 0}
            onChange={(e) => patch('rot', +e.target.value)}
          />
        </div>
      </div>
      {border && (
        <>
          <label>Padding from edge (mm)</label>
          <div className="row">
            {[
              ['pt', 'Top'],
              ['pb', 'Bottom'],
              ['pl', 'Left'],
              ['pr', 'Right'],
            ].map(([k, lab]) => (
              <div key={k}>
                <label>{lab}</label>
                <input
                  type="number"
                  step={0.5}
                  value={c[k] || 0}
                  onChange={(e) => patch(k, +e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="row">
            <div>
              <label>Gap to border (mm)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                value={c.sp ?? COMPONENT_DEFAULTS.sp}
                onChange={(e) => patch('sp', +e.target.value)}
              />
            </div>
          </div>
          <label className="ck">
            <input
              type="checkbox"
              checked={!!c.over}
              onChange={(e) => patch('over', e.target.checked)}
            />
            Border goes around this item (instead of being cut)
          </label>
        </>
      )}
      <div className="row">
        <div>
          <label>{c.type === 'text' ? 'Text' : 'Icon'} size (mm)</label>
          <input
            type="number"
            min={1}
            step={0.5}
            value={c.size}
            onChange={(e) => {
              const v = +e.target.value;
              if (v > 0) patch('size', v);
            }}
          />
        </div>
        <div>
          <label>Colour</label>
          <input
            type="color"
            value={c.color}
            onChange={(e) => {
              patch('color', e.target.value);
              patch('recolor', true);
            }}
          />
        </div>
      </div>
      <label>Height (mm)</label>
      <input
        type="number"
        min={0.2}
        step={0.2}
        value={c.height}
        onChange={(e) => {
          const v = +e.target.value;
          if (v > 0) patch('height', v);
        }}
      />
      {c.type === 'svg' && (
        <button className="sec" type="button" style={{ width: '100%' }} onClick={() => onUseOriginalColors(c.id, border)}>
          Use original SVG colours
        </button>
      )}
      {c.type !== 'text' && (
        <>
          <div className="row">
            <label className="ck">
              <input type="checkbox" checked={!!c.fx} onChange={(e) => patch('fx', e.target.checked)} />
              Flip ↔
            </label>
            <label className="ck">
              <input type="checkbox" checked={!!c.fy} onChange={(e) => patch('fy', e.target.checked)} />
              Flip ↕
            </label>
          </div>
          <button className="sec" type="button" style={{ width: '100%' }} onClick={() => onReplace(c.id, border)}>
            Replace icon…
          </button>
        </>
      )}
    </div>
  );
}
