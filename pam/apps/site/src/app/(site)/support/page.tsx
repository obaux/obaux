import type { Metadata } from 'next';
import { SupportScreen } from '../../../screens/SupportScreen';

export const metadata: Metadata = {
  title: 'Support',
  description: 'How Pam works, in plain language: who can do what, and why.',
};

export default function SupportPage() {
  return <SupportScreen />;
}
