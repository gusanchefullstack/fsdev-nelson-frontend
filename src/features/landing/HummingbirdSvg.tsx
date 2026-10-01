import { BODY, NODES, WING, WING_NODES, WING_ROOT, type Face, type Vec3 } from './model';

// Orthographic projection of the 3D model into a 400×400 viewBox
const S = 70;
const px = (v: Vec3, offset: Vec3 = [0, 0, 0]) => `${(v[0] + offset[0]) * S + 190},${-(v[1] + offset[1]) * S + 190}`;

function poly(f: Face, i: number, offset?: Vec3) {
  return (
    <polygon
      key={i}
      points={f.v.map((v) => px(v, offset)).join(' ')}
      fill={`var(--${f.tone})`}
      fillOpacity={1 - (f.shade ?? 0) * 0.6}
      stroke="var(--background)"
      strokeOpacity={0.35}
      strokeWidth={0.8}
    />
  );
}

/** Static hummingbird: reduced-motion / no-WebGL fallback and loading placeholder. */
export function HummingbirdSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="hb-glow">
          <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="210" cy="190" r="170" fill="url(#hb-glow)" />
      <ellipse cx="205" cy="360" rx="80" ry="12" fill="none" stroke="var(--chart-1)" strokeOpacity="0.5" />
      {WING.map((f, i) => poly(f, i, WING_ROOT))}
      {BODY.map((f, i) => poly(f, i + 100))}
      {[...NODES, ...WING_NODES.map((n) => [n[0] + WING_ROOT[0], n[1] + WING_ROOT[1], n[2]] as Vec3)].map((n, i) => (
        <circle key={i} cx={px(n).split(',')[0]} cy={px(n).split(',')[1]} r="3" fill="var(--chart-5)" />
      ))}
      <circle cx={px([1.25, 0.75, 0]).split(',')[0]} cy={px([1.25, 0.75, 0]).split(',')[1]} r="3.5" fill="var(--background)" />
    </svg>
  );
}
