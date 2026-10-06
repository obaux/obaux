import { TERMS } from '@pam/config';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Terms of service — Pam' };

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
