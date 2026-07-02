import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGameStore, CarCustomization } from '../stores/useGameStore';
import { emitParticle } from './Effects';

const Spoiler = ({ offset, detailColor }: { offset: [number, number, number], detailColor: string }) => {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = offset[1] + Math.sin(clock.elapsedTime * 3) * 0.1;
    }
  });
  return (
    <group position={[offset[0], 0, offset[2]]} ref={ref}>
      <mesh position={[-0.6, 0.2, 0]} castShadow><boxGeometry args={[0.05, 0.4, 0.1]} /><meshPhysicalMaterial color="#222" transmission={0.9} roughness={0.1} /></mesh>
      <mesh position={[0.6, 0.2, 0]} castShadow><boxGeometry args={[0.05, 0.4, 0.1]} /><meshPhysicalMaterial color="#222" transmission={0.9} roughness={0.1} /></mesh>
      <mesh position={[0, 0.4, 0.1]} castShadow><boxGeometry args={[1.6, 0.05, 0.4]} /><meshPhysicalMaterial color={detailColor} emissive={detailColor} emissiveIntensity={2} transparent opacity={0.8} /></mesh>
    </group>
  );
};

const Stripes = ({ length, yOffset, zOffset, detailColor }: { length: number, yOffset: number, zOffset: number, detailColor: string }) => {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.z = zOffset + Math.sin(clock.elapsedTime * 5) * 0.1;
    }
  });
  return (
    <group position={[0, yOffset, 0]} ref={ref}>
      <mesh position={[-0.2, 0, 0]}><boxGeometry args={[0.15, 0.02, length]} /><meshPhysicalMaterial color={detailColor} emissive={detailColor} emissiveIntensity={3} /></mesh>
      <mesh position={[0.2, 0, 0]}><boxGeometry args={[0.15, 0.02, length]} /><meshPhysicalMaterial color={detailColor} emissive={detailColor} emissiveIntensity={3} /></mesh>
    </group>
  );
};

export const SurrealAura = ({ color }: { color: string }) => {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI/2, Math.PI/4, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 64]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI/3]}>
        <torusGeometry args={[2.2, 0.01, 16, 64]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
};

export const CarModelView = ({ model, colorFallback, customization }: { model: string, colorFallback?: string, customization?: CarCustomization }) => {
  const col = customization?.color || colorFallback || "hotpink";
  const detailCol = customization?.detailColor || "#ffffff";
  const hasSpoiler = customization?.hasSpoiler || false;
  const hasDecals = customization?.hasDecals || false;

  const baseMaterial = {
    color: col,
    clearcoat: 1.0,
    roughness: 0.1,
    metalness: 0.9,
    iridescence: 1.0,
    iridescenceIOR: 2.0,
    transmission: 0.3,
    transparent: true,
    opacity: 0.95,
  };

  if (model === 'f1') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Main Body */}
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[1.0, 0.5, 4.5]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.2} />
        </mesh>
        {/* Cockpit / Halo */}
        <mesh castShadow position={[0, 0.7, -0.5]}>
          <boxGeometry args={[0.8, 0.4, 1.2]} />
          <meshPhysicalMaterial color="#111" />
        </mesh>
        {/* Front Wing */}
        <mesh castShadow position={[0, 0.2, 2.0]}>
          <boxGeometry args={[2.2, 0.1, 0.6]} />
          <meshPhysicalMaterial color="#222" roughness={0.6} transmission={0.9} ior={1.5} />
        </mesh>
        {/* Rear Wing */}
        <mesh castShadow position={[0, 0.8, -2.0]}>
          <boxGeometry args={[2.0, 0.1, 0.5]} />
          <meshPhysicalMaterial color="#222" roughness={0.6} transmission={0.9} ior={1.5} />
        </mesh>
        <mesh castShadow position={[0, 0.5, -2.0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={1} />
        </mesh>
        {hasDecals && <Stripes length={2.5} yOffset={0.56} zOffset={0.5} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.2, 0.4, 1.5],
          [1.2, 0.4, 1.5],
          [-1.2, 0.4, -1.5],
          [1.2, 0.4, -1.5],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.6, 24]} />
            <meshPhysicalMaterial color="#111" emissive={detailCol} emissiveIntensity={1.5} wireframe />
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'mini') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Car Body */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[1.6, 0.9, 3.2]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.15} />
        </mesh>
        {/* White Roof */}
        <mesh castShadow position={[0, 1.3, -0.2]}>
          <boxGeometry args={[1.4, 0.7, 1.8]} />
          <meshPhysicalMaterial color={detailCol} emissive={detailCol} emissiveIntensity={0.5} clearcoat={1.0} roughness={0.2} metalness={0.5} />
        </mesh>
        {/* Windows */}
        <mesh castShadow position={[0, 1.3, -1.1]}>
          <boxGeometry args={[1.41, 0.6, 0.1]} />
          <meshPhysicalMaterial color="currentColor" emissive={detailCol} emissiveIntensity={0.2} transmission={1.0} opacity={1} transparent roughness={0.05} />
        </mesh>
        <mesh castShadow position={[0, 1.3, 0.7]}>
          <boxGeometry args={[1.41, 0.6, 0.1]} />
          <meshPhysicalMaterial color="currentColor" emissive={detailCol} emissiveIntensity={0.2} transmission={1.0} opacity={1} transparent roughness={0.05} />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.5, 0.7, -1.61]}>
          <circleGeometry args={[0.2, 16]} />
          <meshBasicMaterial color={[5, 5, 3]} />
        </mesh>
        <mesh position={[0.5, 0.7, -1.61]}>
          <circleGeometry args={[0.2, 16]} />
          <meshBasicMaterial color={[5, 5, 3]} />
        </mesh>
        {hasDecals && <Stripes length={1.2} yOffset={1.06} zOffset={-0.9} detailColor={detailCol} />}
        {hasDecals && <Stripes length={1.8} yOffset={1.66} zOffset={-0.2} detailColor={detailCol} />}
        {hasSpoiler && <Spoiler offset={[0, 0.6, 1.4]} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-0.8, 0.35, 1.0],
          [0.8, 0.35, 1.0],
          [-0.8, 0.35, -1.0],
          [0.8, 0.35, -1.0],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshPhysicalMaterial color="#222" emissive={col} emissiveIntensity={0.8} wireframe />
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'ferrari') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Sleek Body */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[2.0, 0.6, 4.2]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.3} transmission={0.6} />
        </mesh>
        {/* Cabin */}
        <mesh castShadow position={[0, 0.9, -0.4]}>
          <boxGeometry args={[1.6, 0.5, 1.8]} />
          <meshPhysicalMaterial color="#111" clearcoat={1.0} roughness={0.1} transmission={0.9} ior={1.6} thickness={0.5} />
        </mesh>
        {/* Windows */}
        <mesh castShadow position={[0, 0.9, -1.3]}>
          <boxGeometry args={[1.61, 0.4, 0.1]} />
          <meshPhysicalMaterial color="black" transmission={0.8} opacity={1} transparent roughness={0.1} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0.5]}>
          <boxGeometry args={[1.61, 0.4, 0.1]} />
          <meshPhysicalMaterial color="black" transmission={0.8} opacity={1} transparent roughness={0.1} />
        </mesh>
        {/* Tail lights */}
        <mesh position={[-0.7, 0.5, 2.11]}>
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color={[8, 0, 0]} />
        </mesh>
        <mesh position={[0.7, 0.5, 2.11]}>
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color={[8, 0, 0]} />
        </mesh>
        {hasDecals && <Stripes length={1.5} yOffset={0.71} zOffset={-1.4} detailColor={detailCol} />}
        {hasDecals && <Stripes length={1.0} yOffset={1.16} zOffset={-0.4} detailColor={detailCol} />}
        {hasSpoiler && <Spoiler offset={[0, 0.6, 1.9]} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.1, 0.4, 1.4],
          [1.1, 0.4, 1.4],
          [-1.1, 0.4, -1.4],
          [1.1, 0.4, -1.4],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.5, 20]} />
            <meshPhysicalMaterial color="#111" transmission={0.9} roughness={0.1} />
            <mesh position={[0, 0.26, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <circleGeometry args={[0.2, 16]} />
              <meshStandardMaterial color={detailCol} emissive={detailCol} emissiveIntensity={2} />
            </mesh>
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'bmw') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Sedan Body */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[1.9, 0.8, 4.4]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.2} metalness={1.0} roughness={0.2} />
        </mesh>
        {/* Cabin */}
        <mesh castShadow position={[0, 1.2, 0]}>
          <boxGeometry args={[1.6, 0.7, 2.2]} />
          <meshPhysicalMaterial color="#1e293b" clearcoat={1.0} roughness={0.3} transmission={0.7} />
        </mesh>
        {/* Grille */}
        <mesh position={[-0.3, 0.5, -2.21]}>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color={detailCol} emissive={detailCol} emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.3, 0.5, -2.21]}>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color={detailCol} emissive={detailCol} emissiveIntensity={2} />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.8, 0.6, -2.21]}>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshBasicMaterial color={[5, 5, 5]} />
        </mesh>
        <mesh position={[0.8, 0.6, -2.21]}>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshBasicMaterial color={[5, 5, 5]} />
        </mesh>
        {/* Tail lights */}
        <mesh position={[-0.7, 0.6, 2.21]}>
          <boxGeometry args={[0.5, 0.2, 0.05]} />
          <meshBasicMaterial color={[5, 0, 0]} />
        </mesh>
        <mesh position={[0.7, 0.6, 2.21]}>
          <boxGeometry args={[0.5, 0.2, 0.05]} />
          <meshBasicMaterial color={[5, 0, 0]} />
        </mesh>
        {hasDecals && <Stripes length={1.3} yOffset={0.91} zOffset={-1.5} detailColor={detailCol} />}
        {hasDecals && <Stripes length={2.2} yOffset={1.56} zOffset={0} detailColor={detailCol} />}
        {hasSpoiler && <Spoiler offset={[0, 0.8, 2.0]} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.0, 0.4, 1.4],
          [1.0, 0.4, 1.4],
          [-1.0, 0.4, -1.4],
          [1.0, 0.4, -1.4],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            <meshPhysicalMaterial color="#111" emissive={col} emissiveIntensity={1} wireframe />
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'truck') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Truck Body */}
        <mesh castShadow position={[0, 1.5, -1]}>
          <boxGeometry args={[2.2, 2.5, 6]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.1} />
        </mesh>
        {/* Truck Cabin */}
        <mesh castShadow position={[0, 1.2, 2.5]}>
          <boxGeometry args={[2.2, 2, 2]} />
          <meshPhysicalMaterial color={detailCol} roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Windows */}
        <mesh castShadow position={[0, 1.8, 3.55]}>
          <boxGeometry args={[2, 0.8, 0.1]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
        </mesh>
        {hasDecals && <Stripes length={5.8} yOffset={2.76} zOffset={-1} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.2, 0.5, 2.5],
          [1.2, 0.5, 2.5],
          [-1.2, 0.5, -2.5],
          [1.2, 0.5, -2.5],
          [-1.2, 0.5, -1.0],
          [1.2, 0.5, -1.0],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.6, 16]} />
            <meshPhysicalMaterial color="#111" wireframe />
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'suv') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* SUV Body */}
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[2.0, 1.2, 4.5]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.1} />
        </mesh>
        {/* SUV Cabin */}
        <mesh castShadow position={[0, 1.6, -0.5]}>
          <boxGeometry args={[1.8, 0.8, 3.0]} />
          <meshPhysicalMaterial color={detailCol} transmission={0.5} roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Windows */}
        <mesh castShadow position={[0, 1.6, 1.05]}>
          <boxGeometry args={[1.7, 0.6, 0.1]} />
          <meshPhysicalMaterial color="#111" transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
        </mesh>
        {hasDecals && <Stripes length={2.8} yOffset={2.01} zOffset={-0.5} detailColor={detailCol} />}
        {hasSpoiler && <Spoiler offset={[0, 2.0, -1.8]} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.1, 0.5, 1.5],
          [1.1, 0.5, 1.5],
          [-1.1, 0.5, -1.5],
          [1.1, 0.5, -1.5],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.5, 20]} />
            <meshPhysicalMaterial color="#111" wireframe />
          </mesh>
        ))}
      </group>
    );
  }

  if (model === 'sports') {
    return (
      <group>
        <SurrealAura color={col} />
        {/* Sports Body */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[2.1, 0.5, 4.6]} />
          <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.3} />
        </mesh>
        {/* Cabin */}
        <mesh castShadow position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.6, 0.5, 1.8]} />
          <meshPhysicalMaterial color="#000" transmission={0.9} roughness={0.1} ior={1.5} />
        </mesh>
        {/* Wing */}
        <mesh castShadow position={[0, 0.8, -2.1]}>
          <boxGeometry args={[2.2, 0.1, 0.4]} />
          <meshPhysicalMaterial color={detailCol} />
        </mesh>
        <mesh castShadow position={[-0.8, 0.6, -2.1]}>
          <boxGeometry args={[0.1, 0.4, 0.3]} />
          <meshPhysicalMaterial color={detailCol} />
        </mesh>
        <mesh castShadow position={[0.8, 0.6, -2.1]}>
          <boxGeometry args={[0.1, 0.4, 0.3]} />
          <meshPhysicalMaterial color={detailCol} />
        </mesh>
        {hasDecals && <Stripes length={4.4} yOffset={0.61} zOffset={0} detailColor={detailCol} />}
        {/* Wheels */}
        {[
          [-1.1, 0.35, 1.5],
          [1.1, 0.35, 1.5],
          [-1.1, 0.35, -1.5],
          [1.1, 0.35, -1.5],
        ].map((pos, idx) => (
          <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.6, 24]} />
            <meshPhysicalMaterial color="#111" />
            <mesh position={[0, 0.31, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <circleGeometry args={[0.3, 16]} />
              <meshStandardMaterial color={detailCol} emissive={detailCol} emissiveIntensity={1.5} />
            </mesh>
          </mesh>
        ))}
      </group>
    );
  }

  // Default blocky car
  return (
    <group>
      <SurrealAura color={col} />
      {/* Car Body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.8, 1, 4]} />
        <meshPhysicalMaterial {...baseMaterial} emissive={col} emissiveIntensity={0.2} />
      </mesh>
      {/* Car Cabin */}
      <mesh castShadow position={[0, 1.2, -0.2]}>
        <boxGeometry args={[1.4, 0.8, 2]} />
        <meshPhysicalMaterial color="#333" clearcoat={1.0} clearcoatRoughness={0.1} roughness={0.3} transmission={0.9} ior={1.3} />
      </mesh>
      {/* Windows */}
      <mesh castShadow position={[0, 1.2, -1.2]}>
        <boxGeometry args={[1.41, 0.7, 0.1]} />
        <meshPhysicalMaterial color={detailCol} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0.8]}>
        <boxGeometry args={[1.41, 0.7, 0.1]} />
        <meshPhysicalMaterial color={detailCol} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-0.6, 0.5, -2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshBasicMaterial color={[5, 5, 3]} />
      </mesh>
      <mesh position={[0.6, 0.5, -2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshBasicMaterial color={[5, 5, 3]} />
      </mesh>
      {hasDecals && <Stripes length={1.5} yOffset={1.01} zOffset={-1.2} detailColor={detailCol} />}
      {hasDecals && <Stripes length={2.0} yOffset={1.61} zOffset={-0.2} detailColor={detailCol} />}
      {hasSpoiler && <Spoiler offset={[0, 0.9, 1.8]} detailColor={detailCol} />}
      {/* Wheels */}
      {[
        [-1, 0.4, 1.2],
        [1, 0.4, 1.2],
        [-1, 0.4, -1.2],
        [1, 0.4, -1.2],
      ].map((pos, idx) => (
        <mesh key={idx} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <octahedronGeometry args={[0.4, 1]} />
          <meshPhysicalMaterial color="#222" emissive={detailCol} emissiveIntensity={1} wireframe />
        </mesh>
      ))}
    </group>
  );
};

export const Car = ({ playerIndex = 0, isGhost = false }: { playerIndex?: number, isGhost?: boolean }) => {
  const carRef = useRef<Group>(null);
  const carBodyRef = useRef<Group>(null);
  const keys = useKeyboard(playerIndex);
  
  // physics state
  const speed = useRef(0);
  const angle = useRef(0);
  const driftAngle = useRef(0);
  const lastDriftTime = useRef(0);

  const cameraMode = useGameStore((state) => state.cameraMode);
  const upgrades = useGameStore((state) => state.upgrades);
  const setCameraMode = useGameStore((state) => state.setCameraMode);
  const prevCameraKey = useRef(false);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    if (!isGhost) {
      if (keys.camera && !prevCameraKey.current) {
        setCameraMode((cameraMode + 1) % 4);
      }
      prevCameraKey.current = keys.camera;
    }

    if (isGhost) {
      const pos = playerIndex === 0 ? useGameStore.getState().playerPosition : useGameStore.getState().p2Position;
      const rot = playerIndex === 0 ? useGameStore.getState().playerRotation : useGameStore.getState().p2Rotation;
      
      carRef.current.position.set(pos[0], pos[1], pos[2]);
      carRef.current.rotation.y = rot;
      return;
    }

    const activeCarModel = playerIndex === 0 ? useGameStore.getState().activeCar : useGameStore.getState().p2Car ?? 'mini';
    let maxSpeedMult = 1.0;
    let accelMult = 1.0;
    let handlingMult = 1.0;

    switch(activeCarModel) {
      case 'mini': maxSpeedMult = 1.1; accelMult = 1.2; handlingMult = 1.3; break;
      case 'bmw': maxSpeedMult = 1.4; accelMult = 1.4; handlingMult = 1.1; break;
      case 'ferrari': maxSpeedMult = 1.8; accelMult = 1.7; handlingMult = 1.2; break;
      case 'f1': maxSpeedMult = 2.3; accelMult = 2.2; handlingMult = 1.5; break;
      case 'truck': maxSpeedMult = 0.9; accelMult = 0.8; handlingMult = 0.7; break;
      case 'suv': maxSpeedMult = 1.2; accelMult = 1.1; handlingMult = 0.9; break;
      case 'sports': maxSpeedMult = 1.6; accelMult = 1.5; handlingMult = 1.2; break;
    }

    const gameMode = useGameStore.getState().gameMode;
    const weather = useGameStore.getState().weather;
    const weatherEnabled = useGameStore.getState().weatherEnabled;
    let weatherFriction = 1.0;
    
    if (weatherEnabled) {
      if (weather === 'rainy') weatherFriction = 0.6; // slippery
      if (weather === 'foggy') weatherFriction = 0.8; 
    }

    const acceleration = ((15 + upgrades.engine * 25) / 4) * accelMult * (weatherFriction === 0.6 ? 0.8 : 1.0);
    const braking = (25 + upgrades.brakes * 15) * weatherFriction;
    const maxSpeed = ((30 + upgrades.engine * 150) / 4) * maxSpeedMult;
    const turnSpeed = (2.0 + upgrades.tires * 0.4) * handlingMult * weatherFriction;

    const currentNitro = useGameStore.getState().nitroAmount;
    const isNitroActive = keys.nitro && currentNitro > 0 && keys.forward;
    const currentMaxSpeed = isNitroActive ? maxSpeed * 1.6 : maxSpeed;
    const currentAcceleration = isNitroActive ? acceleration * 3 : acceleration;

    // Only player 1 controls nitro amount
    if (playerIndex === 0) {
      if (isNitroActive) {
        useGameStore.setState(s => ({ nitroAmount: Math.max(0, s.nitroAmount - 30 * delta) }));
      } else {
        useGameStore.setState(s => ({ nitroAmount: Math.min(100, s.nitroAmount + 5 * delta) }));
      }
    }

    // Acceleration & Braking
    if (keys.forward) {
      speed.current += currentAcceleration * delta;
    }
    if (keys.backward) {
      speed.current -= braking * delta;
    }

    if (keys.brake) {
      // apply extra braking when space pressed
      if (speed.current > 0) speed.current -= braking * 1.5 * delta;
      if (speed.current < 0) speed.current += braking * 1.5 * delta;
      if (Math.abs(speed.current) < 1) speed.current = 0;
    }

    // Apply drag to gradually slow down
    speed.current -= speed.current * 0.4 * delta;

    // Cap speed
    speed.current = Math.max(-maxSpeed / 2, Math.min(speed.current, currentMaxSpeed));
    if (playerIndex === 0) {
      useGameStore.getState().setSpeed(Math.abs(speed.current));
    } else {
      useGameStore.getState().setP2Speed(Math.abs(speed.current));
    }

    // Steering 
    const canSteer = Math.abs(speed.current) > 0.5;
    let targetDrift = 0;

    if (canSteer) {
      const dir = Math.sign(speed.current);
      if (keys.left) {
        angle.current += turnSpeed * delta * dir;
        targetDrift = keys.brake ? 0.6 : 0;
      }
      if (keys.right) {
        angle.current -= turnSpeed * delta * dir;
        targetDrift = keys.brake ? -0.6 : 0;
      }
    }

    // Drift physics
    driftAngle.current += (targetDrift - driftAngle.current) * 5 * delta;

    // Update rotation
    carRef.current.rotation.y = angle.current + driftAngle.current;

    // Calculate future position
    const moveAngle = angle.current + driftAngle.current * 0.5;
    const dx = -Math.sin(moveAngle) * speed.current * delta;
    const dz = -Math.cos(moveAngle) * speed.current * delta;
    
    let nextX = carRef.current.position.x + dx;
    let nextZ = carRef.current.position.z + dz;

    // Very simple rectangle collision logic with obstacles
    let collided = false;
    const carRadius = 2.0;
    const obstacles = useGameStore.getState().obstacles;

    for (const obs of obstacles) {
      const halfW = obs.size[0] / 2;
      const halfD = obs.size[2] / 2;

      if (
        nextX > obs.position[0] - halfW - carRadius &&
        nextX < obs.position[0] + halfW + carRadius &&
        nextZ > obs.position[2] - halfD - carRadius &&
        nextZ < obs.position[2] + halfD + carRadius
      ) {
        collided = true;
        break;
      }
    }

    let trafficCollided = false;
    // Traffic collision
    const tPos = useGameStore.getState().trafficPositions;
    for (const t of tPos) {
      if (Math.abs(t[0] - nextX) < 3.5 && Math.abs(t[2] - nextZ) < 3.5) {
        collided = true;
        trafficCollided = true;
        break;
      }
    }

    const isCoop = useGameStore.getState().isCoop;
    const coopMode = useGameStore.getState().coopMode;
    const otherPlayerPos = playerIndex === 0 ? useGameStore.getState().p2Position : useGameStore.getState().playerPosition;
    
    if (isCoop && Math.abs(otherPlayerPos[0] - nextX) < 3.5 && Math.abs(otherPlayerPos[2] - nextZ) < 3.5) {
      if (coopMode === 'cops_vs_robbers') {
         // Bust the robber (P1 is robber, P2 is cop)
         // So if P2 touches P1, P1 gets busted
         useGameStore.getState().setIsCaught(true);
      } else {
         collided = true;
         trafficCollided = true;
      }
    }

    if (collided) {
      // Bounce effect and deformation
      const collisionSpeed = Math.abs(speed.current);
      speed.current = -speed.current * 0.3; 
      
      if (collisionSpeed > 5) {
         if (carBodyRef.current) {
            carBodyRef.current.scale.set(0.9, 0.8, 0.8); // Car crushes slightly
            // Add a slight rotation to simulate broken suspension or crash offset
            carBodyRef.current.rotation.z = (Math.random() - 0.5) * 0.1; 
         }
         
         // Big explosion!
         for (let i = 0; i < 20; i++) {
            emitParticle([nextX, 1, nextZ], [(Math.random()-0.5)*40, Math.random()*30, (Math.random()-0.5)*40], 3); // fire
         }
         // Glass shards
         for (let i = 0; i < 30; i++) {
            emitParticle([nextX, 2, nextZ], [(Math.random()-0.5)*30, Math.random()*20, (Math.random()-0.5)*30], 4); // glass
         }
      }
      
      if (useGameStore.getState().driftCombo > 1) {
         useGameStore.getState().setDriftCombo(1); // lose combo on crash
      }
    } else {
      carRef.current.position.x = nextX;
      carRef.current.position.z = nextZ;
      
      const updatedRot = angle.current + driftAngle.current;
      if (playerIndex === 0) {
        useGameStore.getState().setPlayerPosition([nextX, 0, nextZ]);
        useGameStore.setState({ playerRotation: updatedRot });
      } else {
        useGameStore.getState().setP2Position([nextX, 0, nextZ]);
        useGameStore.getState().setP2Rotation(updatedRot);
      }

      const curAngle = angle.current + driftAngle.current;
      const c = carRef.current.position;
      
      const v = new Vector3();
      const axisY = new Vector3(0, 1, 0);
      const getWorldPos = (lx: number, lz: number) => {
         v.set(lx, 0, lz);
         v.applyAxisAngle(axisY, curAngle);
         return [c.x + v.x, c.y + 0.1, c.z + v.z] as [number, number, number];
      };

      // Accel Exhaust (back of the car)
      if (keys.forward && Math.abs(speed.current) > 1 && Math.random() < 0.5) {
         emitParticle(getWorldPos(0, 2.0), [(Math.random() - 0.5)*2, 0, (Math.random() - 0.5)*2], 0);
      }

      // Braking Smoke (wheels)
      if (keys.brake && Math.abs(speed.current) > 2) {
         [[-1, -1.2], [1, -1.2], [-1, 1.2], [1, 1.2]].forEach(([ox, oz]) => {
           if (Math.random() < 0.6) emitParticle(getWorldPos(ox, oz), [(Math.random()-0.5)*2, 0.5, (Math.random()-0.5)*2], 1);
         });
      }

      // Drift Smoke (back wheels) & Combo logic
      const isDrifting = Math.abs(driftAngle.current) > 0.1 && Math.abs(speed.current) > 5;
      
      if (isDrifting) {
         [[-1, 1.2], [1, 1.2]].forEach(([ox, oz]) => {
           if (Math.random() < 0.8) emitParticle(getWorldPos(ox, oz), [(Math.random()-0.5)*5, 1, (Math.random()-0.5)*5], 2);
         });
         
         if (playerIndex === 0) {
           if (state.clock.elapsedTime - lastDriftTime.current > 1.0) {
              useGameStore.getState().setDriftCombo(useGameStore.getState().driftCombo + 1);
              lastDriftTime.current = state.clock.elapsedTime;
           }
           if (Math.random() < 0.05 && gameMode === 'playground') {
              useGameStore.getState().incrementScore(10 * useGameStore.getState().driftCombo);
           }
         }
      } else {
         if (state.clock.elapsedTime - lastDriftTime.current > 2.0) {
            if (useGameStore.getState().driftCombo > 1) {
               useGameStore.getState().setDriftCombo(1); // reset after 2s of no drift
            }
         }
      }
    }

    // Camera follow logic
    const cameraTarget = new Vector3();
    carRef.current.getWorldPosition(cameraTarget);
    
    let cameraOffset = new Vector3();
    let lookAhead = new Vector3();

    switch(cameraMode) {
      case 0: // Behind
        cameraOffset.set(Math.sin(angle.current) * 10, 4, Math.cos(angle.current) * 10);
        cameraTarget.y += 1;
        lookAhead.set(-Math.sin(angle.current) * 5, 0, -Math.cos(angle.current) * 5);
        state.camera.position.lerp(cameraTarget.clone().add(cameraOffset), 0.1);
        break;
      case 1: // Far Behind
        cameraOffset.set(Math.sin(angle.current) * 20, 8, Math.cos(angle.current) * 20);
        cameraTarget.y += 2;
        lookAhead.set(-Math.sin(angle.current) * 10, 0, -Math.cos(angle.current) * 10);
        state.camera.position.lerp(cameraTarget.clone().add(cameraOffset), 0.1);
        break;
      case 2: // Hood
        cameraOffset.set(0, 1.3, -0.5);
        const hx = cameraOffset.x * Math.cos(-angle.current) - cameraOffset.z * Math.sin(-angle.current);
        const hz = cameraOffset.x * Math.sin(-angle.current) + cameraOffset.z * Math.cos(-angle.current);
        state.camera.position.set(cameraTarget.x + hx, cameraTarget.y + cameraOffset.y, cameraTarget.z + hz);
        cameraTarget.y += 1.3;
        lookAhead.set(-Math.sin(angle.current) * 10, 0, -Math.cos(angle.current) * 10);
        break;
      case 3: // Reverse
        cameraOffset.set(-Math.sin(angle.current) * 10, 4, -Math.cos(angle.current) * 10);
        cameraTarget.y += 1;
        lookAhead.set(Math.sin(angle.current) * 5, 0, Math.cos(angle.current) * 5);
        state.camera.position.lerp(cameraTarget.clone().add(cameraOffset), 0.1);
        break;
    }

    state.camera.lookAt(cameraTarget.add(lookAhead));
  });

  const activeCar = playerIndex === 0 ? useGameStore((state) => state.activeCar) : useGameStore((state) => state.p2Car ?? 'mini');
  const activeCustomization = playerIndex === 0 
    ? useGameStore((state) => state.customizations[state.activeCar])
    : useGameStore((state) => state.customizations[state.p2Car ?? 'mini']);
  const coopMode = useGameStore((state) => state.coopMode);
  const isCoopCop = playerIndex === 1 && coopMode === 'cops_vs_robbers';

  useFrame((state) => {
     if (isCoopCop && carBodyRef.current) {
        // Find lights and make them blink
        const t = state.clock.elapsedTime * 10;
        const group = carBodyRef.current.children.find(c => c.name === 'policeLights');
        if (group) {
           const red = group.children[0] as THREE.Mesh;
           const blue = group.children[1] as THREE.Mesh;
           const lRed = group.children[2] as THREE.PointLight;
           const lBlue = group.children[3] as THREE.PointLight;
           
           const rOn = Math.sin(t) > 0;
           (red.material as THREE.MeshBasicMaterial).color.set(rOn ? '#ff0000' : '#440000');
           lRed.intensity = rOn ? 3 : 0;
           
           const bOn = Math.sin(t + Math.PI) > 0;
           (blue.material as THREE.MeshBasicMaterial).color.set(bOn ? '#0000ff' : '#000044');
           lBlue.intensity = bOn ? 3 : 0;
        }
     }
  });

  return (
    <group ref={carRef} position={playerIndex === 0 ? useGameStore.getState().playerPosition : useGameStore.getState().p2Position}>
      <group ref={carBodyRef}>
        <CarModelView model={activeCar} customization={activeCustomization} />
        {isCoopCop && (
          <group position={[0, 1.8, 0]} name="policeLights">
            <mesh position={[-0.4, 0, 0]}>
              <boxGeometry args={[0.3, 0.2, 0.4]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
            <mesh position={[0.4, 0, 0]}>
              <boxGeometry args={[0.3, 0.2, 0.4]} />
              <meshBasicMaterial color="#0000ff" />
            </mesh>
            <pointLight position={[-0.4, 0.5, 0]} color="#ff0000" distance={10} intensity={2} />
            <pointLight position={[0.4, 0.5, 0]} color="#0000ff" distance={10} intensity={2} />
          </group>
        )}
      </group>
    </group>
  );
};
