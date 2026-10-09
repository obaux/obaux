import type { Metadata } from 'next';
import { SupportBrowser } from '@/components/SupportBrowser';

export const metadata: Metadata = {
  title: 'Support',
  description: 'How Pam works, in plain language: who can do what, and why.',
};

export default function SupportPage() {
  return <SupportBrowser />;
}
