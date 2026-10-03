import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The program lead's app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Program lead/Prototype' } satisfies Meta;

export default meta;

/**
 * Starts at Sign in (D-249): "Send me a code" carries on into the whole of
 * joining as this kind of person — any code works, nothing is written — and
 * ends at Home, signed in, where every tap goes where it would on a phone.
 */
export const Prototype: StoryObj = screen('provider', 'Prototype', '/prototype/signin/', { kind: 'provider' });
