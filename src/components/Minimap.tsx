import { useGameStore } from '../stores/useGameStore';

export const Minimap = () => {
  const pPos = useGameStore(state => state.playerPosition);
  const obstacles = useGameStore(state => state.obstacles);
  const police = useGameStore(state => state.policePositions);
  const remotePlayers = useGameStore(state => state.remotePlayers);
  
  // zoom scale
  const scale = 0.5;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div 
        className="absolute left-1/2 top-1/2 w-0 h-0"
        style={{
          transform: `scale(${scale}) translate(${-pPos[0]}px, ${-pPos[2]}px)`
        }}
      >
        {obstacles.map((obs, i) => (
          <div 
            key={i} 
            className="absolute bg-slate-600/40 border border-slate-500/50 rounded-sm"
            style={{
               left: `${obs.position[0] - obs.size[0]/2}px`,
               top: `${obs.position[2] - obs.size[2]/2}px`,
               width: `${obs.size[0]}px`,
               height: `${obs.size[2]}px`
            }}
          />
        ))}
        {police.map((p, i) => (
          <div 
            key={`p-${i}`}
            className="absolute w-8 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,1)] -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${p[0]}px`, top: `${p[2]}px` }}
          />
        ))}
        {Object.values(remotePlayers).map(player => (
          <div 
            key={`mp-${player.id}`}
            className="absolute w-6 h-6 rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${player.position[0]}px`, 
              top: `${player.position[2]}px`,
              backgroundColor: player.color, // Fallback
              boxShadow: `0 0 10px ${player.color}` 
            }}
          />
        ))}
      </div>
      
      {/* Player in center */}
      <div className="absolute left-1/2 top-1/2 w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)] -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
};
