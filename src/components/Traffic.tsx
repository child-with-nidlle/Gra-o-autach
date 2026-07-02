import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useGameStore } from '../stores/useGameStore';
import { SurrealAura } from './Car';

export const Traffic = ({ isLogicHost = true }: { isLogicHost?: boolean }) => {
  const gameMode = useGameStore((state) => state.gameMode);

  const trafficData = useMemo(() => {
    if (gameMode === 'playground') return [];
    
    // Spawn some traffic cars on roads
    const xRoads = [-800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700, 800];
    const zRoads = [-800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700, 800];
    
    // Create random cars strictly travelling on the grid
    return Array.from({ length: 300 }).map(() => {
      const isVertical = Math.random() > 0.5;
      const x = isVertical ? xRoads[Math.floor(Math.random() * xRoads.length)] : (Math.random() - 0.5) * 1600;
      const z = !isVertical ? zRoads[Math.floor(Math.random() * zRoads.length)] : (Math.random() - 0.5) * 1600;
      const speed = 15 + Math.random() * 10;
      // direction: 1 or -1
      const dir = Math.random() > 0.5 ? 1 : -1;
      const angle = isVertical ? (dir > 0 ? Math.PI : 0) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);

      return {
        position: new Vector3(x, 0, z),
        speed,
        angle,
        isVertical,
        dir,
        color: `hsl(${Math.random() * 360}, 60%, 50%)`,
        type: Math.random() > 0.8 ? 'truck' : 'car'
      };
    });
  }, []);

  const refs = useRef<(Group | null)[]>([]);

  useFrame((_, delta) => {
    const positions: [number, number, number][] = [];
    trafficData.forEach((td, i) => {
      const ref = refs.current[i];
      if (!ref) return;

      const move = td.speed * delta;
      
      let nextX = td.position.x - Math.sin(td.angle) * move;
      let nextZ = td.position.z - Math.cos(td.angle) * move;

      // wrap around map
      if (nextX > 800) nextX = -800;
      if (nextX < -800) nextX = 800;
      if (nextZ > 800) nextZ = -800;
      if (nextZ < -800) nextZ = 800;

      td.position.x = nextX;
      td.position.z = nextZ;
      
      ref.position.copy(td.position);
      ref.rotation.y = td.angle;

      if (isLogicHost) {
        positions.push([nextX, 0, nextZ]);
      }
    });
    
    if (isLogicHost) {
      useGameStore.setState({ trafficPositions: positions });
    }
  });

  return (
    <>
      {trafficData.map((td, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <SurrealAura color={td.color} />
          {td.type === 'truck' ? (
            <>
              {/* Truck Body */}
              <mesh castShadow position={[0, 1.5, -1]}>
                <boxGeometry args={[2.2, 2.5, 6]} />
                <meshPhysicalMaterial color={td.color} emissive={td.color} emissiveIntensity={0.1} roughness={0.6} metalness={0.2} />
              </mesh>
              {/* Truck Cabin */}
              <mesh castShadow position={[0, 1.2, 2.5]}>
                <boxGeometry args={[2.2, 2, 2]} />
                <meshPhysicalMaterial color="#444" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Windows */}
              <mesh castShadow position={[0, 1.8, 3.55]}>
                <boxGeometry args={[2, 0.8, 0.1]} />
                <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
              </mesh>
            </>
          ) : (
            <>
              {/* Car Body */}
              <mesh castShadow position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 1, 4]} />
                <meshPhysicalMaterial color={td.color} emissive={td.color} emissiveIntensity={0.2} clearcoat={1.0} clearcoatRoughness={0.1} roughness={0.1} metalness={0.9} ior={2.0} transmission={0.3} transparent opacity={0.95} />
              </mesh>
              {/* Car Cabin */}
              <mesh castShadow position={[0, 1.2, -0.2]}>
                <boxGeometry args={[1.4, 0.8, 2]} />
                <meshPhysicalMaterial color="#333" clearcoat={1.0} clearcoatRoughness={0.1} roughness={0.3} transmission={0.8} ior={1.3} />
              </mesh>
              {/* Windows */}
              <mesh castShadow position={[0, 1.2, -1.2]}>
                <boxGeometry args={[1.41, 0.7, 0.1]} />
                <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
              </mesh>
              <mesh castShadow position={[0, 1.2, 0.8]}>
                <boxGeometry args={[1.41, 0.7, 0.1]} />
                <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
};
