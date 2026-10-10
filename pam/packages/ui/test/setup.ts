import '@testing-library/jest-dom/vitest';

// jsdom has no `matchMedia`, and Astryx's BottomSheet asks for it as soon as it
// is drawn, open or not. A plain "nothing matches" stand-in, so a component with
// a drawer can be rendered here; a test that cares about a media query stubs its
// own (`behaviour.test.tsx` does).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// ...and no `<dialog>` methods: Astryx draws a drawer as a modal dialog. These
// open and close it the way a browser's `open` attribute does, without the top
// layer, so what is inside can be found and clicked.
if (typeof HTMLDialogElement !== 'undefined') {
  const dialog = HTMLDialogElement.prototype;
  if (typeof dialog.showModal !== 'function') {
    dialog.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof dialog.show !== 'function') {
    dialog.show = function show(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof dialog.close !== 'function') {
    dialog.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
