import { useState } from 'react';
import { buildExportFiles, downloadZip, zipMulti } from '../../lib/exporters.js';
import { useStore } from '../../state/StoreContext.jsx';
import Icon from '../ui/Icon.jsx';
import Section from '../ui/Section.jsx';
import { Field, SettingSelect } from '../ui/fields.jsx';

export const formatSize = (s) => `Size: ${s.x.toFixed(1)} × ${s.y.toFixed(1)} × ${s.z.toFixed(1)} mm (X × Y × Z)`;

export default function ExportSection() {
  const { settings, comps, model, actions } = useStore();
  const [error, setError] = useState('');

  const download = () => {
    if (!model) return;
    try {
      const { slug, files } = buildExportFiles(model.group, settings, comps);
      downloadZip(zipMulti(files), `${slug}.zip`);
      setError('');
    } catch (e) {
      setError(`Could not save: ${e.message}`);
    }
  };

  const info = error
    || (model && model.bad
      ? `${model.bad} component(s) produced no geometry (empty text, or an SVG/STL without usable filled shapes).`
      : 'Sizes are in millimetres. Overlapping solids are merged by slicers on import.');

  return (
    <Section title="Export">
      <Field label="Keychain name (used for file names)">
        <input type="text" value={settings.kname} placeholder="my-keychain" onChange={(e) => actions.setSetting('kname', e.target.value, true)} />
      </Field>
      <SettingSelect
        k="fmt"
        label="Export format"
        options={[['3mf', '3MF (colours, slicer-ready)'], ['obj', 'OBJ + MTL (colours)'], ['stl', 'STL (full model + one STL per colour)']]}
      />
      <div className="note">{model ? formatSize(model.size) : ''}</div>
      <button type="button" className="dl" onClick={download}><Icon name="download" size={18} /> Download (zip)</button>
      <div className="note">
        3MF is one file with each colour as its own part, tagged with a filament number for PrusaSlicer, OrcaSlicer and Bambu Studio (set the filament colours there).
        OBJ keeps colours in an .mtl file. STL cannot hold colour, so you get the full model plus one STL per colour to load together as a multi-part object.
        The zip only holds the chosen format.
      </div>
      <div className="note">{info}</div>
    </Section>
  );
}
