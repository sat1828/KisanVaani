import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useTheme } from '../hooks/useTheme';
import * as THREE from 'three';

/**
 * Detects prefers-reduced-motion. The full WebGL particle scene below is
 * decorative, not load-bearing — for users who've told their OS they
 * don't want motion (often for vestibular/motion-sensitivity reasons,
 * not just preference), we skip mounting the Canvas entirely rather than
 * just slowing the animation down. This also helps low-end phones, which
 * matters specifically for this product given its target users.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function FloatingParticles({ count = 50, color = '#22c55e' }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, [count]);

  const scales = useMemo(() => {
    return Float32Array.from(
      Array.from({ length: count }, () => 0.02 + Math.random() * 0.08)
    );
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      dummy.position.set(
        positions[i3] + Math.sin(time * 0.3 + i) * 0.5,
        positions[i3 + 1] + Math.cos(time * 0.2 + i) * 0.5,
        positions[i3 + 2] + Math.sin(time * 0.1 + i) * 0.3
      );
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        time * 0.1 + i,
        time * 0.15 + i,
        0
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.6}
        roughness={0.2}
        metalness={0.1}
        envMapIntensity={1}
      />
    </instancedMesh>
  );
}

function RotatingRing({ radius = 3, color = '#22c55e', speed = 0.5, offset = 0 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * speed + offset;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + offset) * 0.1;
  });

  const dots = useMemo(() => {
    const arr = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      arr.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: 0.03 + Math.random() * 0.05,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group ref={groupRef}>
      {dots.map((dot, i) => (
        <mesh key={i} position={[dot.x, 0, dot.z]}>
          <sphereGeometry args={[dot.scale, 6, 6]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.8}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color={isDark ? '#4ade80' : '#22c55e'} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={isDark ? '#facc15' : '#eab308'} />

      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <MeshDistortMaterial
            color={isDark ? '#22c55e' : '#15803d'}
            roughness={0.3}
            metalness={0.1}
            distort={0.1}
            speed={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      </Float>

      <FloatingParticles count={40} color={isDark ? '#4ade80' : '#22c55e'} />
      <RotatingRing radius={2.5} color={isDark ? '#4ade80' : '#22c55e'} speed={0.3} offset={0} />
      <RotatingRing radius={4} color={isDark ? '#facc15' : '#eab308'} speed={-0.2} offset={1.5} />
    </>
  );
}

export default function Particles3D() {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-radial from-primary-500/10 via-transparent to-transparent"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
