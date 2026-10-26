import { useSyncExternalStore } from 'react';

export const GF_DEFAULT_URL =
  'https://fonts.googleapis.com/css2?family=Bitcount+Ink:wght@100..900&family=Sacramento&family=Saira+Extra+Condensed:wght@100;200;300;400;500;600;700;800;900&family=Saira+Semi+Condensed:wght@100;200;300;400;500;600;700;800;900&family=Saira+Stencil:ital,wght@0,100..900;1,100..900&family=Saira:ital,wght@0,100..900;1,100..900&family=Salsa&family=Sarina&family=Sarpanch:wght@400;500;600;700;800;900&family=Science+Gothic:wght@100..900&family=Sekuya&family=Share+Tech&family=Share:ital,wght@0,400;0,700;1,400;1,700&family=Shojumaru&family=Sigmar&family=Sigmar+One&family=Skranji:wght@400;700&family=Slackey&family=Spirax&family=Staatliches&family=Style+Script&family=Sue+Ellen+Francisco&family=Sunflower:wght@300&family=Sunshiney&family=Supermercado+One&display=swap';

const BASE_FONTS = [
  { n: 'Roboto Slab', css: '800 140px "Roboto Slab",serif' },
  { n: 'Bungee', css: '400 140px Bungee,sans-serif' },
  { n: 'Pacifico', css: '400 140px Pacifico,cursive' },
  { n: 'Permanent Marker', css: '400 140px "Permanent Marker",cursive' },
  { n: 'Arial Bold', css: 'bold 140px Arial,sans-serif' },
  { n: 'Courier Bold', css: 'bold 140px "Courier New",monospace' },
];

let fonts = BASE_FONTS;
let fontInputs = [];
let lastFont = 'Roboto Slab';
const subs = new Set();
const emit = () => subs.forEach((s) => s());

export const getFonts = () => fonts;
export const fcss = (name) => (fonts.find((f) => f.n === name) || fonts[0]).css;
/** CSS font shorthand used to preview a font in the picker. */
export const previewFont = (f) => f.css.replace('140px', '17px');
/** Links / names the user added, so they can be reloaded with a saved project. */
export const getFontInputs = () => fontInputs;
export const getLastFont = () => lastFont;
export const setLastFont = (n) => { lastFont = n; };

export function useFonts() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, getFonts);
}

/** Turns "Name:wght@100..900" style family specs into {n, wt}. */
function parseFamilies(fam) {
  return fam.map((f) => {
    const i = f.indexOf(':');
    const n = (i < 0 ? f : f.slice(0, i)).trim();
    const spec = i < 0 ? '' : f.slice(i + 1);
    const ws = [];
    spec.replace(/^[^@]*@/, '').split(';').forEach((it) => {
      const p = it.split(',').pop().trim();
      const r = p.match(/^(\d{3})\.\.(\d{3})$/);
      if (r) ws.push([+r[1], +r[2]]);
      else if (/^\d{3}$/.test(p)) ws.push([+p, +p]);
    });
    return { n, wt: ws.length && !ws.some((r) => r[0] <= 400 && r[1] >= 400) ? ws[0][0] : 400 };
  }).filter((f) => f.n);
}

function addFonts(list) {
  const next = [...fonts];
  let added = 0;
  list.forEach((f) => {
    if (!next.some((x) => x.n === f.n)) {
      next.push({ n: f.n, css: `${f.wt} 140px "${f.n}",sans-serif` });
      added += 1;
    }
  });
  fonts = next;
  emit();
  return added;
}

/** Registers the bundled Google Fonts list (the stylesheet itself is linked from index.html). */
export function seedDefaultFonts() {
  addFonts(parseFamilies(new URL(GF_DEFAULT_URL).searchParams.getAll('family')));
}

/** Loads a fonts.googleapis.com link (or comma separated font names) and adds the families. */
export function addGoogleFonts(input) {
  const v = input.trim();
  return new Promise((resolve) => {
    if (!v) return resolve('');
    let url;
    let fam;
    if (/^https?:/i.test(v)) {
      let u;
      try { u = new URL(v); } catch { return resolve('That link is not valid.'); }
      if (u.hostname !== 'fonts.googleapis.com') return resolve('Only fonts.googleapis.com links are supported.');
      fam = u.searchParams.getAll('family');
      url = v;
    } else {
      fam = v.split(',').map((s) => s.trim()).filter(Boolean);
      url = 'https://fonts.googleapis.com/css2?' + fam.map((f) => 'family=' + encodeURIComponent(f).replace(/%20/g, '+')).join('&') + '&display=swap';
    }
    const list = parseFamilies(fam);
    if (!list.length) return resolve('No font families found.');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = async () => {
      for (const f of list) {
        try { await document.fonts.load(`${f.wt} 140px "${f.n}",sans-serif`, 'Ag'); } catch { /* ignore */ }
      }
      const added = addFonts(list);
      if (!fontInputs.includes(v)) fontInputs = [...fontInputs, v];
      resolve(`Added ${added} font(s)${added < list.length ? ` (${list.length - added} already in the list)` : ''}. Earlier fonts are kept.`);
    };
    link.onerror = () => { link.remove(); resolve('Could not load that link. Check it and try again.'); };
    document.head.append(link);
  });
}

/** Re-adds fonts a saved project used (skips ones already added). */
export async function restoreFonts(inputs) {
  for (const input of inputs || []) {
    if (!fontInputs.includes(input)) await addGoogleFonts(input);
  }
}
