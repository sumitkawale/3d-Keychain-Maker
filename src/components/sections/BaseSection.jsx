import { useStore } from '../../state/StoreContext.jsx';
import Section from '../ui/Section.jsx';
import { SettingColor, SettingNumber, SettingSelect } from '../ui/fields.jsx';

export default function BaseSection() {
  const { settings } = useStore();
  return (
    <Section title="Base">
      <SettingSelect
        k="shape"
        label="Base shape"
        options={[['rect', 'Rounded rect'], ['pill', 'Pill'], ['ellipse', 'Oval'], ['hex', 'Hexagon'], ['cont', 'Contour (follows content)']]}
      />
      <SettingSelect
        k="cs"
        label="Contour style (only for the Contour base)"
        disabled={settings.shape !== 'cont'}
        options={[['light', 'Light (smooth, filled-in)'], ['reg', 'Regular'], ['hard', 'Hard (deep waves that follow the text)']]}
      />
      <SettingNumber k="pad" />
      <SettingNumber k="baseT" />
      <SettingColor k="cb" label="Base colour" />
    </Section>
  );
}
