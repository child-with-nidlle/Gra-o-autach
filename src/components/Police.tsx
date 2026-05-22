import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MeshStandardMaterial, Ray, Box3 } from 'three';
import { useGameStore } from '../stores/useGameStore';
import { SurrealAura } from './Car';

const POLICE_COUNT = 5;

export const Police = ({ isLogicHost = true }: { isLogicHost?: boolean }) => {
  const playerPosition = useGameStore((state) => state.playerPosition);
  const p2Position = useGameStore((state) => state.p2Position);
  const isCoop = useGameStore((state) => state.isCoop);
  const obstacles = useGameStore((state) => state.obstacles);
  const setIsCaught = useGameStore((state) => state.setIsCaught);
  
  // Create police state
  const policeData = useMemo(() => {
    return Array.from({ length: POLICE_COUNT }).map((_, i) => ({
      position: new Vector3((Math.random() - 0.5) * 800, 0, (Math.random() - 0.5) * 800),
      speed: 0,
      angle: i * Math.PI / 2,
      target: new Vector3(),
      lastKnownPos: new Vector3(),
      hasLastKnownPos: false,
      patrolTimer: 0,
      isChasing: false,
      patrolDest: new Vector3(),
    }));
  }, []);

  const policeRefs = useRef<(Group | null)[]>([]);
  
  // Reusable objects for LOS check
  const ray = useMemo(() => new Ray(), []);
  const box = useMemo(() => new Box3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const hitPoint = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const pPos = new Vector3(...playerPosition);
    const p2Pos = new Vector3(...p2Position);
    let caught = false;

    const positions: [number, number, number][] = [];

    policeData.forEach((pd, i) => {
      const ref = policeRefs.current[i];
      if (!ref) return;

      const distToPlayer = pd.position.distanceTo(pPos);
      const distToP2 = isCoop ? pd.position.distanceTo(p2Pos) : Infinity;
      
      const targetPos = distToP2 < distToPlayer ? p2Pos : pPos;
      const targetDist = Math.min(distToPlayer, distToP2);

      const isGracePeriod = useGameStore.getState().isGracePeriod;

      if (targetDist < 5 && !isGracePeriod) {
        caught = true; // Very close, player is caught
      }

      // Check LOS
      let hasLos = false;
      if (targetDist <= 150 && !isGracePeriod) {
        hasLos = true;
        direction.subVectors(targetPos, pd.position).normalize();
        ray.set(pd.position, direction);
        
        for (const obs of obstacles) {
          const halfW = obs.size[0] / 2;
          const halfD = obs.size[2] / 2;
          box.min.set(obs.position[0] - halfW, -10, obs.position[2] - halfD);
          box.max.set(obs.position[0] + halfW, 100, obs.position[2] + halfD);
          
          if (ray.intersectBox(box, hitPoint)) {
            const hitDist = hitPoint.distanceTo(pd.position);
            if (hitDist < targetDist) {
              hasLos = false;
              break;
            }
          }
        }
      }

      if (hasLos) {
        pd.isChasing = true;
        pd.hasLastKnownPos = true;
        pd.lastKnownPos.copy(targetPos);
        pd.target.copy(targetPos);
        
        // Spread out if chasing to avoid stacking
        if (i > 0) {
          pd.target.add(new Vector3((i - 1) * 8, 0, (i - 1) * -8));
        }
      } else {
        // No line of sight
        if (pd.hasLastKnownPos) {
          // Go to last known position
          const distToLastKnown = pd.position.distanceTo(pd.lastKnownPos);
          if (distToLastKnown < 10) {
            pd.hasLastKnownPos = false; // Reached, now search
            pd.isChasing = false;
          } else {
            pd.isChasing = true; // Still moving to last known
            pd.target.copy(pd.lastKnownPos);
          }
        } else {
          // Search / Patrol
          pd.isChasing = false;
          if (pd.patrolTimer <= 0) {
            // Split up: send them to random places near current position, staying within city bounds
            let destX = pd.position.x + (Math.random() - 0.5) * 150;
            let destZ = pd.position.z + (Math.random() - 0.5) * 150;
            
            if (destX > 400) destX = 400;
            if (destX < -400) destX = -400;
            if (destZ > 400) destZ = 400;
            if (destZ < -400) destZ = -400;

            pd.patrolDest.set(destX, 0, destZ);
            pd.patrolTimer = 3 + Math.random() * 4;
          } else {
            pd.patrolTimer -= delta;
          }
          pd.target.copy(pd.patrolDest);
        }
      }

      // Steering
      const dx = pd.target.x - pd.position.x;
      const dz = pd.target.z - pd.position.z;
      const targetAngle = Math.atan2(-dx, -dz);
      
      let angleDiff = targetAngle - pd.angle;
      // Normalize angle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Turn towards target
      if (Math.abs(angleDiff) > 0.1) {
        pd.angle += Math.sign(angleDiff) * 3 * delta;
      }

      // Acceleration
      const maxSpeed = pd.isChasing ? 38 : 18;
      if (pd.speed < maxSpeed) {
        pd.speed += 25 * delta;
      } else {
        pd.speed -= 10 * delta; // friction if over speed limit
      }

      // Move
      const moveX = -Math.sin(pd.angle) * pd.speed * delta;
      const moveZ = -Math.cos(pd.angle) * pd.speed * delta;
      
      let nextX = pd.position.x + moveX;
      let nextZ = pd.position.z + moveZ;

      // Obstacle collision (simple slide)
      const radius = 2;
      for (const obs of obstacles) {
        const halfW = obs.size[0] / 2;
        const halfD = obs.size[2] / 2;
        if (
          nextX > obs.position[0] - halfW - radius &&
          nextX < obs.position[0] + halfW + radius &&
          nextZ > obs.position[2] - halfD - radius &&
          nextZ < obs.position[2] + halfD + radius
        ) {
          // Slide along wall instead of getting stuck completely
          const xOver = Math.min(Math.abs(nextX - (obs.position[0] - halfW - radius)), Math.abs(nextX - (obs.position[0] + halfW + radius)));
          const zOver = Math.min(Math.abs(nextZ - (obs.position[2] - halfD - radius)), Math.abs(nextZ - (obs.position[2] + halfD + radius)));
          
          if (xOver < zOver) nextX = pd.position.x; // Block X
          else nextZ = pd.position.z; // Block Z
        }
      }

      // Traffic collision
      const tPos = useGameStore.getState().trafficPositions;
      for (const t of tPos) {
        if (Math.abs(t[0] - nextX) < 3.5 && Math.abs(t[2] - nextZ) < 3.5) {
          pd.speed *= 0.5; // slow down
          // simple avoid response:
          nextX = pd.position.x;
          nextZ = pd.position.z;
          break;
        }
      }

      pd.position.x = nextX;
      pd.position.z = nextZ;

      ref.position.copy(pd.position);
      ref.rotation.y = pd.angle;
      
      if (isLogicHost) {
        positions.push([nextX, 0, nextZ]);
      }
    });

    if (isLogicHost) {
      useGameStore.setState({ policePositions: positions });
      if (caught) setIsCaught(true);
    }
  });

  return (
    <>
      {policeData.map((pd, i) => {
        const bodyColor = ["#111", "#111", "#fff"][i % 3];
        const detailColor = ["#0000ff", "#ff0000", "#ffffff"][i % 3];
        return (
        <group key={i} ref={(el) => (policeRefs.current[i] = el)} position={[0, 0, 0]}>
          <SurrealAura color={bodyColor === "#111" ? "#ff0000" : "#0000ff"} />
          {/* Car Body */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[1.8, 1, 4]} />
            <meshPhysicalMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={0.2} clearcoat={1.0} clearcoatRoughness={0.1} roughness={0.1} metalness={0.9} ior={2.0} transmission={0.3} transparent opacity={0.95} />
          </mesh>
          {/* Car Cabin */}
          <mesh castShadow position={[0, 1.2, -0.2]}>
            <boxGeometry args={[1.4, 0.8, 2]} />
            <meshPhysicalMaterial color="#fff" emissive="#ffffff" emissiveIntensity={0.1} clearcoat={1.0} clearcoatRoughness={0.1} roughness={0.3} transmission={0.9} ior={1.3} />
          </mesh>
          {/* Windows */}
          <mesh castShadow position={[0, 1.2, -1.2]}>
            <boxGeometry args={[1.41, 0.7, 0.1]} />
            <meshPhysicalMaterial color={detailColor} emissive={detailColor} emissiveIntensity={0.5} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 1.2, 0.8]}>
            <boxGeometry args={[1.41, 0.7, 0.1]} />
            <meshPhysicalMaterial color={detailColor} emissive={detailColor} emissiveIntensity={0.5} transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.4} thickness={0.5} />
          </mesh>
          {/* Sirens */}
          <group position={[0, 1.7, -0.2]}>
            <mesh position={[-0.4, 0, 0]}>
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              <meshPhysicalMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} transmission={0.9} />
            </mesh>
            <mesh position={[0.4, 0, 0]}>
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              <meshPhysicalMaterial color="#0000ff" emissive="#0000ff" emissiveIntensity={2} transmission={0.9} />
            </mesh>
          </group>
        </group>
        );
      })}
    </>
  );
};
