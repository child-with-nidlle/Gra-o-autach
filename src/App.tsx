/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

// Suppress deprecation warnings from internal R3F usage of Clock
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('THREE.Clock') || args[0].includes('PCFSoftShadowMap'))
  ) {
    return;
  }
  originalWarn(...args);
};

import { EffectComposer, Bloom, HueSaturation, Vignette } from '@react-three/postprocessing';
import { View } from '@react-three/drei';
import { Car, CarModelView } from './components/Car';
import { Effects } from './components/Effects';
import { Environment } from './components/Environment';
import { Police } from './components/Police';
import { Traffic } from './components/Traffic';
import { Minimap } from './components/Minimap';
import { MultiplayerCars } from './components/MultiplayerCars';
import { useGameStore } from './stores/useGameStore';
import { socket } from './socket';

const SceneContent = ({ isLogicHost = false, playerIndex = 0 }) => {
  const isCaught = useGameStore((state) => state.isCaught);
  
  return (
    <>
      <Environment />
      <Traffic isLogicHost={isLogicHost} />
      <Police isLogicHost={isLogicHost} />
      <MultiplayerCars />
      {!isCaught && (
        <>
          <Car playerIndex={playerIndex} />
          {useGameStore.getState().isCoop && <Car playerIndex={playerIndex === 0 ? 1 : 0} isGhost />}
        </>
      )}
      <Effects />
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
        <HueSaturation saturation={0.3} hue={0} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

const CarShop = () => {
  const ownedCars = useGameStore(state => state.ownedCars);
  const activeCar = useGameStore(state => state.activeCar);
  const p2Car = useGameStore(state => state.p2Car);
  const score = useGameStore(state => state.score);
  
  return (
    <div className="shrink-0 bg-slate-900/80 p-6 rounded-xl border border-white/10 flex flex-col gap-3 w-96 text-left h-64 overflow-y-auto snap-center">
      <div className="text-[12px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-2 text-center">Salon Samochodowy</div>
      
      {(['default', 'mini', 'bmw', 'ferrari', 'f1', 'truck', 'suv', 'sports'] as const).map(model => {
        const owned = ownedCars.includes(model);
        const isActiveP1 = activeCar === model;
        const isActiveP2 = p2Car === model;

        return (
          <div key={model} className="flex flex-col gap-1 w-full bg-slate-800 rounded p-2">
            <div className="flex justify-between items-center w-full">
               <span className="font-bold uppercase text-sm">{model}</span>
               {!owned && <span className="text-yellow-400 font-mono text-sm">${model === 'f1' ? 100000 : model === 'ferrari' ? 50000 : model === 'sports' ? 35000 : model === 'truck' ? 25000 : model === 'suv' ? 20000 : model === 'bmw' ? 15000 : model === 'mini' ? 5000 : 0}</span>}
            </div>
            {owned ? (
              <div className="flex gap-2 w-full mt-1">
                <button 
                  onClick={() => useGameStore.getState().setActiveCar(model)}
                  className={`flex-1 py-1 text-xs font-bold rounded ${isActiveP1 ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                   {isActiveP1 ? 'P1: Aktywny' : 'Dla P1'}
                </button>
                <button 
                  onClick={() => useGameStore.getState().setP2Car(model)}
                  className={`flex-1 py-1 text-xs font-bold rounded ${isActiveP2 ? 'bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                   {isActiveP2 ? 'P2: Aktywny' : 'Dla P2'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => useGameStore.getState().buyCar(model)}
                disabled={score < (model === 'f1' ? 100000 : model === 'ferrari' ? 50000 : model === 'sports' ? 35000 : model === 'truck' ? 25000 : model === 'suv' ? 20000 : model === 'bmw' ? 15000 : model === 'mini' ? 5000 : 0)}
                className="w-full py-1 text-xs font-bold rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 mt-1"
              >
                 Kup Samochód
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CarTuning = () => {
  const [tuningPlayerIndex, setTuningPlayerIndex] = useState(0);
  const activeCar = useGameStore(state => state.activeCar);
  const p2CarModel = useGameStore(state => state.p2Car) ?? 'mini';
  const customizations = useGameStore(state => state.customizations);
  const setCarColor = useGameStore(state => state.setCarColor);
  const toggleCarPart = useGameStore(state => state.toggleCarPart);
  const buyCarPart = useGameStore(state => state.buyCarPart);
  const setCarDetailColor = useGameStore(state => state.setCarDetailColor);
  const score = useGameStore(state => state.score);
  const isCoop = useGameStore(state => state.isCoop);

  const activeCarToTune = tuningPlayerIndex === 0 ? activeCar : p2CarModel;
  const activeCust = customizations[activeCarToTune] || customizations['mini'];

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f43f5e', '#ffffff', '#000000', '#64748b', '#fb923c', '#14b8a6', '#db2777'];

  return (
    <div className="shrink-0 bg-slate-900/80 p-6 rounded-xl border border-white/10 flex flex-col gap-3 w-80 text-left snap-center h-[28rem] overflow-y-auto">
      <div className="text-[12px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-2 text-center flex justify-between items-center">
        <span>Tuning Wyglądu</span>
        {isCoop && (
          <div className="flex bg-slate-800 rounded-full p-1 border border-white/10">
            <button 
              onClick={() => setTuningPlayerIndex(0)}
              className={`px-3 py-1 rounded-full text-[10px] transition-colors ${tuningPlayerIndex === 0 ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
            >P1</button>
            <button 
              onClick={() => setTuningPlayerIndex(1)}
              className={`px-3 py-1 rounded-full text-[10px] transition-colors ${tuningPlayerIndex === 1 ? 'bg-pink-500 text-black' : 'text-slate-400'}`}
            >P2</button>
          </div>
        )}
      </div>
      
      <div className="w-full h-32 bg-black/50 rounded-lg overflow-hidden relative mb-2 flex-shrink-0">
        <Canvas camera={{ position: [3, 2, 4], fov: 40 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <group rotation={[0,-Math.PI/4,0]}>
            <CarModelView model={activeCarToTune} customization={activeCust} />
          </group>
        </Canvas>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-2 flex-shrink-0">
        {colors.map(c => (
           <button 
             key={c}
             onClick={() => setCarColor(activeCarToTune, c)}
             className={`w-full aspect-square rounded cursor-pointer border hover:scale-110 transition-transform ${activeCust.color === c ? 'border-white !scale-110 z-10 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
             style={{ backgroundColor: c }}
           />
        ))}
      </div>

      <div className="grid grid-cols-6 gap-2 mb-2 flex-shrink-0">
        {colors.map(c => (
           <button 
             key={c}
             onClick={() => setCarDetailColor(activeCarToTune, c)}
             className={`w-full aspect-square rounded cursor-pointer border hover:scale-110 transition-transform ${activeCust.detailColor === c ? 'border-white !scale-110 z-10 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
             style={{ backgroundColor: c }}
           />
        ))}
      </div>

      <button 
        onClick={() => {
          if (activeCust.ownsSpoiler) toggleCarPart(activeCarToTune, 'spoiler');
          else buyCarPart(activeCarToTune, 'spoiler', 500);
        }}
        disabled={!activeCust.ownsSpoiler && score < 500}
        className={`flex justify-between items-center gap-4 px-4 py-3 disabled:opacity-50 hover:bg-slate-700 rounded transition-colors ${activeCust.hasSpoiler ? 'bg-cyan-600' : 'bg-slate-800'}`}
      >
        <span className="font-bold">Spoiler</span>
        <span className="text-yellow-400 font-mono text-sm">{activeCust.ownsSpoiler ? (activeCust.hasSpoiler ? 'Wyłącz' : 'Załóż') : '$500'}</span>
      </button>

      <button 
        onClick={() => {
          if (activeCust.ownsDecals) toggleCarPart(activeCarToTune, 'decals');
          else buyCarPart(activeCarToTune, 'decals', 250);
        }}
        disabled={!activeCust.ownsDecals && score < 250}
        className={`flex justify-between items-center gap-4 px-4 py-3 disabled:opacity-50 hover:bg-slate-700 rounded transition-colors ${activeCust.hasDecals ? 'bg-cyan-600' : 'bg-slate-800'}`}
      >
        <span className="font-bold">Naklejki</span>
        <span className="text-yellow-400 font-mono text-sm">{activeCust.ownsDecals ? (activeCust.hasDecals ? 'Wyłącz' : 'Załóż') : '$250'}</span>
      </button>
    </div>
  );
};

export default function App() {
  const speed = useGameStore((state) => state.speed);
  const isCaught = useGameStore((state) => state.isCaught);
  const score = useGameStore((state) => state.score);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const incrementScore = useGameStore((state) => state.incrementScore);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const playerRotation = useGameStore((state) => state.playerRotation);
  const setRemotePlayers = useGameStore((state) => state.setRemotePlayers);
  const remotePlayers = useGameStore((state) => state.remotePlayers);
  const isGracePeriod = useGameStore((state) => state.isGracePeriod);
  const activeCar = useGameStore((state) => state.activeCar);
  const isCoop = useGameStore((state) => state.isCoop);
  const coopMode = useGameStore((state) => state.coopMode);
  const p2Speed = useGameStore((state) => state.p2Speed);
  const gameMode = useGameStore((state) => state.gameMode);
  const weather = useGameStore((state) => state.weather);
  const weatherEnabled = useGameStore((state) => state.weatherEnabled);
  const driftCombo = useGameStore((state) => state.driftCombo);
  const speedKmH = speed * 3.6;
  const p2SpeedKmH = p2Speed * 3.6;

  const [time, setTime] = useState(0);

  useEffect(() => {
    if (time >= 12000 && useGameStore.getState().isGracePeriod) {
      useGameStore.setState({ isGracePeriod: false });
    }
  }, [time]);

  // Multiplayer socket connection
  useEffect(() => {
    socket.connect();
    
    socket.on("currentPlayers", (players) => {
      // Remove self from the initial players bundle just in case
      const remote = { ...players };
      delete remote[socket.id || ''];
      setRemotePlayers(remote);
    });

    socket.on("playerJoined", (player) => {
      if (player.id !== socket.id) {
        setRemotePlayers((prev) => ({ ...prev, [player.id]: player }));
      }
    });

    socket.on("playerMoved", (playerData) => {
      if (playerData.id !== socket.id) {
        setRemotePlayers((prev) => {
          if (!prev[playerData.id]) return prev;
          return {
            ...prev,
            [playerData.id]: {
              ...prev[playerData.id],
              position: playerData.position,
              rotation: playerData.rotation,
              carModel: playerData.carModel || prev[playerData.id].carModel
            }
          };
        });
      }
    });

    socket.on("playerLeft", (playerId) => {
      setRemotePlayers((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    });

    return () => {
      socket.off("currentPlayers");
      socket.off("playerJoined");
      socket.off("playerMoved");
      socket.off("playerLeft");
      socket.disconnect();
    };
  }, [setRemotePlayers]);

  // Send our pos to the server when it changes
  useEffect(() => {
    if (socket.connected) {
      socket.emit("updateLocation", { 
        position: playerPosition, 
        rotation: playerRotation, 
        carModel: activeCar,
        customization: useGameStore.getState().customizations[activeCar]
      });
    }
  }, [playerPosition, playerRotation, activeCar, useGameStore((state) => state.customizations[state.activeCar])]);

  useEffect(() => {
    if (isCaught) return;
    const interval = setInterval(() => {
      setTime(t => t + 100);
      incrementScore(Math.floor(useGameStore.getState().speed * 0.1)); // Points based on speed
    }, 100);
    return () => clearInterval(interval);
  }, [isCaught, incrementScore]);

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const mil = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${mil.toString().padStart(2, '0')}`;
  };

  const getUpgradeCost = (level: number) => level * 1500;

  return (
    <div className="w-full h-screen relative bg-slate-900 text-white font-sans overflow-hidden flex flex-col">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 flex">
        <div className={`relative h-full ${isCoop ? 'w-1/2' : 'w-full'} border-r border-cyan-400/30`}>
          <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 5, 10], fov: 60 }}>
            <SceneContent isLogicHost={true} playerIndex={0} />
          </Canvas>
        </div>

        {isCoop && (
          <div className="relative w-1/2 h-full">
            <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 5, 10], fov: 60 }}>
              <SceneContent isLogicHost={false} playerIndex={1} />
            </Canvas>
          </div>
        )}
      </div>

      {isCaught && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-8 border-4 border-rose-500 rounded-xl bg-black shadow-[0_0_50px_rgba(244,63,94,0.5)] flex flex-col items-center">
            <h1 className="text-6xl font-black italic text-rose-500 mb-4 tracking-tighter">BustED!</h1>
            <p className="text-2xl text-white mb-2">Czas ucieczki:</p>
            <p className="text-4xl font-mono text-cyan-400">{formatTime(time)}</p>
            <p className="text-xl text-yellow-400 mt-2 font-black">Twoje Punkty: {score}</p>
            
            <div className="flex gap-4 w-full max-w-6xl mt-8 px-4 overflow-x-auto snap-x justify-start md:justify-center items-start">
            
            {/* Engine / upgrades */}
            <div className="shrink-0 bg-slate-900/80 p-6 rounded-xl border border-white/10 flex flex-col gap-3 w-80 text-left snap-center">
              <div className="text-[12px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-2 text-center">Ulepszenia</div>
              
              <button 
                onClick={() => buyUpgrade('engine', getUpgradeCost(upgrades.engine))}
                disabled={score < getUpgradeCost(upgrades.engine)}
                className="flex justify-between items-center gap-4 px-4 py-3 bg-slate-800 disabled:opacity-50 hover:bg-slate-700 rounded transition-colors"
               >
                <span className="font-bold">Silnik Lv.{upgrades.engine}</span>
                <span className="text-yellow-400 font-mono">${getUpgradeCost(upgrades.engine)}</span>
              </button>

              <button 
                onClick={() => buyUpgrade('tires', getUpgradeCost(upgrades.tires))}
                disabled={score < getUpgradeCost(upgrades.tires)}
                className="flex justify-between items-center gap-4 px-4 py-3 bg-slate-800 disabled:opacity-50 hover:bg-slate-700 rounded transition-colors"
               >
                <span className="font-bold">Opony Lv.{upgrades.tires}</span>
                <span className="text-yellow-400 font-mono">${getUpgradeCost(upgrades.tires)}</span>
              </button>

              <button 
                onClick={() => buyUpgrade('brakes', getUpgradeCost(upgrades.brakes))}
                disabled={score < getUpgradeCost(upgrades.brakes)}
                className="flex justify-between items-center gap-4 px-4 py-3 bg-slate-800 disabled:opacity-50 hover:bg-slate-700 rounded transition-colors"
               >
                <span className="font-bold">Hamulce Lv.{upgrades.brakes}</span>
                <span className="text-yellow-400 font-mono">${getUpgradeCost(upgrades.brakes)}</span>
              </button>
            </div>

            {/* Cars */}
            <CarShop />

            {/* Customization */}
            <CarTuning />

            </div>

            <div className="flex gap-4 mt-8 w-full max-w-sm flex-col md:flex-row">
              <button 
                onClick={() => {
                  useGameStore.getState().toggleCoop();
                }}
                className={`px-4 py-4 font-black uppercase text-xs tracking-widest transition-colors flex-1 rounded-lg border-2 ${isCoop ? 'bg-cyan-900 border-cyan-400 text-white' : 'bg-transparent border-slate-600 text-slate-400'}`}
              >
                {isCoop ? 'Co-op: ON' : 'Co-op: OFF'}
              </button>

              {isCoop && (
                <button 
                  onClick={() => {
                    useGameStore.getState().setCoopMode(coopMode === 'normal' ? 'cops_vs_robbers' : 'normal');
                  }}
                  className={`px-2 py-4 font-black uppercase text-xs tracking-widest transition-colors flex-1 rounded-lg border-2 ${coopMode === 'cops_vs_robbers' ? 'bg-rose-900 border-rose-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                >
                  {coopMode === 'cops_vs_robbers' ? 'Złodziej vs Policja' : 'Zwykły Co-op'}
                </button>
              )}
              
              <button 
                onClick={() => {
                  useGameStore.setState({ 
                    isCaught: false, 
                    isGracePeriod: true,
                    playerPosition: [0,0,0],
                    p2Position: [4,0,0],
                    speed: 0,
                    p2Speed: 0,
                    score: score, // Keep the score if you want! Or maybe we shouldn't reset it to 0 here.
                    bonusClaimed: false
                  });
                  setTime(0);
                }}
                className="px-8 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors flex-2 rounded-lg"
              >
                Start
              </button>
            </div>

            <div className="flex gap-4 mt-4 w-full max-w-sm">
               <button 
                onClick={() => {
                  useGameStore.getState().setGameMode(gameMode === 'city' ? 'playground' : 'city');
                }}
                className={`px-4 py-3 font-bold uppercase text-xs tracking-widest transition-colors flex-1 rounded border-2 ${gameMode === 'playground' ? 'bg-amber-900 border-amber-400 text-white' : 'bg-transparent border-slate-600 text-slate-400'}`}
              >
                {gameMode === 'playground' ? 'Zabawa: ON' : 'Zabawa: OFF'}
              </button>

              <button 
                onClick={() => {
                  const weatherList: ('sunny' | 'rainy' | 'foggy')[] = ['sunny', 'rainy', 'foggy'];
                  useGameStore.getState().setWeather(weatherList[(weatherList.indexOf(weather) + 1) % weatherList.length]);
                }}
                className="px-4 py-3 bg-transparent border-2 border-slate-600 text-slate-400 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex-1 rounded"
              >
                Pogoda: {weather}
              </button>
              
              <button 
                onClick={() => {
                  useGameStore.getState().setWeatherEnabled(!weatherEnabled);
                }}
                className={`px-4 py-3 font-bold uppercase text-xs tracking-widest transition-colors rounded border-2 ${weatherEnabled ? 'bg-blue-900 border-blue-400 text-white' : 'bg-transparent border-slate-600 text-slate-400'}`}
              >
                {weatherEnabled ? 'Efk.Pog: ON' : 'Efk.Pog: OFF'}
              </button>
            </div>

            <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded-lg border border-white/10 pointer-events-auto flex flex-col gap-2 w-40">
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-1 text-center flex items-center justify-center gap-2">
                <span>Safe</span>
                <span className="text-xl">🔒</span>
              </div>
              <input 
                type="password"
                placeholder="***"
                className="bg-black/50 text-white px-3 py-2 outline-none font-mono text-center text-sm rounded border border-white/20 focus:border-cyan-400 focus:bg-cyan-900/20 transition-all uppercase"
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  let claimed = false;
                  if (val === 'kartka') {
                    useGameStore.getState().incrementScore(useGameStore.getState().score);
                    claimed = true;
                  } else if (val === 'trainofdiuty') {
                    useGameStore.getState().incrementScore(useGameStore.getState().score * 4);
                    claimed = true;
                  } else if (val === 'emberwoods') {
                    useGameStore.getState().incrementScore(4500);
                    claimed = true;
                  }
                  
                  if (claimed) {
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Windshield/Cockpit Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[20px] md:border-[40px] border-black opacity-10 rounded-3xl z-10"></div>
      <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-black to-transparent opacity-80 pointer-events-none z-10"></div>

      {/* Top HUD */}
      <div className="relative z-20 flex justify-between items-start p-6 md:p-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          {isGracePeriod && !isCaught && gameMode === 'city' && (
            <div className="bg-emerald-500/80 backdrop-blur-md px-6 py-3 rounded-sm border-l-4 border-emerald-300 animate-pulse outline outline-4 outline-emerald-500/50">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Fory goniących</div>
              <div className="text-xl md:text-3xl font-mono text-white">{Math.max(0, 12 - Math.floor(time / 1000))}s</div>
            </div>
          )}
          {gameMode === 'playground' && (
            <div className="bg-amber-500/80 backdrop-blur-md px-6 py-3 rounded-sm border-l-4 border-amber-300">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Zabawa</div>
              <div className="text-xl md:text-xl font-black text-white">PLAYGROUND</div>
              <button 
                onClick={() => {
                  useGameStore.getState().setGameMode('city');
                  useGameStore.getState().setIsCaught(true); // show menu
                }}
                className="mt-2 pointer-events-auto bg-black/50 hover:bg-black text-white px-2 py-1 text-xs font-bold rounded"
              >
                Wyjdź (Wróć do miasta)
              </button>
            </div>
          )}
          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-sm border-l-4 border-cyan-400">
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold">Czas</div>
            <div className="text-xl md:text-3xl font-mono">{formatTime(time)}</div>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-sm text-sm">
            <span className="text-slate-400">STATUS:</span> <span className="font-mono text-green-400">ONLINE</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-slate-400">PLAYERS:</span> <span className="font-mono text-cyan-400">{Object.keys(remotePlayers).length + 1}</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-sm text-sm">
            <span className="text-slate-400">PUNKTY:</span> <span className="font-mono text-yellow-400">{score}</span>
            {driftCombo > 1 && (
               <span className="ml-2 font-black text-rose-500 text-lg animate-pulse">x{driftCombo} DRIFT!</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom HUD: Dashboard Controls */}
      <div className="relative z-20 mt-auto flex justify-between items-end p-10 pointer-events-none">
        
        {/* Minimaps */}
        <div className="flex gap-4">
          <div className="w-48 h-48 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 p-4 relative overflow-hidden hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              {/* simple grid background for minimap */}
              <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10%_10%]"></div>
            </div>
            <Minimap playerIndex={0} />
            <div className="absolute inset-0 border-t-2 border-cyan-400/30 rounded-full"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-cyan-400 tracking-widest">P1</div>
          </div>

          {isCoop && (
            <div className="w-48 h-48 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 p-4 relative overflow-hidden hidden md:block">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10%_10%]"></div>
              </div>
              <Minimap playerIndex={1} />
              <div className="absolute inset-0 border-t-2 border-pink-500/30 rounded-full"></div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-pink-500 tracking-widest">P2</div>
            </div>
          )}
        </div>

        {/* Digital Speedometer */}
        <div className="flex items-end gap-4 md:gap-8 pb-4">
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-widest text-[#00ffff] mb-2 font-bold">N2O</div>
            <div className="w-4 h-32 bg-slate-800 rounded-sm relative overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-[#00ffff] transition-all duration-75 shadow-[0_0_10px_#00ffff]"
                style={{ height: `${useGameStore((state) => state.nitroAmount)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">RPM</div>
            <div className="flex gap-1 h-32 items-end">
              {Array.from({ length: 9 }).map((_, i) => {
                const isActive = speedKmH > i * (2500 / 9);
                const baseColor = i > 7 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : i > 4 ? 'bg-cyan-400' : 'bg-cyan-500';
                const color = isActive ? baseColor : 'bg-slate-700';
                return (
                  <div key={i} className={`w-1 ${color} transition-colors duration-100`} style={{ height: `${(i + 1) * 8 + 16}px` }}></div>
                );
              })}
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl p-4 md:p-8 rounded-2xl border border-white/5 flex flex-col items-center min-w-[150px] md:min-w-[200px]">
            {isCoop ? (
              <div className="flex gap-4 px-2 w-full justify-around pt-2">
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-1">P1</div>
                  <div className="text-3xl md:text-5xl font-black italic tracking-tighter text-white">{speedKmH.toFixed(0)}</div>
                </div>
                <div className="w-px bg-white/10 mx-2"></div>
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-rose-400 font-bold tracking-widest uppercase mb-1">P2</div>
                  <div className="text-3xl md:text-5xl font-black italic tracking-tighter text-white">{p2SpeedKmH.toFixed(0)}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-5xl md:text-6xl font-black italic tracking-tighter">
                  {speedKmH.toFixed(0)}
                </div>
                <div className="text-[10px] md:text-xs text-cyan-400 font-bold tracking-[0.3em] mt-1 uppercase">KM/H</div>
              </>
            )}
          </div>

          <div className="flex flex-col items-center bg-cyan-500 text-black px-4 md:px-6 py-4 rounded-xl">
            <div className="text-[10px] font-black uppercase tracking-tighter">Gear</div>
            <div className="text-3xl md:text-4xl font-black">
              {speedKmH < 1 ? 'N' : speedKmH < 625 ? '1' : speedKmH < 1250 ? '2' : speedKmH < 1875 ? '3' : '4'}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Hints */}
      <div className="absolute top-4 right-4 md:bottom-4 md:left-1/2 md:-translate-x-1/2 flex flex-col items-center gap-1 md:gap-2 text-[8px] md:text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] z-20 w-max">
        <div className="flex gap-4 md:gap-8">
          <span>P1: [W] Gaz</span>
          <span>[S] Wsteczny</span>
          <span>[A/D] Skręt</span>
          <span>[Space] Ręczny</span>
          <span>[LShift] Nitro</span>
          <span>[V] Kamera</span>
        </div>
        {isCoop && (
          <div className="flex gap-4 md:gap-8 text-rose-400/30">
            <span>P2: [↑] Gaz</span>
            <span>[↓] Wsteczny</span>
            <span>[←/→] Skręt</span>
            <span>[RCtrl] Ręczny</span>
            <span>[RShift] Nitro</span>
            <span>[L] Kamera</span>
          </div>
        )}
      </div>
    </div>
  );
}
