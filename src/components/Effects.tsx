import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';

interface Particle {
  active: boolean;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  scale: number;
  type: number; // 0: accel, 1: brake, 2: drift
}

const MAX_PARTICLES = 1000;
const particles: Particle[] = Array.from({ length: MAX_PARTICLES }).map(() => ({
  active: false,
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  life: 0,
  scale: 1,
  type: 0
}));

let currentParticleIdx = 0;

export const emitParticle = (pos: [number, number, number], vel: [number, number, number], type: number) => {
  // Simple ring buffer to find next particle
  const startIdx = currentParticleIdx;
  while (true) {
    if (!particles[currentParticleIdx].active) {
      const p = particles[currentParticleIdx];
      p.active = true;
      p.position = [...pos];
      p.velocity = [...vel];
      p.life = 1.0;
      p.type = type;
      p.scale = type === 2 ? 0.3 + Math.random() * 0.8 : 0.1 + Math.random() * 0.3;
      return;
    }
    currentParticleIdx = (currentParticleIdx + 1) % MAX_PARTICLES;
    if (currentParticleIdx === startIdx) break; // Array full
  }
};

export const Effects = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const colorAccel = useMemo(() => new Color('#00bbff'), []);
  const colorBrake = useMemo(() => new Color('#ff2200'), []);
  const colorDrift = useMemo(() => new Color('#888888'), []);
  const colorExplosion = useMemo(() => new Color('#ff5500'), []);
  const colorGlass = useMemo(() => new Color('#ddffff'), []);

  useEffect(() => {
    // Initialize all to invisible
    if (meshRef.current) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let needsUpdate = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
      if (p.active) {
        needsUpdate = true;
        p.life -= delta * (p.type === 2 ? 1.0 : 2.0); // Drift particles live longer
        if (p.life <= 0) {
          p.active = false;
          dummy.scale.set(0, 0, 0);
        } else {
          p.position[0] += p.velocity[0] * delta;
          p.position[1] += p.velocity[1] * delta;
          p.position[2] += p.velocity[2] * delta;
          p.velocity[1] += delta * 2.0; // Float upwards
          
          dummy.position.set(p.position[0], p.position[1], p.position[2]);
          const lifeProgress = p.life < 0.2 ? p.life * 5 : 1; 
          const s = p.scale * lifeProgress;
          dummy.scale.set(s, s, s);
          
          if (p.type === 2) {
             // Drift smoke gets larger as it dissipates
             dummy.scale.set(s * (2.0 - p.life), s * (2.0 - p.life), s * (2.0 - p.life));
          } else if (p.type === 3) {
             // Explosion expands quickly
             const expS = s * (3.0 - p.life * 2.0) * 4.0;
             dummy.scale.set(expS, expS, expS);
          } else if (p.type === 4) {
             // Glass shards
             dummy.scale.set(s * 0.5, s * 0.5, s * 0.5);
          }

          const c = p.type === 0 ? colorAccel : p.type === 1 ? colorBrake : p.type === 3 ? colorExplosion : p.type === 4 ? colorGlass : colorDrift;
          meshRef.current.setColorAt(i, c);
        }
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (needsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial 
        transparent 
        opacity={0.6} 
        transmission={0.4}
        roughness={0.9} 
      />
    </instancedMesh>
  );
};
