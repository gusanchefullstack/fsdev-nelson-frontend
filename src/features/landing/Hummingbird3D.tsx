import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, type Group } from 'three';
import { BODY, NODES, WING, WING_NODES, WING_ROOT, type Face, type Vec3 } from './model';
import { readTones } from './tokens';
import { useThemeStore } from '@/stores/theme';

function useFacesGeometry(faces: Face[], tones: Record<string, string>) {
  return useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    for (const f of faces) {
      const c = new Color(tones[f.tone]).multiplyScalar(1 - (f.shade ?? 0));
      for (const v of f.v) {
        positions.push(...v);
        colors.push(c.r, c.g, c.b);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [faces, tones]);
}

function Nodes({ points, color }: { points: Vec3[]; color: string }) {
  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

function Wing({ tones, phase, depth, dim }: { tones: Record<string, string>; phase: number; depth: number; dim?: boolean }) {
  const ref = useRef<Group>(null);
  const geometry = useFacesGeometry(WING, tones);
  // Hummingbirds beat ~50 Hz; slowed down so the motion reads as a hover
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 9 + phase) * 0.55;
  });
  return (
    <group ref={ref} position={[WING_ROOT[0], WING_ROOT[1], depth]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors flatShading side={2} transparent opacity={dim ? 0.45 : 0.95} />
      </mesh>
      {!dim && <Nodes points={WING_NODES} color={tones['chart-5']!} />}
    </group>
  );
}

function Bird({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const resolved = useThemeStore((s) => s.resolved);
  // Re-read token colors whenever the theme changes
  const tones = useMemo(() => {
    void resolved;
    return readTones();
  }, [resolved]);
  const body = useFacesGeometry(BODY, tones);
  const ref = useRef<Group>(null);
  useFrame(({ clock }, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.y = Math.sin(t * 1.6) * 0.08;
    // Ease towards the pointer for a gentle tilt
    g.rotation.y += ((pointer.current?.x ?? 0) * 0.5 - 0.25 - g.rotation.y) * Math.min(delta * 3, 1);
    g.rotation.x += ((pointer.current?.y ?? 0) * -0.25 - g.rotation.x) * Math.min(delta * 3, 1);
  });
  return (
    <group ref={ref}>
      <Wing tones={tones} phase={Math.PI} depth={-0.25} dim />
      <mesh geometry={body}>
        <meshStandardMaterial vertexColors flatShading side={2} />
      </mesh>
      <Nodes points={NODES} color={tones['chart-5']} />
      <mesh position={[1.25, 0.75, 0.24]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color={tones.background} />
      </mesh>
      <Wing tones={tones} phase={0} depth={0.15} />
    </group>
  );
}

/** Animated low-poly hummingbird (FR-044); lazy-loaded, paused when off-screen. */
export default function Hummingbird3D({ className }: { className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true));
    io.observe(el);
    const move = (e: PointerEvent) => {
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener('pointermove', move);
    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <div ref={wrapper} className={className} aria-hidden>
      <Canvas frameloop={visible ? 'always' : 'never'} camera={{ position: [0.2, 0, 6.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <pointLight position={[-3, -2, 3]} intensity={6} />
        <Bird pointer={pointer} />
      </Canvas>
    </div>
  );
}
