import type { Meta, StoryObj } from '@storybook/nextjs';
import { LegalView } from '../../../screens/LegalView';
import { LanguageView } from '../../../screens/LanguageView';
import { HelpReportPlaceView, HelpSafetyView, HelpTopicsView, HelpView } from '../../../screens/HelpViews';
import { DataCopyView, DeleteAccountView, PrivacyControlsView } from '../../../screens/PrivacyViews';
import { TransparencyReading } from '../../../screens/TransparencyReading';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '../../../lib/i18n';
import { asRedesign } from '../../journeys/journey';

/**
 * The nested-page template (D-213): a round back button, then the title,
 * large; only what is under it changes. Every screen you tap into starts
 * this way — these, and Notifications, a place, a person, the policies, and
 * (compact) a conversation.
 */
const meta = {
  title: 'Member/Created/States/Nested pages',
  component: LegalView,
} satisfies Meta<typeof LegalView>;

export default meta;
type Story = StoryObj<typeof meta>;

function WhatYourGuideCanSeeFull() {
  const { t } = useI18n();
  return (
    <SubPage title={t('transparency.title')} backHref="/legal/privacy/" backLabel={t('nav.back.legal')}>
      <TransparencyReading />
    </SubPage>
  );
}

export const Legal: Story = { ...asRedesign('member', '/legal/') };
export const WhatOthersCanSee: Story = {
  ...asRedesign('member', '/legal/privacy/'),
  name: 'What others can see',
  render: () => <PrivacyControlsView />,
};
/**
 * The whole list, as the last step of signing up shows it (D-416, SOP §4.1): the guide, the short version, what your guide
 * can see, what it cannot, and — since D-541/D-543 — what a program can see, its own card because a fact only a program reads
 * (a message to it, the day you signed its rules) cannot stand under "Your guide can see".
 */
export const WhatYourGuideCanSeeInFull: Story = {
  ...asRedesign('member', '/legal/privacy/'),
  name: 'What your guide can see, in full',
  render: () => <WhatYourGuideCanSeeFull />,
};
export const DataCopy: Story = { ...asRedesign('member', '/legal/privacy/copy/'), render: () => <DataCopyView /> };
export const DeleteAccount: Story = {
  ...asRedesign('member', '/legal/privacy/delete/'),
  render: () => <DeleteAccountView />,
};
export const Language: Story = { ...asRedesign('member', '/language/'), render: () => <LanguageView /> };
export const GetHelp: Story = { ...asRedesign('member', '/help/'), render: () => <HelpView /> };
export const HelpTopics: Story = { ...asRedesign('member', '/help/topics/'), render: () => <HelpTopicsView /> };
export const HelpSafety: Story = { ...asRedesign('member', '/help/safety/'), render: () => <HelpSafetyView /> };
export const HelpReportPlace: Story = {
  ...asRedesign('member', '/help/report-place/'),
  render: () => <HelpReportPlaceView />,
};
export const GetHelpSpanish: Story = { ...GetHelp, globals: { locale: 'es' } };
