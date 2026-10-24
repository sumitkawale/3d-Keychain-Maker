# 3D Keychain Generator
 
Design multi-colour, 3D-printable keychains in your browser and export them for your slicer.
 
**Live version:** https://keychain.slatewings.com
 
## What it can do
 
**Components**
- Add text, SVG, PNG, STL and OBJ components. Each has its own size, height, colour and rotation.
- Icons can be flipped horizontally or vertically, and replaced without losing their settings.
- SVG colours are kept until you change that component's colour.
- Group components into a parent with a layout (stacked or side by side), spacing and a show/hide switch.
- Reorder by dragging, or drag components into and out of groups. Any component or group can be hidden.
- Text supports multiple lines and a large built-in Google Fonts list. You can add any Google Fonts link or font name.
**Base and border**
- Base shapes: rounded rectangle, pill, oval, hexagon, or a contour that follows the content (Light, Regular or Hard).
- Border styles: solid, double line, dashed, dotted or beaded, with their own width, height and colour.
**Border icons and text**
- Place icons or text on the border at 8 positions, with rotation, padding, flip and a gap to the border.
- Each item can cut the border, or make the border go around it.
- Each item can also have its own shape under it (contour, rectangle, pill, oval or hexagon) and its own border style.
**Keyring hole**
- Outer shape: circle, heart, flower, rectangle, pentagon or hexagon. Hole shape: round, rectangle, pentagon or hexagon.
- Separate sizes for the hole and the outer shape, rotation, hole padding, and moving the whole keyring.
- Normal ring height, or a sloped ring with different left and right heights.
**Editing and export**
- Undo and redo (Ctrl/Cmd+Z, Ctrl+Y), plus a New / clear button that can itself be undone.
- Live 3D preview with rotate and zoom, and the total size (X × Y × Z mm) shown before you download.
- Export to a zip in one of three formats:
  - **3MF**: one file with each colour as its own part, tagged with a filament number.
  - **OBJ + MTL**: colours stored in the .mtl file.
  - **STL**: the full model plus one STL per colour.
- Name your keychain to set the file names.
## How it works
 
1. Every change updates the app's state (components, border items and settings), which also feeds undo and redo.
2. A short moment after the last change, the app rebuilds the whole keychain as a 3D model:
   - Text, SVGs and PNGs are turned into outlines and extruded to the height you set. STL and OBJ files are scaled to size.
   - Contours and borders are drawn on a hidden canvas, traced into smooth outlines, then extruded.
   - Parts are grouped by colour so they can be exported as separate print parts.
3. The preview shows that same model, and the export button writes it to the format you chose and downloads it as a zip.
SVG shapes must be filled (stroke-only icons are skipped). PNGs become one-colour shapes.
 
## How to run it
 
Requires Node.js 18 or newer.
 
```bash
npm install
npm run dev        # development server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```
 
Google Fonts load from the internet. Everything else works offline.
 
Built with React, Vite and Three.js.