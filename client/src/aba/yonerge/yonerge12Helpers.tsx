import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import kirmiziBalon from './sesgorsel/kirmizibalon.png';
import maviBalon from './sesgorsel/mavibalon.png';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import zilAcikImg from './sesgorsel/zilacik.png';
import zilKapaliImg from './sesgorsel/zilkapali.png';
import zilSesi from './sesgorsel/zilsesi.mp3';
import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';
import type { SceneItem } from './yonerge12Data';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function playFx(src?: string) {
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = 0.9;
    a.play().catch(() => {});
  } catch {
    /* */
  }
}

export function playNeutralTransition(): Promise<void> {
  return new Promise((resolve) => {
    const src = NEUTRAL_SOUNDS[Math.floor(Math.random() * NEUTRAL_SOUNDS.length)];
    try {
      const a = new Audio(src);
      a.volume = 1;
      const done = () => resolve();
      a.addEventListener('ended', done, { once: true });
      a.addEventListener('error', done, { once: true });
      a.play().catch(done);
    } catch {
      resolve();
    }
  });
}
