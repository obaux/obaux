import { PRIVACY } from '@pam/config';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Privacy — PAM' };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
