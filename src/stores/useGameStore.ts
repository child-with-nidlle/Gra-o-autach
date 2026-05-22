import { create } from 'zustand';
import { Vector3 } from 'three';

interface Obstacle {
  position: [number, number, number];
  size: [number, number, number];
}

interface Upgrades {
  engine: number;
  tires: number;
  brakes: number;
}

export type CarModel = 'default' | 'mini' | 'bmw' | 'ferrari' | 'f1';

export interface CarCustomization {
  color: string;
  detailColor: string;
  hasSpoiler: boolean;
  hasDecals: boolean;
  ownsSpoiler: boolean;
  ownsDecals: boolean;
}

export const DEFAULT_CUSTOMIZATIONS: Record<CarModel, CarCustomization> = {
  default: { color: 'hotpink', detailColor: '#ffffff', hasSpoiler: false, hasDecals: false, ownsSpoiler: false, ownsDecals: false },
  mini: { color: '#2563eb', detailColor: '#ffffff', hasSpoiler: false, hasDecals: false, ownsSpoiler: false, ownsDecals: false },
  bmw: { color: '#334155', detailColor: '#ffffff', hasSpoiler: false, hasDecals: false, ownsSpoiler: false, ownsDecals: false },
  ferrari: { color: '#dc2626', detailColor: '#ffffff', hasSpoiler: false, hasDecals: false, ownsSpoiler: false, ownsDecals: false },
  f1: { color: '#ef4444', detailColor: '#ffffff', hasSpoiler: false, hasDecals: false, ownsSpoiler: false, ownsDecals: false },
};

export const CAR_PRICES: Record<CarModel, number> = {
  default: 0,
  mini: 5000,
  bmw: 15000,
  ferrari: 50000,
  f1: 100000,
};

export const MAP_SIZE = 800;

interface RemotePlayer {
  id: string;
  position: [number, number, number];
  rotation: number;
  color: string;
  carModel: CarModel;
  customization?: CarCustomization;
}

interface GameState {
  speed: number;
  score: number;
  obstacles: Obstacle[];
  cameraMode: number;
  playerPosition: [number, number, number];
  playerRotation: number;
  trafficPositions: [number, number, number][];
  policePositions: [number, number, number][];
  remotePlayers: Record<string, RemotePlayer>;
  isCaught: boolean;
  isGracePeriod: boolean;
  survivalTime: number;
  upgrades: Upgrades;
  ownedCars: CarModel[];
  activeCar: CarModel;
  customizations: Record<CarModel, CarCustomization>;
  boughtCars?: boolean; // deprecated?
  nitroAmount: number;
  bonusClaimed: boolean;
  isCoop: boolean;
  p2Car: CarModel;
  p2Speed: number;
  p2Position: [number, number, number];
  p2Rotation: number;
  toggleCoop: () => void;
  setP2Car: (model: CarModel) => void;
  setP2Speed: (speed: number) => void;
  setP2Position: (pos: [number, number, number]) => void;
  setP2Rotation: (rot: number) => void;
  setSpeed: (speed: number) => void;
  incrementScore: (amount: number) => void;
  setObstacles: (obstacles: Obstacle[]) => void;
  setCameraMode: (mode: number) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (rot: number) => void;
  setTrafficPositions: (pos: [number, number, number][]) => void;
  setPolicePositions: (pos: [number, number, number][]) => void;
  setRemotePlayers: (players: Record<string, RemotePlayer> | ((prev: Record<string, RemotePlayer>) => Record<string, RemotePlayer>)) => void;
  setIsCaught: (caught: boolean) => void;
  setIsGracePeriod: (grace: boolean) => void;
  setSurvivalTime: (time: number) => void;
  buyUpgrade: (type: keyof Upgrades, cost: number) => void;
  buyCar: (model: CarModel) => void;
  setActiveCar: (model: CarModel) => void;
  setNitroAmount: (amount: number | ((prev: number) => number)) => void;
  setBonusClaimed: (claimed: boolean) => void;
  setCarColor: (model: CarModel, color: string) => void;
  setCarDetailColor: (model: CarModel, detailColor: string) => void;
  toggleCarPart: (model: CarModel, part: 'spoiler' | 'decals') => void;
  buyCarPart: (model: CarModel, part: 'spoiler' | 'decals', cost: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  speed: 0,
  score: 0,
  obstacles: [],
  cameraMode: 0,
  playerPosition: [0, 0, 0],
  playerRotation: 0,
  trafficPositions: [],
  policePositions: [],
  remotePlayers: {},
  isCaught: false,
  isGracePeriod: true,
  survivalTime: 0,
  upgrades: { engine: 1, tires: 1, brakes: 1 },
  ownedCars: ['default'],
  activeCar: 'default',
  customizations: DEFAULT_CUSTOMIZATIONS,
  nitroAmount: 100,
  bonusClaimed: false,
  isCoop: false,
  p2Car: 'mini',
  p2Speed: 0,
  p2Position: [4, 0, 0],
  p2Rotation: 0,
  toggleCoop: () => set((state) => ({ isCoop: !state.isCoop })),
  setP2Car: (model) => set({ p2Car: model }),
  setP2Speed: (speed) => set({ p2Speed: speed }),
  setP2Position: (pos) => set({ p2Position: pos }),
  setP2Rotation: (rot) => set({ p2Rotation: rot }),
  setSpeed: (speed) => set({ speed }),
  incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
  setObstacles: (obstacles) => set({ obstacles }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setTrafficPositions: (pos) => set({ trafficPositions: pos }),
  setPolicePositions: (pos) => set({ policePositions: pos }),
  setRemotePlayers: (players) => set((state) => ({
    remotePlayers: typeof players === 'function' ? players(state.remotePlayers) : players
  })),
  setIsCaught: (caught) => set({ isCaught: caught }),
  setIsGracePeriod: (grace) => set({ isGracePeriod: grace }),
  setSurvivalTime: (time) => set({ survivalTime: time }),
  buyUpgrade: (type, cost) => set((state) => ({
    score: state.score >= cost ? state.score - cost : state.score,
    upgrades: state.score >= cost ? { ...state.upgrades, [type]: state.upgrades[type] + 1 } : state.upgrades
  })),
  buyCar: (model) => set((state) => ({
    score: state.score >= CAR_PRICES[model] ? state.score - CAR_PRICES[model] : state.score,
    ownedCars: state.score >= CAR_PRICES[model] && !state.ownedCars.includes(model) ? [...state.ownedCars, model] : state.ownedCars
  })),
  setActiveCar: (model) => set({ activeCar: model }),
  setNitroAmount: (amount) => set((state) => ({ 
    nitroAmount: typeof amount === 'function' ? amount(state.nitroAmount) : amount 
  })),
  setBonusClaimed: (claimed) => set({ bonusClaimed: claimed }),
  setCarColor: (model, color) => set((state) => ({
    customizations: {
      ...state.customizations,
      [model]: { ...state.customizations[model], color }
    }
  })),
  setCarDetailColor: (model, detailColor) => set((state) => ({
    customizations: {
      ...state.customizations,
      [model]: { ...state.customizations[model], detailColor }
    }
  })),
  toggleCarPart: (model, part) => set((state) => {
    const cust = state.customizations[model];
    const key = part === 'spoiler' ? 'hasSpoiler' : 'hasDecals';
    return {
      customizations: {
        ...state.customizations,
        [model]: { ...cust, [key]: !cust[key] }
      }
    };
  }),
  buyCarPart: (model, part, cost) => set((state) => {
    if (state.score < cost) return state;
    const cust = state.customizations[model];
    const ownsKey = part === 'spoiler' ? 'ownsSpoiler' : 'ownsDecals';
    const hasKey = part === 'spoiler' ? 'hasSpoiler' : 'hasDecals';
    if (cust[ownsKey]) return state; // Already owns

    return {
      score: state.score - cost,
      customizations: {
        ...state.customizations,
        [model]: { ...cust, [ownsKey]: true, [hasKey]: true }
      }
    };
  }),
}));
