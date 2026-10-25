import { useRef } from 'react';
import { POSITIONS } from '../../lib/constants.js';
import { setLastFont } from '../../lib/fonts.js';
import { readIcon } from '../../lib/icons.js';
import { useStore } from '../../state/StoreContext.jsx';
import { NumberField } from '../ui/fields.jsx';
import FontPicker from '../ui/FontPicker.jsx';
import MoveFields from './MoveFields.jsx';
import Icon, { IconButton } from '../ui/Icon.jsx';

const ICON_ACCEPT = '.svg,.png,.stl,.obj';

const FOOTPRINT_SHAPES = [
  ['auto', 'Same as the base shape'],
  ['cont', 'Contour (follows this item)'],
  ['rect', 'Rounded rectangle'],
  ['pill', 'Pill'],
  ['ellipse', 'Oval'],
  ['hex', 'Hexagon'],
];

const ITEM_BORDERS = [
  ['base', 'Use the main border'],
  ['none', 'No border (own base only)'],
  ['solid', 'Own border: solid'],
  ['double', 'Own border: double line'],
  ['dashed', 'Own border: dashed'],
  ['dotted', 'Own border: dotted'],
  ['beaded', 'Own border: beaded'],
];

/** Card for one text or icon component. `border` switches on the border-item options. */
export default function ItemCard({ node, border = false, dragging = false }) {
  const { actions } = useStore();
  const fileRef = useRef(null);
  const isText = node.type === 'text';
  const up = (patch, coalesce = false) => actions.patchNode(node.id, patch, coalesce);
  const title = isText ? 'Text' : `${node.type.toUpperCase()} · ${node.name || 'icon'}`;
  const ownBorder = node.ob && node.ob !== 'base';

  const replaceIcon = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let r = null;
    try { r = await readIcon(file); } catch { /* unreadable file */ }
    if (r) up({ ...r, recolor: false });
  };

  return (
    <div className={`card${node.off ? ' off' : ''}${dragging ? ' drag' : ''}`} data-id={node.id}>
      <div className="hd" style={border ? { cursor: 'default' } : undefined}>
        {!border && <Icon name="grip" size={14} className="grip" />}
        <span className="ttl">{title}</span>
        <IconButton name={node.off ? 'eyeOff' : 'eye'} title={node.off ? 'Show' : 'Hide'} onClick={() => up({ off: !node.off })} />
        <IconButton name="x" title="Remove" onClick={() => actions.removeNode(node.id)} />
      </div>

      {isText && (
        <>
          <textarea value={node.text} onChange={(e) => up({ text: e.target.value }, true)} />
          <label>Font</label>
          <FontPicker value={node.font} onChange={(f) => { setLastFont(f); up({ font: f }); }} />
        </>
      )}

      {border && (
        <>
          <label>Position on border</label>
          <select value={node.pos} onChange={(e) => up({ pos: e.target.value })}>
            {POSITIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </>
      )}

      <div className="row">
        <div>
          <label>Rotate (°)</label>
          <NumberField value={node.rot || 0} step={5} onChange={(v) => up({ rot: v }, true)} />
        </div>
      </div>

      {!border && <MoveFields node={node} onChange={up} />}

      {border && (
        <>
          <label>Padding from edge (mm)</label>
          <div className="row">
            {[['pt', 'Top'], ['pb', 'Bottom'], ['pl', 'Left'], ['pr', 'Right']].map(([k, t]) => (
              <div key={k}>
                <label>{t}</label>
                <NumberField value={node[k] || 0} step={0.5} onChange={(v) => up({ [k]: v }, true)} />
              </div>
            ))}
          </div>

          <label>Shape under this item</label>
          <select value={node.fshape || 'auto'} onChange={(e) => up({ fshape: e.target.value })}>
            {FOOTPRINT_SHAPES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>

          <label>Border for this item</label>
          <select value={node.ob || 'base'} onChange={(e) => up({ ob: e.target.value })}>
            {ITEM_BORDERS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>

          {ownBorder && node.ob !== 'none' && (
            <div className="row">
              <div>
                <label>Border width (mm)</label>
                <NumberField value={node.obw ?? 1.2} min={0.2} step={0.2} positive onChange={(v) => up({ obw: v }, true)} />
              </div>
              <div>
                <label>Border colour</label>
                <input type="color" value={node.obc || '#ffffff'} onChange={(e) => up({ obc: e.target.value }, true)} />
              </div>
            </div>
          )}

          {!ownBorder && (
            <>
              <div className="row">
                <div>
                  <label>Gap to border (mm)</label>
                  <NumberField value={node.sp ?? 0.3} min={0} step={0.1} onChange={(v) => up({ sp: v }, true)} />
                </div>
              </div>
              <label className="ck">
                <input type="checkbox" checked={!!node.over} onChange={(e) => up({ over: e.target.checked })} /> Border goes around this item (instead of being cut)
              </label>
            </>
          )}
        </>
      )}

      <div className="row">
        <div>
          <label>{isText ? 'Text' : 'Icon'} size (mm)</label>
          <NumberField value={node.size} min={1} step={0.5} positive onChange={(v) => up({ size: v }, true)} />
        </div>
        <div>
          <label>Colour</label>
          <input type="color" value={node.color} onChange={(e) => up({ color: e.target.value, recolor: true }, true)} />
        </div>
      </div>

      <label>Height (mm)</label>
      <NumberField value={node.height} min={0.2} step={0.2} positive onChange={(v) => up({ height: v }, true)} />

      {node.type === 'svg' && (
        <button type="button" className="sec wide" onClick={() => up({ recolor: false })}>
          <Icon name="palette" /> Use original SVG colours
        </button>
      )}

      {!isText && (
        <>
          <div className="row">
            <label className="ck"><input type="checkbox" checked={!!node.fx} onChange={(e) => up({ fx: e.target.checked })} /> <Icon name="flipH" /> Flip horizontally</label>
            <label className="ck"><input type="checkbox" checked={!!node.fy} onChange={(e) => up({ fy: e.target.checked })} /> <Icon name="flipV" /> Flip vertically</label>
          </div>
          <button type="button" className="sec wide" onClick={() => fileRef.current.click()}>
            <Icon name="replace" /> Replace icon
          </button>
          <input ref={fileRef} type="file" accept={ICON_ACCEPT} hidden onChange={replaceIcon} />
        </>
      )}
    </div>
  );
}
