import { useStore } from '../../state/StoreContext.jsx';
import Section from '../ui/Section.jsx';
import { SettingCheck, SettingColor, SettingNumber, SettingRow, SettingSelect } from '../ui/fields.jsx';

const SIDES = (prefix) => [['t', 'Top'], ['b', 'Bottom'], ['l', 'Left'], ['r', 'Right']].map(([s, t]) => [prefix + s, t]);

export default function KeyringSection() {
  const { settings } = useStore();
  return (
    <Section title="Keyring hole">
      <div className="row">
        <div>
          <SettingSelect
            k="rso"
            label="Outer shape"
            options={[['circle', 'Circle'], ['heart', 'Heart'], ['flower', 'Flower'], ['rect', 'Rectangle'], ['pent', 'Pentagon'], ['hex', 'Hexagon']]}
          />
        </div>
        <div>
          <SettingSelect k="rsi" label="Hole shape" options={[['circle', 'Round'], ['rect', 'Rectangle'], ['pent', 'Pentagon'], ['hex', 'Hexagon']]} />
        </div>
      </div>
      <SettingRow items={[['rro', 'Rotate outer shape (°)'], ['rri', 'Rotate hole (°)']]} />
      <SettingNumber k="hole" />
      <SettingNumber k="osz" />
      <label>Hole padding (mm) — moves the hole away from that side, the outer shape keeps its size</label>
      <SettingRow items={SIDES('rp')} />
      <label>Move the whole keyring — outer shape and hole together (mm). Each value pushes it away from that side</label>
      <SettingRow items={SIDES('rm')} />
      <SettingNumber k="rth" />
      <SettingCheck k="rslope">Slope: use different left / right heights</SettingCheck>
      {settings.rslope && <SettingRow items={[['rhl', 'Left side height'], ['rhr', 'Right side height']]} />}
      <SettingColor k="cr" label="Hole / ring colour" />
    </Section>
  );
}
