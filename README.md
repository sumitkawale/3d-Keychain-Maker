# 3D Keychain Generator (Vite + React)

Design multi-colour, 3D-printable keychains in the browser and export them for your slicer.
Built with React 18, Vite 5 and Three.js r128 (pinned, no other runtime dependencies).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Google Fonts load from the internet; everything else works offline.

## Deploy to GitHub Pages

`vite.config.js` uses `base: './'`, so the build works from any sub-path such as `https://<user>.github.io/<repo>/` (checked by serving `dist/` from a sub-folder). There is no router, so no 404.html trick is needed.

**Option A: the `gh-pages` package**

```bash
npm install
npm run deploy      # builds, then publishes dist/ to the gh-pages branch
```

Then open the repo **Settings > Pages** and set **Source = Deploy from a branch**, **Branch = gh-pages**, **Folder = / (root)**.

**Option B: GitHub Actions** (`.github/workflows/deploy.yml` is included)

Set **Settings > Pages > Source = GitHub Actions** and push to `main`.

**If you still get a 404**

1. Pages source must match how you deploy. A green pipeline only means the files were pushed, not that Pages serves them. Branch deploy needs Source = branch `gh-pages` / root. The Actions workflow needs Source = GitHub Actions.
2. `index.html` must be at the root of the `gh-pages` branch (not inside a `dist/` folder). Publish the contents of `dist`, for example with `gh-pages -d dist`.
3. Use the right URL: `https://<user>.github.io/<repo-name>/`. The repo name is case-sensitive, and the site root `https://<user>.github.io/` shows a different (user) site.
4. After the first deploy, wait a minute or two, then check **Settings > Pages** for the "Your site is live at ..." banner, and the **Actions** tab for the "pages build and deployment" run.
5. A private repo needs a paid plan for Pages. Make the repo public or check your plan.
6. A blank page with 404s for `/assets/...` in the browser console means an absolute base was used. Keep `base: './'`, or set `base: '/<repo-name>/'`.

## Project structure

```
index.html                 Vite entry (Google Fonts stylesheets)
src/
  main.jsx                 Mounts <App/> and registers the bundled Google Fonts list
  App.jsx                  Layout: <Viewport/> + <Sidebar/> inside the store provider
  styles.css               Light/dark theme and all component styles
  state/
    reducer.js             App state + undo/redo history (edits to the same field are merged)
    tree.js                Component tree helpers (groups, move, patch, remove) and defaults
    StoreContext.jsx       Provider: state, actions, debounced model rebuild, keyboard shortcuts
  lib/                     Pure logic, no React
    constants.js           Settings fields, defaults, positions
    db.js                  IndexedDB wrapper (auto-saved draft and saved projects)
    projectFile.js         Project file format (JSON, binary data as base64)
    thumbnail.js           Renders preview images for the History page
    library.js             Creates saved projects (build + preview + store)
    fonts.js               Font list store, Google Fonts loader, useFonts() hook
    raster.js              Marching-squares tracing and canvas masks
    geometry.js            Text/SVG/PNG/STL/OBJ to geometry, base shapes, keyring shapes
    buildKeychain.js       Builds the whole keychain as a THREE.Group from the state
    exporters.js           Zip writer, STL, OBJ + MTL and 3MF export
    icons.js               Reads uploaded icon files
  components/
    HistoryPage.jsx        Saved keychains with previews (opened with #/history)
    Viewport.jsx           Three.js preview (orbit / zoom / pinch) and size readout
    Sidebar.jsx            Toolbar (undo, redo, new) and all sections
    sections/              One file per panel section (Components, Layout, Base, Border,
                           Border icons & text, Keyring hole, Fonts, Export)
    list/                  ItemCard, GroupCard and the drag-and-drop hook
    ui/                    Section, FontPicker and bound field components
```

## How it works

1. All edits go through `state/reducer.js`, which keeps `{ comps, bic, settings }` plus undo/redo stacks.
2. `StoreContext` rebuilds the 3D model 150 ms after the last change by calling `lib/buildKeychain.js`.
3. `Viewport` shows the resulting `THREE.Group`; the Export section turns the same group into a zip.

## Features

- Rotate any component, group or border item around the X, Y and Z axes (a group turns as one piece and rests on the base).
- Text, SVG, PNG, STL and OBJ components; groups (parent / child, nestable) with show / hide; drag to reorder or move into groups; move any component or group top / bottom / left / right.
- Google Fonts: bundled list plus any `fonts.googleapis.com` link or font name; font picker previews each font and supports the arrow keys.
- Base thickness 0 removes the base and main border, leaving only your components with the keyring attached to them.
- Base shapes: rounded rectangle, pill, oval, hexagon, or a contour that follows the content (Light / Regular / Hard).
- Borders: solid, double, dashed, dotted, beaded; border icons and border text with position, rotation, padding, flip and "go around" mode.
- Keyring hole: circle, heart, flower, rectangle, pentagon or hexagon outer shape; round, rectangle, pentagon or hexagon hole; rotation, padding, move, separate sizes, normal or sloped height.
- Undo / redo (Ctrl/Cmd+Z, Ctrl+Y) and a New / clear button that can be undone.
- Click a part in the 3D preview to select it: the matching card or section is highlighted and scrolled into view in the panel. Right-drag pans the view across the XY plane, and double-click recentres it.
- Auto-save to IndexedDB (survives refreshes), unique keychain IDs (`KC-XXXXXXXX`) where saving again updates the same entry, a History page with preview images, and shareable `.keychain.json` project files (save, open, import, rename, delete).
- Export a zip: 3MF (each colour is a part with a filament number), OBJ + MTL, or STL (full model plus one STL per colour).

## Notes

- SVG shapes must be filled (stroke-only icons are skipped). PNGs are traced into one-colour shapes.
- The 3MF filament numbers follow the order of colours in the model; set the real filament colours in your slicer.
