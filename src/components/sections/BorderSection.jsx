import Section from '../ui/Section.jsx';
import { SettingColor, SettingNumber, SettingSelect } from '../ui/fields.jsx';

export default function BorderSection() {
  return (
    <Section title="Border">
      <SettingSelect
        k="bs"
        label="Border style"
        options={[['none', 'No border'], ['solid', 'Solid'], ['double', 'Double line'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['beaded', 'Beaded (touching pearls)']]}
      />
      <SettingNumber k="bord" />
      <SettingNumber k="rel" />
      <SettingColor k="cd" label="Border colour" />
    </Section>
  );
}
