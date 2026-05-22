import { Sky } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { useGameStore } from '../stores/useGameStore';
import * as THREE from 'three';

export const Environment = () => {
  const setObstacles = useGameStore((state) => state.setObstacles);

  // 12 intersections = 4x3 grid or similar. 4 paths X, 3 paths Z.
  // Intersection coords: x = [-150, -50, 50, 150], z = [-100, 0, 100]
  // This means buildings are IN BETWEEN the roads.
  const xRoads = [-150, -50, 50, 150];
  const zRoads = [-100, 0, 100];
  const roadWidth = 30;

  const buildings = useMemo(() => {
    const list = [];
    
    // Create buildings in the gaps between roads.
    // The gaps are bounding boxes.
    const xBounds = [-400, -300, -200, -100, 0, 100, 200, 300, 400];
    const zBounds = [-400, -300, -200, -100, 0, 100, 200, 300, 400];

    // Define park locations to not place buildings there
    const parks = [
      { xM: -200, xMax: -100, zM: -200, zMax: -100 }, // Park 1
      { xM: 100, xMax: 200, zM: 100, zMax: 200 }      // Park 2
    ];

    for (let i = 0; i < xBounds.length - 1; i++) {
      for (let j = 0; j < zBounds.length - 1; j++) {
        const xMin = xBounds[i] + roadWidth / 2;
        const xMax = xBounds[i + 1] - roadWidth / 2;
        const zMin = zBounds[j] + roadWidth / 2;
        const zMax = zBounds[j + 1] - roadWidth / 2;

        if (xMax <= xMin || zMax <= zMin) continue;

        // Skip parks
        const isPark = parks.some(p => xBounds[i] === p.xM && zBounds[j] === p.zM);
        if (isPark) continue;

        // Skip center completely to leave open start? No, just place them.
        
        const bWidth = xMax - xMin;
        const bDepth = zMax - zMin;
        const cx = (xMax + xMin) / 2;
        const cz = (zMax + zMin) / 2;
        
        const height = 40 + Math.random() * 80 + (Math.random() > 0.8 ? 150 : 0);

        const color = new THREE.Color().setHSL(
          0.6, 
          0.1 + Math.random() * 0.1, 
          0.1 + Math.random() * 0.1 
        );

        list.push({
          position: [cx, height / 2, cz] as [number, number, number],
          size: [bWidth, height, bDepth] as [number, number, number],
          color: color.getStyle(),
          isVisible: true,
        });
      }
    }

    // Add invisible boundary walls
    list.push({ position: [0, 50, -420], size: [880, 100, 40] as [number, number, number], color: '', isVisible: false }); // North
    list.push({ position: [0, 50, 420], size: [880, 100, 40] as [number, number, number], color: '', isVisible: false }); // South
    list.push({ position: [-420, 50, 0], size: [40, 100, 880] as [number, number, number], color: '', isVisible: false }); // West
    list.push({ position: [420, 50, 0], size: [40, 100, 880] as [number, number, number], color: '', isVisible: false }); // East

    return list;
  }, []);

  const roundabouts = useMemo(() => {
    // Roundabouts at specific intersections
    return [
      [-200, -200], [200, -200],
      [-200, 0], [200, 0],
      [-200, 200], [200, 200],
      [0, -200], [0, 200]
    ];
  }, []);

  useEffect(() => {
    setObstacles(buildings.map(b => ({ position: b.position, size: b.size })));
  }, [buildings, setObstacles]);

  // Texture for windows
  const windowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a'; // wall
    ctx.fillRect(0, 0, 64, 64);
    
    // Add noise to the wall slightly
    for(let i=0; i<64; i+=2) {
      for(let j=0; j<64; j+=2) {
        if(Math.random() > 0.5) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    ctx.fillStyle = '#e0f2fe'; // window lit
    ctx.fillRect(8, 8, 20, 30);
    ctx.fillStyle = '#bae6fd'; // window lit 2
    ctx.fillRect(36, 8, 20, 30);
    
    // Window reflections/gradient
    const grad = ctx.createLinearGradient(8, 8, 28, 38);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(8, 8, 20, 30);
    ctx.fillRect(36, 8, 20, 30);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  // Road asphalt noise texture
  const roadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 128; i++) {
        for (let j = 0; j < 128; j++) {
            const v = Math.random() * 20 + 20; // dark gray
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(i, j, 1, 1);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(100, 100);
    return tex;
  }, []);

  const trees = useMemo(() => {
    const arr = [];
    // Park 1 at [-150, 0, -150]
    for (let i = 0; i < 20; i++) {
        arr.push({ x: -150 + (Math.random()-0.5)*60, z: -150 + (Math.random()-0.5)*60, scale: 0.8 + Math.random()*0.8 });
    }
    // Park 2 at [150, 0, 150]
    for (let i = 0; i < 20; i++) {
        arr.push({ x: 150 + (Math.random()-0.5)*60, z: 150 + (Math.random()-0.5)*60, scale: 0.8 + Math.random()*0.8 });
    }
    return arr;
  }, []);

  const treeDummy = useMemo(() => new THREE.Object3D(), []);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        castShadow 
        position={[50, 100, 50]} 
        intensity={1.5}
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-200} 
        shadow-camera-right={200} 
        shadow-camera-top={200} 
        shadow-camera-bottom={-200}
      />
      
      {/* Ground plane representing roads */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a1a1a" roughnessMap={roadTexture} bumpMap={roadTexture} bumpScale={0.02} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Parks */}
      {/* Park 1 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-150, 0.05, -150]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#2f8538" roughness={0.8} />
      </mesh>
      {/* Park 2 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[150, 0.05, 150]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#2f8538" roughness={0.8} />
      </mesh>

      {/* Grid helper to simulate road markings roughly */}
      <gridHelper 
        args={[1000, 10, '#333333', '#111111']} 
        position={[0, -0.05, 0]} 
      />

      {/* Roundabouts visuals */}
      {roundabouts.map((pos, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.05, pos[1]]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color="#222" roughnessMap={roadTexture} bumpMap={roadTexture} bumpScale={0.02} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* Trees in parks */}
      {trees.map((t, i) => (
         <group key={i} position={[t.x, 0, t.z]} scale={[t.scale, t.scale, t.scale]}>
            {/* Trunk */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
               <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
               <meshStandardMaterial color="#4d2904" roughness={0.9} />
            </mesh>
            {/* Leaves */}
            <mesh position={[0, 4, 0]} castShadow receiveShadow>
               <dodecahedronGeometry args={[2, 0]} />
               <meshStandardMaterial color="#367324" roughness={0.8} />
            </mesh>
            <mesh position={[1, 5, 0.5]} castShadow receiveShadow>
               <dodecahedronGeometry args={[1.5, 0]} />
               <meshStandardMaterial color="#3f8a2a" roughness={0.8} />
            </mesh>
            <mesh position={[-1, 4.5, -1]} castShadow receiveShadow>
               <dodecahedronGeometry args={[1.8, 0]} />
               <meshStandardMaterial color="#2d601e" roughness={0.8} />
            </mesh>
         </group>
      ))}

      {/* Buildings */}
      {buildings.map((obs, i) => {
        if (!obs.isVisible) return null;
        const tex = windowTexture.clone();
        tex.repeat.set(obs.size[0] / 15, obs.size[1] / 15);
        return (
          <mesh key={i} castShadow receiveShadow position={obs.position}>
            <boxGeometry args={obs.size} />
            <meshPhysicalMaterial color={obs.color} roughness={0.2} metalness={0.8} clearcoat={0.5} map={tex} />
          </mesh>
        );
      })}
    </>
  );
};

