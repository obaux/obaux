import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * Two ways to make the long, important screens easy to read (Will, 9 October,
 * D-416), side by side so one can be chosen: **with icons** (a round icon on
 * each card, a tick or a cross on each row) and **plain** (words only, a
 * coloured edge instead of an icon, hairlines between rows).
 *
 * Both have the same bones: who "your guide" is, said once; the short
 * version; the detail in short groups; a small copy icon top right of each
 * card that says "Copied" when it works; and on the policy, a row of jump
 * chips in place of nine stacked links. The app shows one of them, set by
 * `READING_STYLE` in `src/lib/readingStyle.ts`.
 */
const meta = { title: 'Member/Reading options' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const WhatOthersCanSeeWithIcons: Story = screen('member', 'What others can see — with icons', '/prototype/reading/what-others/', { decor: 'icons' });
export const WhatOthersCanSeePlain: Story = screen('member', 'What others can see — plain', '/prototype/reading/what-others/', { decor: 'plain' });

export const SignUpStepWithIcons: Story = screen('member', 'Sign up, What Pam shares — with icons', '/prototype/join/', { kind: 'member', step: 'privacy', decor: 'icons' });
export const SignUpStepPlain: Story = screen('member', 'Sign up, What Pam shares — plain', '/prototype/join/', { kind: 'member', step: 'privacy', decor: 'plain' });

export const PrivacyPolicyWithIcons: Story = screen('member', 'Privacy policy — with icons', '/prototype/reading/privacy/', { decor: 'icons' });
export const PrivacyPolicyPlain: Story = screen('member', 'Privacy policy — plain', '/prototype/reading/privacy/', { decor: 'plain' });
