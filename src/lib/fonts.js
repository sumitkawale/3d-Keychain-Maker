import { BUILTIN_FONTS, GOOGLE_FONTS_BUNDLE_URL } from './defaults/typography.js';

export const GFURL = GOOGLE_FONTS_BUNDLE_URL;

export const famList = (fam) =>
  fam
    .map((f) => {
      const i = f.indexOf(':'),
        n = (i < 0 ? f : f.slice(0, i)).trim(),
        sp = i < 0 ? '' : f.slice(i + 1),
        ws = [];
      sp
        .replace(/^[^@]*@/, '')
        .split(';')
        .forEach((it) => {
          const p = it.split(',').pop().trim(),
            r = p.match(/^(\d{3})\.\.(\d{3})$/);
          if (r) ws.push([+r[1], +r[2]]);
          else if (/^\d{3}$/.test(p)) ws.push([+p, +p]);
        });
      return { n, wt: ws.length && !ws.some((r) => r[0] <= 400 && r[1] >= 400) ? ws[0][0] : 400 };
    })
    .filter((f) => f.n);

export function createFontList() {
  const fonts = [...BUILTIN_FONTS];
  famList(new URL(GFURL).searchParams.getAll('family')).forEach((f) => {
    if (!fonts.some((x) => x.n === f.n)) fonts.push({ n: f.n, css: `${f.wt} 140px "${f.n}",sans-serif` });
  });
  return fonts;
}

export function getFcss(fonts, name) {
  return (fonts.find((f) => f.n === name) || fonts[0]).css;
}

export function fontPreviewStyle(fonts, name) {
  const f = fonts.find((x) => x.n === name) || fonts[0];
  return f.css.replace('140px', '17px');
}

export async function addGoogleFonts(fonts, input, onStatus) {
  const v = input.trim();
  if (!v) return fonts;
  let url, fam;
  if (/^https?:/i.test(v)) {
    let u;
    try {
      u = new URL(v);
    } catch (e) {
      onStatus('That link is not valid.');
      return fonts;
    }
    if (u.hostname !== 'fonts.googleapis.com') {
      onStatus('Only fonts.googleapis.com links are supported.');
      return fonts;
    }
    fam = u.searchParams.getAll('family');
    url = v;
  } else {
    fam = v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    url =
      'https://fonts.googleapis.com/css2?' +
      fam.map((f) => 'family=' + encodeURIComponent(f).replace(/%20/g, '+')).join('&') +
      '&display=swap';
  }
  const list = famList(fam);
  if (!list.length) {
    onStatus('No font families found.');
    return fonts;
  }
  onStatus('Loading…');
  await new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.onload = resolve;
    l.onerror = () => {
      onStatus('Could not load that link. Check it and try again.');
      l.remove();
      reject(new Error('font load'));
    };
    document.head.append(l);
  }).catch(() => null);

  const next = [...fonts];
  let added = 0;
  for (const f of list) {
    if (next.some((x) => x.n === f.n)) continue;
    const css = `${f.wt} 140px "${f.n}",sans-serif`;
    try {
      await document.fonts.load(css, 'Ag');
    } catch (e) {}
    next.push({ n: f.n, css });
    added++;
  }
  onStatus(
    `Added ${added} font(s)${added < list.length ? ` (${list.length - added} already in the list)` : ''}. Earlier fonts are kept.`,
  );
  return next;
}
