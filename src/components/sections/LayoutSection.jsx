import Section from '../ui/Section.jsx';
import { SettingNumber, SettingSelect } from '../ui/fields.jsx';

export default function LayoutSection() {
  return (
    <Section title="Layout">
      <SettingSelect k="dir" label="Direction" options={[['h', 'Horizontal'], ['v', 'Vertical']]} />
      <SettingNumber k="gap" />
    </Section>
  );
}
