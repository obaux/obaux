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
 *   - **The page does not scroll while you sign** (`touch-action: none`).
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
    cursor: 'crosshair',
  },
  // The line you sign on, with the "x" in front of it, as on paper.
  line: {
    position: 'absolute',
    insetInline: '24px',
    bottom: '44px',
    borderBottomWidth: '1.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'oklch(0.85 0 0)',
    pointerEvents: 'none',
  },
  x: { position: 'absolute', left: '24px', bottom: '50px', pointerEvents: 'none' },
  xText: { fontSize: '20px', color: 'oklch(0.6 0 0)' },
  hint: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    paddingBottom: '20px',
  },
  hintText: { fontSize: '17px', color: 'oklch(0.55 0 0)' },
});

export function SignaturePad({ label, placeholder, onInkChange, ref }: SignaturePadProps) {
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
      <HStack aria-hidden xstyle={styles.x}>
        <Text xstyle={styles.xText}>×</Text>
      </HStack>
      {hasInk ? null : (
        <HStack aria-hidden align="center" justify="center" xstyle={styles.hint}>
          <Text xstyle={styles.hintText}>{placeholder}</Text>
        </HStack>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        {...stylex.props(styles.canvas)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
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
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
        }}
      />
    </VStack>
  );
}
