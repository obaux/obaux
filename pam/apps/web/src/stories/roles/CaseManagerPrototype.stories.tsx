import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The case manager's app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Case manager/Prototype' } satisfies Meta;

export default meta;

export const Prototype: StoryObj = screen('case-manager', 'Prototype', '/');
