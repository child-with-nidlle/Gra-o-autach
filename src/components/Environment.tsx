import { Sky } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';
import * as THREE from 'three';

const Rain = () => {
  const count = 5000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const playerPos = useGameStore(state => state.playerPosition);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 200,
      y: Math.random() * 100,
      z: (Math.random() - 0.5) * 200,
      speed: 1 + Math.random() * 2
    }));
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const px = playerPos[0];
    const pz = playerPos[2];
    
    particles.forEach((p, i) => {
      p.y -= p.speed;
      if (p.y < 0) p.y = 100;
      
      // keep rain around player roughly
      let rx = p.x + px;
      let rz = p.z + pz;
      
      dummy.position.set(rx, p.y, rz);
      dummy.scale.set(1, 4, 1);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[0.02, 0.5, 0.02]} />
      <meshBasicMaterial color="#aaddff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

export const Environment = () => {
  const setObstacles = useGameStore((state) => state.setObstacles);
  const gameMode = useGameStore((state) => state.gameMode);
  const weather = useGameStore((state) => state.weather);
  const weatherEnabled = useGameStore((state) => state.weatherEnabled);

  // 12 intersections = 4x3 grid or similar. 4 paths X, 3 paths Z.
  // Intersection coords: x = [-150, -50, 50, 150], z = [-100, 0, 100]
  // This means buildings are IN BETWEEN the roads.
  const xRoads = [-150, -50, 50, 150];
  const zRoads = [-100, 0, 100];
  const roadWidth = 30;

  const buildings = useMemo(() => {
    const list = [];
    
    if (gameMode === 'playground') {
      // Add invisible boundary walls only
      list.push({ position: [0, 50, -820], size: [1680, 100, 40] as [number, number, number], color: '', isVisible: false }); // North
      list.push({ position: [0, 50, 820], size: [1680, 100, 40] as [number, number, number], color: '', isVisible: false }); // South
      list.push({ position: [-820, 50, 0], size: [40, 100, 1680] as [number, number, number], color: '', isVisible: false }); // West
      list.push({ position: [820, 50, 0], size: [40, 100, 1680] as [number, number, number], color: '', isVisible: false }); // East
      return list;
    }
    
    // Create buildings in the gaps between roads.
    // The gaps are bounding boxes.
    const xBounds = [-800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700, 800];
    const zBounds = [-800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700, 800];

    // Define special zone locations to not place regular buildings there
    const specialZones = [
      { id: 'park1', xM: -400, xMax: -300, zM: -400, zMax: -300, cx: -350, cz: -350 },
      { id: 'stadium', xM: 300, xMax: 400, zM: 300, zMax: 400, cx: 350, cz: 350 },
      { id: 'plaza', xM: -200, xMax: -100, zM: 200, zMax: 300, cx: -150, cz: 250 },
      { id: 'industrial', xM: 200, xMax: 300, zM: -200, zMax: -100, cx: 250, cz: -150 }
    ];

    for (let i = 0; i < xBounds.length - 1; i++) {
      for (let j = 0; j < zBounds.length - 1; j++) {
        const xMin = xBounds[i] + roadWidth / 2;
        const xMax = xBounds[i + 1] - roadWidth / 2;
        const zMin = zBounds[j] + roadWidth / 2;
        const zMax = zBounds[j + 1] - roadWidth / 2;

        if (xMax <= xMin || zMax <= zMin) continue;

        // Skip special zones
        const isSpecial = specialZones.some(p => xBounds[i] === p.xM && zBounds[j] === p.zM);
        if (isSpecial) {
          // Add invisible wall for stadium/industrial if needed, but let's just let cars drive there or add specific colliders later
          continue;
        }

        // Skip center completely to leave open start? No, just place them.
        
        const bWidth = xMax - xMin;
        const bDepth = zMax - zMin;
        const cx = (xMax + xMin) / 2;
        const cz = (zMax + zMin) / 2;
        
        const height = 40 + Math.random() * 80 + (Math.random() > 0.8 ? 150 : 0);

        const color = new THREE.Color().setHSL(
          Math.random(), 
          0.3 + Math.random() * 0.5, 
          0.1 + Math.random() * 0.3 
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
    list.push({ position: [0, 50, -820], size: [1680, 100, 40] as [number, number, number], color: '', isVisible: false }); // North
    list.push({ position: [0, 50, 820], size: [1680, 100, 40] as [number, number, number], color: '', isVisible: false }); // South
    list.push({ position: [-820, 50, 0], size: [40, 100, 1680] as [number, number, number], color: '', isVisible: false }); // West
    list.push({ position: [820, 50, 0], size: [40, 100, 1680] as [number, number, number], color: '', isVisible: false }); // East

    return list;
  }, [gameMode]);

  const roundabouts = useMemo(() => {
    if (gameMode === 'playground') return [];
    // Roundabouts at specific intersections
    return [
      [-200, -200], [200, -200],
      [-200, 0], [200, 0],
      [-200, 200], [200, 200],
      [0, -200], [0, 200]
    ];
  }, [gameMode]);

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
    if (gameMode === 'playground') return [];
    
    const arr = [];
    // Park 1 at [-350, 0, -350]
    for (let i = 0; i < 40; i++) {
        arr.push({ x: -350 + (Math.random()-0.5)*60, z: -350 + (Math.random()-0.5)*60, scale: 0.8 + Math.random()*0.8 });
    }
    // Plaza at [-150, 0, 250] - around the edges
    for (let i = 0; i < 20; i++) {
        const isEdgeX = Math.random() > 0.5;
        const x = isEdgeX ? -150 + (Math.random() > 0.5 ? 35 : -35) : -150 + (Math.random()-0.5)*70;
        const z = !isEdgeX ? 250 + (Math.random() > 0.5 ? 35 : -35) : 250 + (Math.random()-0.5)*70;
        arr.push({ x, z, scale: 0.6 + Math.random()*0.4 });
    }
    return arr;
  }, [gameMode]);

  const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const leaves1MeshRef = useRef<THREE.InstancedMesh>(null);
  const leaves2MeshRef = useRef<THREE.InstancedMesh>(null);
  const leaves3MeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!trunkMeshRef.current || !leaves1MeshRef.current || !leaves2MeshRef.current || !leaves3MeshRef.current) return;
    const baseDummy = new THREE.Object3D();
    const childDummy = new THREE.Object3D();

    trees.forEach((t, i) => {
      baseDummy.position.set(t.x, 0, t.z);
      baseDummy.scale.set(t.scale, t.scale, t.scale);
      baseDummy.updateMatrixWorld(); // update world matrix
      
      // Trunk: [0, 1.5, 0]
      childDummy.position.set(0, 1.5, 0);
      childDummy.updateMatrix();
      childDummy.matrix.multiplyMatrices(baseDummy.matrixWorld, childDummy.matrix);
      trunkMeshRef.current!.setMatrixAt(i, childDummy.matrix);

      // Leaves 1: [0, 4, 0]
      childDummy.position.set(0, 4, 0);
      childDummy.updateMatrix();
      childDummy.matrix.multiplyMatrices(baseDummy.matrixWorld, childDummy.matrix);
      leaves1MeshRef.current!.setMatrixAt(i, childDummy.matrix);

      // Leaves 2: [1, 5, 0.5]
      childDummy.position.set(1, 5, 0.5);
      childDummy.updateMatrix();
      childDummy.matrix.multiplyMatrices(baseDummy.matrixWorld, childDummy.matrix);
      leaves2MeshRef.current!.setMatrixAt(i, childDummy.matrix);

      // Leaves 3: [-1, 4.5, -1]
      childDummy.position.set(-1, 4.5, -1);
      childDummy.updateMatrix();
      childDummy.matrix.multiplyMatrices(baseDummy.matrixWorld, childDummy.matrix);
      leaves3MeshRef.current!.setMatrixAt(i, childDummy.matrix);
    });

    trunkMeshRef.current.instanceMatrix.needsUpdate = true;
    leaves1MeshRef.current.instanceMatrix.needsUpdate = true;
    leaves2MeshRef.current.instanceMatrix.needsUpdate = true;
    leaves3MeshRef.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <>
      <fog attach="fog" args={[weatherEnabled && weather === 'foggy' ? '#8899aa' : (weatherEnabled && weather === 'rainy' ? '#556677' : '#e0f2fe'), 10, weatherEnabled && weather === 'foggy' ? 200 : 800]} />
      <Sky 
        sunPosition={weatherEnabled && (weather === 'rainy' || weather === 'foggy') ? [0, 1, 0] : [100, 20, 100]} 
        turbidity={weatherEnabled && weather === 'foggy' ? 10 : (weatherEnabled && weather === 'rainy' ? 5 : 0.1)} 
        rayleigh={weatherEnabled && (weather === 'rainy' || weather === 'foggy') ? 4 : 1}
      />
      <ambientLight intensity={weatherEnabled && (weather === 'rainy' || weather === 'foggy') ? 0.2 : 0.5} />
      <directionalLight 
        castShadow 
        position={[50, 100, 50]} 
        intensity={weatherEnabled && (weather === 'rainy' || weather === 'foggy') ? 0.3 : 1.5}
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-200} 
        shadow-camera-right={200} 
        shadow-camera-top={200} 
        shadow-camera-bottom={-200}
      />
      
      {weatherEnabled && weather === 'rainy' && <Rain />}

      {/* Ground plane representing roads */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color={gameMode === 'playground' ? "#333" : "#1a1a1a"} roughnessMap={roadTexture} bumpMap={roadTexture} bumpScale={0.02} metalness={0.4} roughness={weatherEnabled && weather === 'rainy' ? 0.1 : 0.6} />
      </mesh>

      {gameMode === 'city' && (
        <>
          {/* Special Zones */}
          {/* Park 1 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-350, 0.05, -350]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#2f8538" roughness={0.8} />
      </mesh>

      {/* Stadium */}
      <group position={[350, 0, 350]}>
        {/* Ground */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
           <planeGeometry args={[70, 70]} />
           <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
        {/* Pitch */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
           <planeGeometry args={[40, 60]} />
           <meshStandardMaterial color="#2f8538" roughness={0.9} />
        </mesh>
        {/* Stands */}
        <mesh receiveShadow castShadow position={[0, 15, 0]}>
           <torusGeometry args={[30, 10, 16, 64]} />
           <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
        </mesh>
        {/* Roof */}
        <mesh receiveShadow castShadow position={[0, 35, 0]}>
           <torusGeometry args={[28, 8, 16, 64]} />
           <meshStandardMaterial color="#00aaff" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Plaza */}
      <group position={[-150, 0, 250]}>
        {/* Paving */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
           <planeGeometry args={[70, 70]} />
           <meshStandardMaterial color="#888" roughness={0.7} />
        </mesh>
        {/* Fountain pool */}
        <mesh receiveShadow castShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
           <circleGeometry args={[15, 32]} />
           <meshStandardMaterial color="#aaa" roughness={0.5} />
        </mesh>
        {/* Water */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
           <circleGeometry args={[14, 32]} />
           <meshPhysicalMaterial color="#00ffff" transmission={0.9} opacity={0.8} transparent roughness={0.1} />
        </mesh>
        {/* Monument */}
        <mesh castShadow position={[0, 10, 0]}>
           <octahedronGeometry args={[4, 0]} />
           <meshStandardMaterial color="#ffcc00" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 4, 0]}>
           <cylinderGeometry args={[2, 4, 8, 8]} />
           <meshStandardMaterial color="#555" roughness={0.6} />
        </mesh>
      </group>

      {/* Industrial */}
      <group position={[250, 0, -150]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
           <planeGeometry args={[70, 70]} />
           <meshStandardMaterial color="#444" roughness={0.8} />
        </mesh>
        {/* Factory building */}
        <mesh castShadow receiveShadow position={[-15, 15, -15]}>
           <boxGeometry args={[30, 30, 30]} />
           <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>
        {/* Chimneys */}
        <mesh castShadow receiveShadow position={[-25, 40, -20]}>
           <cylinderGeometry args={[3, 4, 50, 16]} />
           <meshStandardMaterial color="#555" roughness={0.7} />
        </mesh>
        <mesh castShadow receiveShadow position={[-10, 40, -20]}>
           <cylinderGeometry args={[3, 4, 50, 16]} />
           <meshStandardMaterial color="#555" roughness={0.7} />
        </mesh>
        {/* Cooling Towers / Silos */}
        <mesh castShadow receiveShadow position={[15, 20, 15]}>
           <cylinderGeometry args={[8, 8, 40, 32]} />
           <meshStandardMaterial color="#ccc" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh castShadow receiveShadow position={[15, 20, -10]}>
           <cylinderGeometry args={[8, 8, 40, 32]} />
           <meshStandardMaterial color="#ccc" roughness={0.5} metalness={0.3} />
        </mesh>
      </group>

      {/* Grid helper to simulate road markings roughly */}
      <gridHelper 
        args={[2000, 20, '#333333', '#111111']} 
        position={[0, -0.05, 0]} 
      />

      {/* Roundabouts visuals */}
      {roundabouts.map((pos, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.05, pos[1]]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color="#222" roughnessMap={roadTexture} bumpMap={roadTexture} bumpScale={0.02} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* Trees in parks using InstancedMesh */}
      <instancedMesh ref={trunkMeshRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
         <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
         <meshStandardMaterial color="#4d2904" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leaves1MeshRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
         <dodecahedronGeometry args={[2, 0]} />
         <meshStandardMaterial color="#367324" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={leaves2MeshRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
         <dodecahedronGeometry args={[1.5, 0]} />
         <meshStandardMaterial color="#3f8a2a" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={leaves3MeshRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
         <dodecahedronGeometry args={[1.8, 0]} />
         <meshStandardMaterial color="#2d601e" roughness={0.8} />
      </instancedMesh>

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
      )}
    </>
  );
};

