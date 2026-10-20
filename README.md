# 3D Keychain Generator

A browser app (Vite + React + Three.js) that designs multi-colour 3D-printable keychains.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

Google Fonts load from the internet. Three.js and SVGLoader come from npm.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Vite entry HTML |
| `src/main.jsx` | React bootstrap |
| `src/App.jsx` | Main layout and app state |
| `src/App.css` | Styles (light / dark theme) |
| `src/components/` | UI components (cards, number fields, groups) |
| `src/hooks/useThreeViewer.js` | Canvas, camera, orbit controls |
| `src/lib/geometryCore.js` | Text/SVG/PNG/STL/OBJ geometry, contours, borders |
| `src/lib/buildModel.js` | Assembles the 3D keychain mesh |
| `src/lib/export.js` | 3MF / OBJ / STL zip export |
| `js/`, `vendor/` | Legacy static version (no build step); kept for reference |

## Features

- Text, SVG, PNG, STL and OBJ components; groups with show/hide and reorder-friendly cards.
- Google Fonts: pre-loaded list, plus add any `fonts.googleapis.com` link or font name.
- Base shapes: rounded rectangle, pill, oval, hexagon, or contour (Light / Regular / Hard).
- Borders: solid, double, dashed, dotted, beaded. Border icons and border text.
- Keyring hole with outer/hole shapes, padding, rotation, and optional slope heights.
- Undo/redo (Ctrl/Cmd+Z, Ctrl+Y) and New/clear.
- Export zip: 3MF, OBJ + MTL, or STL (full model + one STL per colour when needed).

## Notes

- SVG shapes must be filled (stroke-only icons are skipped). PNGs are traced into one-colour shapes.
- Export uses a normal browser download when not running inside claude.ai.
