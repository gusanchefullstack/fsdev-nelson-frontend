/**
 * Low-poly hummingbird shared by the 3D scene and the static SVG fallback.
 * Coordinates: x right, y up, z towards the viewer. Colors are design-token names.
 */
export type Vec3 = readonly [number, number, number];
export type Tone = 'chart-1' | 'chart-2' | 'chart-4' | 'chart-5' | 'chart-6' | 'muted-foreground';

export interface Face {
  v: readonly [Vec3, Vec3, Vec3];
  tone: Tone;
  /** 0..1 darkening applied for depth */
  shade?: number;
}

const beakTip: Vec3 = [2.4, 1.05, 0];
const head1: Vec3 = [1.0, 0.95, 0.15];
const head2: Vec3 = [1.4, 0.55, 0.25];
const head3: Vec3 = [0.7, 0.45, 0.3];
const chest1: Vec3 = [1.1, 0.05, 0.35];
const chest2: Vec3 = [0.55, -0.3, 0.35];
const back1: Vec3 = [0.2, 0.3, -0.1];
const belly: Vec3 = [0.85, -0.75, 0.2];
const tailBase: Vec3 = [0.3, -1.0, 0];
const tail1: Vec3 = [-0.25, -1.95, 0.1];
const tail2: Vec3 = [0.05, -2.1, -0.1];
const tail3: Vec3 = [0.35, -1.9, 0.05];

export const BODY: Face[] = [
  { v: [head2, beakTip, head1], tone: 'muted-foreground' },
  { v: [head1, head3, head2], tone: 'chart-1' },
  { v: [head3, chest1, head2], tone: 'chart-5' },
  { v: [head3, back1, chest2], tone: 'chart-1', shade: 0.25 },
  { v: [head3, chest2, chest1], tone: 'chart-5', shade: 0.1 },
  { v: [back1, chest2, tailBase], tone: 'chart-1', shade: 0.35 },
  { v: [chest2, belly, tailBase], tone: 'chart-4' },
  { v: [chest1, chest2, belly], tone: 'chart-1', shade: 0.15 },
  { v: [tailBase, tail1, tail2], tone: 'chart-2' },
  { v: [tailBase, tail2, tail3], tone: 'chart-4', shade: 0.2 },
];

/** Wing faces relative to the wing root, so the wing can flap around it. */
export const WING_ROOT: Vec3 = [0.45, 0.35, 0];
const r1: Vec3 = [0, 0, 0];
const r2: Vec3 = [0.45, -0.15, 0.05];
const w1: Vec3 = [-0.6, 1.55, -0.2];
const w2: Vec3 = [-1.35, 1.25, -0.1];
const w3: Vec3 = [-2.0, 0.65, 0];
const w4: Vec3 = [-2.2, -0.05, 0.1];
const w5: Vec3 = [-1.7, -0.5, 0.1];
const w6: Vec3 = [-0.85, -0.45, 0.1];

export const WING: Face[] = [
  { v: [r1, w1, w2], tone: 'chart-6' },
  { v: [r1, w2, w3], tone: 'chart-2' },
  { v: [r1, w3, w4], tone: 'chart-6', shade: 0.2 },
  { v: [r1, w4, w5], tone: 'chart-2', shade: 0.15 },
  { v: [r1, w5, w6], tone: 'chart-4', shade: 0.1 },
  { v: [r1, w6, r2], tone: 'chart-1', shade: 0.1 },
];

/** Glowing nodes at the outer vertices (the "neural" look of the drafts). */
export const NODES: Vec3[] = [beakTip, head1, chest1, belly, tail1, tail3];
export const WING_NODES: Vec3[] = [w1, w2, w3, w4, w5];
