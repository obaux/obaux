import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The super admin's app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Super admin/Prototype' } satisfies Meta;

export default meta;

export const Prototype: StoryObj = screen('super-admin', 'Prototype', '/');
