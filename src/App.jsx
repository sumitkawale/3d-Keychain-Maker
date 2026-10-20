import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDER_FIELDS, RING_FIELDS, PALETTE, cloneComponents, flat } from './lib/constants.js';
import {
  DEFAULT_UI,
  DEFAULT_COMPONENTS,
  COMPONENT_ID_START,
  COMPONENT_DEFAULTS,
  BORDER_COMPONENT_SIZE,
  GROUP_DEFAULTS,
  NEW_TEXT_PRESET,
  CLEAR_TEXT_PRESET,
  DEFAULT_FONT,
  INFO_MESSAGE_DEFAULT,
  FONT_STATUS_DEFAULT,
} from './lib/defaults/index.js';
import { createFontList, getFcss, addGoogleFonts } from './lib/fonts.js';
import { buildModel } from './lib/buildModel.js';
import { downloadExport } from './lib/export.js';
import { readIcon } from './lib/readIcon.js';
import { useThreeViewer } from './hooks/useThreeViewer.js';
import { ComponentCard } from './components/ComponentCard.jsx';
import { GroupCard } from './components/GroupCard.jsx';
import { NumberFields } from './components/NumberFields.jsx';

function snapState(comps, bic, ui) {
  return JSON.stringify(
    { comps: cloneComponents(comps), bic: bic.map((c) => ({ ...c })), ui: { ...ui } },
    (k, v) => (k === 'data' ? v && (v.byteLength || v.length) : v),
  );
}

export default function App() {
  const [ui, setUi] = useState({ ...DEFAULT_UI });
  const [comps, setComps] = useState(() => cloneComponents(DEFAULT_COMPONENTS));
  const [bic, setBic] = useState([]);
  const [fonts, setFonts] = useState(createFontList);
  const [lastFont, setLastFont] = useState(DEFAULT_FONT);
  const uidRef = useRef(COMPONENT_ID_START);
  const [dims, setDims] = useState('');
  const [info, setInfo] = useState(INFO_MESSAGE_DEFAULT);
  const [fontStatus, setFontStatus] = useState(FONT_STATUS_DEFAULT);
  const [gfInput, setGfInput] = useState('');
  const [svgPaste, setSvgPaste] = useState('');
  const [svgBorderPaste, setSvgBorderPaste] = useState('');

  const histRef = useRef([]);
  const hiRef = useRef(-1);
  const restRef = useRef(false);
  const commitTimer = useRef(null);
  const buildTimer = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fileRef = useRef(null);
  const bfileRef = useRef(null);
  const rfileRef = useRef(null);
  const fileTargetRef = useRef(null);
  const replRef = useRef(null);

  const { canvasRef, grpRef, getBuildContext, viewerReady } = useThreeViewer();

  const setUiField = useCallback((id, value) => {
    setUi((u) => ({ ...u, [id]: value }));
  }, []);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(hiRef.current > 0);
    setCanRedo(hiRef.current < histRef.current.length - 1);
  }, []);

  const commit = useCallback(() => {
    if (restRef.current) return;
    const s = { comps: cloneComponents(comps), bic: bic.map((c) => ({ ...c })), ui: { ...ui } };
    const k = snapState(comps, bic, ui);
    if (hiRef.current >= 0 && histRef.current[hiRef.current]?.k === k) return;
    histRef.current = histRef.current.slice(0, hiRef.current + 1);
    histRef.current.push({ s, k });
    if (histRef.current.length > 100) histRef.current.shift();
    hiRef.current = histRef.current.length - 1;
    updateHistoryButtons();
  }, [comps, bic, ui, updateHistoryButtons]);

  const scheduleCommit = useCallback(() => {
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(commit, 500);
  }, [commit]);

  const runBuild = useCallback(async () => {
    const grp = grpRef.current;
    if (!grp || !viewerReady) return;
    try {
      const ctxBase = getBuildContext();
      const ctx = {
        ...ctxBase,
        setInfo: (t) => setInfo(t),
        setDims: (t) => setDims(t),
        setSlopeHidden: () => {},
      };
      await buildModel(grp, ui, comps, bic, (n) => getFcss(fonts, n), ctx);
      scheduleCommit();
    } catch (err) {
      console.error('3D build failed:', err);
      setInfo('3D preview failed to update. Check the browser console for details.');
    }
  }, [grpRef, getBuildContext, viewerReady, ui, comps, bic, fonts, scheduleCommit]);

  useEffect(() => {
    if (!viewerReady) return;
    clearTimeout(buildTimer.current);
    buildTimer.current = setTimeout(() => {
      runBuild();
    }, 150);
    return () => clearTimeout(buildTimer.current);
  }, [viewerReady, ui, comps, bic, fonts, runBuild]);

  useEffect(() => {
    if (!viewerReady) return;
    document.fonts?.ready?.then(() => runBuild());
    commit();
  }, [viewerReady]);

  const pushComponent = useCallback(
    (c, border, parentId) => {
      const n = {
        id: ++uidRef.current,
        size: border
          ? c.type === 'text'
            ? BORDER_COMPONENT_SIZE.text
            : BORDER_COMPONENT_SIZE.icon
          : COMPONENT_DEFAULTS.size,
        height: COMPONENT_DEFAULTS.height,
        color: c.type === 'text' ? COMPONENT_DEFAULTS.color : PALETTE[uidRef.current % PALETTE.length],
        recolor: COMPONENT_DEFAULTS.recolor,
        pos: COMPONENT_DEFAULTS.pos,
        rot: COMPONENT_DEFAULTS.rot,
        pt: COMPONENT_DEFAULTS.pt,
        pb: COMPONENT_DEFAULTS.pb,
        pl: COMPONENT_DEFAULTS.pl,
        pr: COMPONENT_DEFAULTS.pr,
        sp: COMPONENT_DEFAULTS.sp,
        ...c,
      };
      if (parentId) {
        setComps((list) =>
          list.map((x) => (x.id === parentId && x.kids ? { ...x, kids: [...x.kids, n] } : x)),
        );
      } else if (border) setBic((b) => [...b, n]);
      else setComps((list) => [...list, n]);
      if (c.font) setLastFont(c.font);
    },
    [],
  );

  const patchComponent = useCallback(
    (id, border, patch) => {
      const apply = (list) =>
        list.map((c) => {
          if (c.id === id) return { ...c, ...patch };
          if (c.kids) return { ...c, kids: apply(c.kids) };
          return c;
        });
      if (border) setBic((b) => apply(b));
      else setComps((list) => apply(list));
      if (patch.font) setLastFont(patch.font);
    },
    [],
  );

  const deleteComponent = useCallback((id, border) => {
    if (border) setBic((b) => b.filter((x) => x.id !== id));
    else {
      setComps((list) =>
        list
          .filter((x) => x.id !== id)
          .map((g) => (g.kids ? { ...g, kids: g.kids.filter((k) => k.id !== id) } : g)),
      );
    }
  }, []);

  const addFiles = useCallback(
    async (files, border, parentId) => {
      for (const f of files) {
        let r = null;
        try {
          r = await readIcon(f);
        } catch (e) {}
        if (r) pushComponent(r, border, parentId);
      }
    },
    [pushComponent],
  );

  const goHistory = useCallback(
    (d) => {
      clearTimeout(commitTimer.current);
      commit();
      const n = hiRef.current + d;
      if (n < 0 || n >= histRef.current.length) return;
      hiRef.current = n;
      const { s } = histRef.current[n];
      restRef.current = true;
      setComps(cloneComponents(s.comps));
      setBic(s.bic.map((c) => ({ ...c })));
      setUi({ ...s.ui });
      restRef.current = false;
      updateHistoryButtons();
    },
    [commit, updateHistoryButtons],
  );

  const clearAll = useCallback(() => {
    clearTimeout(commitTimer.current);
    commit();
    setComps([{ ...CLEAR_TEXT_PRESET, id: 1 }]);
    setBic([]);
    setUi({ ...DEFAULT_UI });
    uidRef.current = COMPONENT_ID_START;
    commit();
  }, [commit]);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /text|number/.test(t.type))) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'z') {
          e.preventDefault();
          goHistory(e.shiftKey ? 1 : -1);
        } else if (k === 'y') {
          e.preventDefault();
          goHistory(1);
        }
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [goHistory]);

  const cardHandlers = {
    onPatch: patchComponent,
    onDelete: deleteComponent,
    onToggleVisible: (id, border) => {
      const list = border ? bic : flat(comps);
      const c = list.find((x) => x.id === id);
      if (c) patchComponent(id, border, { off: !c.off });
    },
    onReplace: (id, border) => {
      const list = border ? bic : flat(comps);
      replRef.current = list.find((x) => x.id === id);
      rfileRef.current?.click();
    },
    onUseOriginalColors: (id, border) => patchComponent(id, border, { recolor: false }),
    onAddTextToGroup: (gid) => pushComponent({ ...NEW_TEXT_PRESET, font: lastFont }, false, gid),
    onAddIconToGroup: (gid) => {
      fileTargetRef.current = gid;
      fileRef.current?.click();
    },
  };

  return (
    <div className="app">
      <div className="stage">
        <canvas ref={canvasRef} />
        {dims ? <div id="dims">{dims}</div> : null}
        <div className="hint">Drag to rotate · scroll or pinch to zoom</div>
      </div>
      <aside>
        <h1>3D Keychain Generator</h1>
        <div className="row">
          <button className="sec" type="button" disabled={!canUndo} onClick={() => goHistory(-1)}>
            ↶ Undo
          </button>
          <button className="sec" type="button" disabled={!canRedo} onClick={() => goHistory(1)}>
            ↷ Redo
          </button>
          <button className="sec" type="button" title="Start a new keychain (you can undo this)" onClick={clearAll}>
            🗑 New / clear
          </button>
        </div>

        <details open>
          <summary>Components</summary>
          <div id="list">
            {comps.map((n) =>
              n.type === 'group' ? (
                <GroupCard
                  key={n.id}
                  g={n}
                  fonts={fonts}
                  onPatchGroup={(id, patch) =>
                    setComps((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)))
                  }
                  onPatchChild={patchComponent}
                  {...cardHandlers}
                />
              ) : (
                <ComponentCard key={n.id} c={n} border={false} fonts={fonts} {...cardHandlers} />
              ),
            )}
          </div>
          <div className="row">
            <button
              className="sec"
              type="button"
              onClick={() => pushComponent({ ...NEW_TEXT_PRESET, font: lastFont }, false)}
            >
              + Add text
            </button>
            <button
              className="sec"
              type="button"
              onClick={() => {
                fileTargetRef.current = null;
                fileRef.current?.click();
              }}
            >
              + Add icon (SVG / PNG / STL / OBJ)
            </button>
          </div>
          <button
            className="sec"
            type="button"
            style={{ width: '100%' }}
            onClick={() =>
              setComps((list) => [
                ...list,
                {
                  id: ++uidRef.current,
                  ...GROUP_DEFAULTS,
                  name: `Group ${list.filter((x) => x.type === 'group').length + 1}`,
                },
              ])
            }
          >
            + Add group (parent for several components)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.stl,.obj"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files, false, fileTargetRef.current);
              fileTargetRef.current = null;
              e.target.value = '';
            }}
          />
          <input
            ref={rfileRef}
            type="file"
            accept=".svg,.png,.stl,.obj"
            hidden
            onChange={async (e) => {
              const f = e.target.files[0];
              const c = replRef.current;
              e.target.value = '';
              replRef.current = null;
              if (!f || !c) return;
              let r = null;
              try {
                r = await readIcon(f);
              } catch (err) {}
              if (r) patchComponent(c.id, !!bic.find((x) => x.id === c.id), { ...r, recolor: false });
            }}
          />
          <details className="sub">
            <summary>Paste SVG code instead</summary>
            <textarea
              placeholder="<svg ...>...</svg>"
              value={svgPaste}
              onChange={(e) => setSvgPaste(e.target.value)}
            />
            <button
              className="sec"
              type="button"
              style={{ width: '100%' }}
              onClick={() => {
                const t = svgPaste.trim();
                if (/<svg/i.test(t)) {
                  pushComponent({ type: 'svg', name: 'pasted', data: t }, false);
                  setSvgPaste('');
                }
              }}
            >
              Add pasted SVG
            </button>
            <div className="note">
              SVG links can’t be fetched from a published page, so upload the file or paste its code. Only filled shapes
              are used. Colours inside an SVG are kept until you change that component’s colour.
            </div>
          </details>
        </details>

        <details open>
          <summary>Layout</summary>
          <label htmlFor="dir">Direction</label>
          <select id="dir" value={ui.dir} onChange={(e) => setUiField('dir', e.target.value)}>
            <option value="h">Horizontal</option>
            <option value="v">Vertical</option>
          </select>
          <NumberFields fields={SLIDER_FIELDS.filter((f) => f[0] === 'gap')} ui={ui} onChange={setUiField} />
        </details>

        <details open>
          <summary>Base</summary>
          <label htmlFor="shape">Base shape</label>
          <select id="shape" value={ui.shape} onChange={(e) => setUiField('shape', e.target.value)}>
            <option value="rect">Rounded rect</option>
            <option value="pill">Pill</option>
            <option value="ellipse">Oval</option>
            <option value="hex">Hexagon</option>
            <option value="cont">Contour (follows content)</option>
          </select>
          <label htmlFor="cs">Contour style (for the Contour base)</label>
          <select id="cs" value={ui.cs} onChange={(e) => setUiField('cs', e.target.value)}>
            <option value="light">Light (smooth, filled-in)</option>
            <option value="reg">Regular</option>
            <option value="hard">Hard (deep waves that follow the text)</option>
          </select>
          <NumberFields fields={SLIDER_FIELDS.filter((f) => ['pad', 'baseT'].includes(f[0]))} ui={ui} onChange={setUiField} />
          <label htmlFor="cb">Base colour</label>
          <input type="color" id="cb" value={ui.cb} onChange={(e) => setUiField('cb', e.target.value)} />
        </details>

        <details open>
          <summary>Border</summary>
          <label htmlFor="bs">Border style</label>
          <select id="bs" value={ui.bs} onChange={(e) => setUiField('bs', e.target.value)}>
            <option value="none">No border</option>
            <option value="solid">Solid</option>
            <option value="double">Double line</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="beaded">Beaded (touching pearls)</option>
          </select>
          <NumberFields fields={SLIDER_FIELDS.filter((f) => ['bord', 'rel'].includes(f[0]))} ui={ui} onChange={setUiField} />
          <label htmlFor="cd">Border colour</label>
          <input type="color" id="cd" value={ui.cd} onChange={(e) => setUiField('cd', e.target.value)} />
        </details>

        <details open>
          <summary>Border icons &amp; text</summary>
          <label className="ck">
            <input type="checkbox" checked={ui.fillb} onChange={(e) => setUiField('fillb', e.target.checked)} />
            Fill the base under border icons/text so they stay attached
          </label>
          <div id="bi">
            {bic.map((c) => (
              <ComponentCard key={c.id} c={c} border fonts={fonts} {...cardHandlers} />
            ))}
          </div>
          <div className="row">
            <button className="sec" type="button" onClick={() => bfileRef.current?.click()}>
              + Add border icon (SVG / PNG / STL / OBJ)
            </button>
            <button
              className="sec"
              type="button"
              onClick={() => pushComponent({ type: 'text', text: 'Text', font: lastFont }, true)}
            >
              + Add border text
            </button>
          </div>
          <input
            ref={bfileRef}
            type="file"
            accept=".svg,.png,.stl,.obj"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files, true);
              e.target.value = '';
            }}
          />
          <textarea
            placeholder="Paste SVG code for a border icon"
            style={{ marginTop: 6 }}
            value={svgBorderPaste}
            onChange={(e) => setSvgBorderPaste(e.target.value)}
          />
          <button
            className="sec"
            type="button"
            style={{ width: '100%' }}
            onClick={() => {
              const t = svgBorderPaste.trim();
              if (/<svg/i.test(t)) {
                pushComponent({ type: 'svg', name: 'pasted', data: t }, true);
                setSvgBorderPaste('');
              }
            }}
          >
            Add pasted SVG to border
          </button>
          <div className="note">
            Each icon sits centred on the border. The border is cut away under the icon’s whole area (gaps and openings
            included), so it never shows through.
          </div>
        </details>

        <details open>
          <summary>Keyring hole</summary>
          <div className="row">
            <div>
              <label htmlFor="rso">Outer shape</label>
              <select id="rso" value={ui.rso} onChange={(e) => setUiField('rso', e.target.value)}>
                <option value="circle">Circle</option>
                <option value="heart">Heart</option>
                <option value="flower">Flower</option>
                <option value="rect">Rectangle</option>
                <option value="pent">Pentagon</option>
                <option value="hex">Hexagon</option>
              </select>
            </div>
            <div>
              <label htmlFor="rsi">Hole shape</label>
              <select id="rsi" value={ui.rsi} onChange={(e) => setUiField('rsi', e.target.value)}>
                <option value="circle">Round</option>
                <option value="rect">Rectangle</option>
                <option value="pent">Pentagon</option>
                <option value="hex">Hexagon</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="rro">Rotate outer shape (°)</label>
              <input type="number" id="rro" step={5} value={ui.rro} onChange={(e) => setUiField('rro', e.target.value)} />
            </div>
            <div>
              <label htmlFor="rri">Rotate hole (°)</label>
              <input type="number" id="rri" step={5} value={ui.rri} onChange={(e) => setUiField('rri', e.target.value)} />
            </div>
          </div>
          <NumberFields fields={RING_FIELDS} ui={ui} onChange={setUiField} />
          <label>Hole padding (mm) — moves the hole away from that side, the outer shape keeps its size</label>
          <div className="row">
            {['rpt', 'rpb', 'rpl', 'rpr'].map((id, i) => (
              <div key={id}>
                <label htmlFor={id}>{['Top', 'Bottom', 'Left', 'Right'][i]}</label>
                <input
                  type="number"
                  id={id}
                  min={-50}
                  step={0.5}
                  value={ui[id]}
                  onChange={(e) => setUiField(id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <label>Move the whole keyring — outer shape and hole together (mm). Each value pushes it away from that side</label>
          <div className="row">
            {['rmt', 'rmb', 'rml', 'rmr'].map((id, i) => (
              <div key={id}>
                <label htmlFor={id}>{['Top', 'Bottom', 'Left', 'Right'][i]}</label>
                <input
                  type="number"
                  id={id}
                  min={-100}
                  step={0.5}
                  value={ui[id]}
                  onChange={(e) => setUiField(id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <label htmlFor="rth">Ring height (mm)</label>
          <input type="number" id="rth" min={0.2} step={0.2} value={ui.rth} onChange={(e) => setUiField('rth', e.target.value)} />
          <label className="ck">
            <input type="checkbox" checked={ui.rslope} onChange={(e) => setUiField('rslope', e.target.checked)} />
            Slope: use different left / right heights
          </label>
          {!ui.rslope ? null : (
            <div className="row">
              <div>
                <label htmlFor="rhl">Left side height</label>
                <input type="number" id="rhl" min={0.2} step={0.2} value={ui.rhl} onChange={(e) => setUiField('rhl', e.target.value)} />
              </div>
              <div>
                <label htmlFor="rhr">Right side height</label>
                <input type="number" id="rhr" min={0.2} step={0.2} value={ui.rhr} onChange={(e) => setUiField('rhr', e.target.value)} />
              </div>
            </div>
          )}
          <label htmlFor="cr">Hole / ring colour</label>
          <input type="color" id="cr" value={ui.cr} onChange={(e) => setUiField('cr', e.target.value)} />
        </details>

        <details open>
          <summary>Fonts</summary>
          <label htmlFor="gf">Google font (link or name)</label>
          <div className="row">
            <div>
              <input
                type="text"
                id="gf"
                placeholder="https://fonts.googleapis.com/css2?family=Lobster"
                value={gfInput}
                onChange={(e) => setGfInput(e.target.value)}
              />
            </div>
            <button
              className="sec"
              type="button"
              style={{ flex: '0 0 auto' }}
              onClick={async () => {
                const next = await addGoogleFonts(fonts, gfInput, setFontStatus);
                setFonts(next);
              }}
            >
              Add
            </button>
          </div>
          <div className="note">{fontStatus}</div>
        </details>

        <details open>
          <summary>Export</summary>
          <label htmlFor="kname">Keychain name (used for file names)</label>
          <input
            type="text"
            id="kname"
            placeholder="my-keychain"
            value={ui.kname}
            onChange={(e) => setUiField('kname', e.target.value)}
          />
          <label htmlFor="fmt">Export format</label>
          <select id="fmt" value={ui.fmt} onChange={(e) => setUiField('fmt', e.target.value)}>
            <option value="3mf">3MF (colours, slicer-ready)</option>
            <option value="obj">OBJ + MTL (colours)</option>
            <option value="stl">STL (full model + one STL per colour)</option>
          </select>
          {dims ? <div className="note">{dims}</div> : null}
          <button
            id="dl"
            type="button"
            onClick={() => grpRef.current && downloadExport(grpRef.current, ui, comps, setInfo)}
          >
            Download (zip)
          </button>
          <div className="note">
            3MF is one file with each colour as its own part, tagged with a filament number for PrusaSlicer, OrcaSlicer
            and Bambu Studio (set the filament colours there). OBJ keeps colours in an .mtl file. STL cannot hold colour,
            so you get the full model plus one STL per colour to load together as a multi-part object. The zip only holds
            the chosen format.
          </div>
          <div className="note">{info}</div>
        </details>
      </aside>
    </div>
  );
}
