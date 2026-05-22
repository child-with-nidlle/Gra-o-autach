import { useEffect, useState } from 'react';

type Keys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  camera: boolean;
  nitro: boolean;
};

export const useKeyboard = (playerIndex: number = 0) => {
  const [keys, setKeys] = useState<Keys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    camera: false,
    nitro: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playerIndex === 0) {
        switch (e.code) {
          case 'KeyW': setKeys((keys) => ({ ...keys, forward: true })); break;
          case 'KeyS': setKeys((keys) => ({ ...keys, backward: true })); break;
          case 'KeyA': setKeys((keys) => ({ ...keys, left: true })); break;
          case 'KeyD': setKeys((keys) => ({ ...keys, right: true })); break;
          case 'Space': setKeys((keys) => ({ ...keys, brake: true })); break;
          case 'KeyV': setKeys((keys) => ({ ...keys, camera: true })); break;
          case 'ShiftLeft': setKeys((keys) => ({ ...keys, nitro: true })); break;
        }
      } else {
        switch (e.code) {
          case 'ArrowUp': setKeys((keys) => ({ ...keys, forward: true })); break;
          case 'ArrowDown': setKeys((keys) => ({ ...keys, backward: true })); break;
          case 'ArrowLeft': setKeys((keys) => ({ ...keys, left: true })); break;
          case 'ArrowRight': setKeys((keys) => ({ ...keys, right: true })); break;
          case 'ControlRight': setKeys((keys) => ({ ...keys, brake: true })); break;
          case 'KeyL': setKeys((keys) => ({ ...keys, camera: true })); break;
          case 'ShiftRight': setKeys((keys) => ({ ...keys, nitro: true })); break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (playerIndex === 0) {
        switch (e.code) {
          case 'KeyW': setKeys((keys) => ({ ...keys, forward: false })); break;
          case 'KeyS': setKeys((keys) => ({ ...keys, backward: false })); break;
          case 'KeyA': setKeys((keys) => ({ ...keys, left: false })); break;
          case 'KeyD': setKeys((keys) => ({ ...keys, right: false })); break;
          case 'Space': setKeys((keys) => ({ ...keys, brake: false })); break;
          case 'KeyV': setKeys((keys) => ({ ...keys, camera: false })); break;
          case 'ShiftLeft': setKeys((keys) => ({ ...keys, nitro: false })); break;
        }
      } else {
        switch (e.code) {
          case 'ArrowUp': setKeys((keys) => ({ ...keys, forward: false })); break;
          case 'ArrowDown': setKeys((keys) => ({ ...keys, backward: false })); break;
          case 'ArrowLeft': setKeys((keys) => ({ ...keys, left: false })); break;
          case 'ArrowRight': setKeys((keys) => ({ ...keys, right: false })); break;
          case 'ControlRight': setKeys((keys) => ({ ...keys, brake: false })); break;
          case 'KeyL': setKeys((keys) => ({ ...keys, camera: false })); break;
          case 'ShiftRight': setKeys((keys) => ({ ...keys, nitro: false })); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};
