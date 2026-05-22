import { useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { CarModelView } from './Car';

export const MultiplayerCars = () => {
  const remotePlayers = useGameStore(state => state.remotePlayers);

  return (
    <>
      {Object.values(remotePlayers).map((player) => (
        <group key={player.id} position={player.position} rotation={[0, player.rotation, 0]}>
          <CarModelView model={player.carModel || 'default'} colorFallback={player.color} customization={player.customization} />
          {/* Nametag/Indicator */}
          <mesh position={[0, 2.7, 0]}>
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial color={player.color} />
          </mesh>
        </group>
      ))}
    </>
  );
};
