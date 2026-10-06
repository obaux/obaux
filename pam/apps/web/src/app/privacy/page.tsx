import { PRIVACY } from '@pam/config';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Privacy — Pam' };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
