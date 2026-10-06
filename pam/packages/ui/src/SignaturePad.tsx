'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent, type Ref } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A box to sign in with a finger (D-270).
 *
 * Astryx has no signature field, and a `<canvas>` is the only element that
 * can take a drawing, so this is the one place Pam draws its own control.
 * What it keeps to:
 *
 *   - **Paper, in both themes.** The box is white with dark ink even in dark
 *     mode, because the signature is saved as a picture and shown again on
 *     other screens; light ink saved in the dark would vanish in the light.
 *   - **Every touch in the box draws, and nothing else** (D-333). The page
 *     does not scroll, the sheet does not drag, and pull-to-refresh and the
 *     back swipe do not fire: `touch-action: none`, pointer capture, and the
 *     pointer and touch events stop here (a non-passive touch listener calls
 *     `preventDefault`). A stroke that leaves the box keeps drawing, clipped
 *     at its edge, until the finger lifts; `onDrawingChange` lets the sheet
 *     hold still for that long.
 *   - **Typed is a signature too.** `setTyped(name)` writes a name into the
 *     box instead, for anybody who cannot draw one (a tremor, a screen
 *     reader, a cracked screen) — the sheet offers it as "Type my name
 *     instead".
 *
 * `onInkChange` says whether there is anything in the box, so the sheet can
 * hold its Sign button until there is.
 */
export interface SignaturePadHandle {
  /** The signature as a PNG data URL, or null when the box is empty. */
  readonly toDataURL: () => string | null;
  readonly clear: () => void;
  /** Writes `name` into the box in place of a drawing; empty clears it. */
  readonly setTyped: (name: string) => void;
}

export interface SignaturePadProps {
  /** The box's accessible name: "Signature box. Draw your signature here." */
  readonly label: string;
  /** Shown in the empty box: "Sign here". */
  readonly placeholder: string;
  readonly onInkChange?: (hasInk: boolean) => void;
  /** True from the finger going down in the box until it lifts (D-333). */
  readonly onDrawingChange?: (isDrawing: boolean) => void;
  readonly ref?: Ref<SignaturePadHandle>;
}

const HEIGHT = 180;
const INK = 'oklch(0.2 0 0)';

const styles = stylex.create({
  frame: {
    position: 'relative',
    width: '100%',
    height: `${HEIGHT}px`,
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    cursor: 'crosshair',
  },
  // The line you sign on, with a faint "Sign here" on it (D-333: the "×"
  // read as a delete button; Clear already resets).
  line: {
    position: 'absolute',
    insetInline: '24px',
    bottom: '44px',
    borderBottomWidth: '1.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'oklch(0.85 0 0)',
    pointerEvents: 'none',
  },
  signHere: { position: 'absolute', left: '24px', bottom: '50px', pointerEvents: 'none', userSelect: 'none' },
  signHereText: { fontSize: '15px', color: 'oklch(0.68 0 0)' },
});

export function SignaturePad({ label, placeholder, onInkChange, onDrawingChange, ref }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const announce = useCallback(
    (next: boolean) => {
      setHasInk(next);
      onInkChange?.(next);
    },
    [onInkChange],
  );

  // Sharp on a high-density screen: the drawing surface is sized in device
  // pixels and scaled back. Done when the box first has a size — a sheet
  // still opening can mount it at zero, so drawing and typing check again.
  const ensureSized = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) return null;
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (w > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.75;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    return ctx;
  }, []);

  useEffect(() => {
    ensureSized();
  }, [ensureSized]);

  // Native touch events too: the sheet listens for them on its body, and
  // only a non-passive listener can cancel the browser's own gestures.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hold = (event: TouchEvent) => {
      event.stopPropagation();
      if (event.cancelable) event.preventDefault();
    };
    const lift = (event: TouchEvent) => event.stopPropagation();
    canvas.addEventListener('touchstart', hold, { passive: false });
    canvas.addEventListener('touchmove', hold, { passive: false });
    canvas.addEventListener('touchend', lift);
    canvas.addEventListener('touchcancel', lift);
    return () => {
      canvas.removeEventListener('touchstart', hold);
      canvas.removeEventListener('touchmove', hold);
      canvas.removeEventListener('touchend', lift);
      canvas.removeEventListener('touchcancel', lift);
    };
  }, []);

  const setDrawing = useCallback(
    (next: boolean) => {
      if (drawing.current === next) return;
      drawing.current = next;
      onDrawingChange?.(next);
    },
    [onDrawingChange],
  );

  const stop = (event: PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDrawing(false);
    last.current = null;
  };

  const wipe = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      toDataURL: () => (hasInk ? (canvasRef.current?.toDataURL('image/png') ?? null) : null),
      clear: () => {
        wipe();
        announce(false);
      },
      setTyped: (name: string) => {
        wipe();
        const canvas = canvasRef.current;
        const ctx = ensureSized();
        const trimmed = name.trim();
        if (!canvas || !ctx || !trimmed) {
          announce(false);
          return;
        }
        const { width } = canvas.getBoundingClientRect();
        let size = 40;
        ctx.textBaseline = 'alphabetic';
        // Shrink to fit a long name on the line.
        do {
          ctx.font = `italic 500 ${size}px Figtree, system-ui, sans-serif`;
          size -= 2;
        } while (ctx.measureText(trimmed).width > width - 72 && size > 16);
        ctx.fillText(trimmed, 48, HEIGHT - 52);
        announce(true);
      },
    }),
    [announce, ensureSized, hasInk, wipe],
  );

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return (
    <VStack xstyle={styles.frame}>
      <HStack aria-hidden xstyle={styles.line} />
      <HStack aria-hidden xstyle={styles.signHere}>
        <Text xstyle={styles.signHereText}>{placeholder}</Text>
      </HStack>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        {...stylex.props(styles.canvas)}
        onPointerDown={(event) => {
          // Held here until the finger lifts, even outside the box.
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrawing(true);
          const p = point(event);
          last.current = p;
          const ctx = ensureSized();
          if (ctx) {
            // A tap leaves a dot, as a pen would.
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
          if (!hasInk) announce(true);
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          if (!drawing.current || !last.current) return;
          const ctx = event.currentTarget.getContext('2d');
          if (!ctx) return;
          const p = point(event);
          // A curve through the midpoint, so a quick stroke stays smooth
          // instead of a chain of straight segments.
          const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
          ctx.beginPath();
          ctx.moveTo(last.current.x, last.current.y);
          ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          last.current = p;
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={() => {
          setDrawing(false);
          last.current = null;
        }}
      />
    </VStack>
  );
}
