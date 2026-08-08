import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

import diskipkirlikapali from './sesgorsel/yonerge13/diskipkirlikapaliagiz.png';
import diskipkirli from './sesgorsel/yonerge13/diskipkirli.png';
import diskirli from './sesgorsel/yonerge13/diskirli.png';
import distemiz from './sesgorsel/yonerge13/distemiz.png';
import disfircasi from './sesgorsel/yonerge13/disfircasi.png';
import disfircasikullan from './sesgorsel/yonerge13/disfircasikullan.png';

import sacdapdaginik from './sesgorsel/yonerge13/sacdapdaginik.png';
import sacdaginik from './sesgorsel/yonerge13/sacdaginik.png';
import sacduzgun from './sesgorsel/yonerge13/sacduzgun.png';
import tarakImg from './sesgorsel/yonerge13/tarak.png';
import tarakkullan from './sesgorsel/yonerge13/tarakkullan.png';

import yatakImg from './sesgorsel/yonerge13/yatak.png';
import eliyanancocuk from './sesgorsel/yonerge13/eliyanancocuk.png';

import fircaSes from './sesgorsel/yonerge13/fircasesi.mp3';
import sacTaramaSes from './sesgorsel/yonerge13/sactaramases.mp3';

import uykuluesniyorVid from './sesgorsel/yonerge13/uykuluesniyor.mp4';
import uykuluyatagayatanVid from './sesgorsel/yonerge13/uykuluyatagayatan.mp4';
import uykuluesniyorSes from './sesgorsel/yonerge13/uykuluesniyor.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

type SceneType = 'candle' | 'teeth' | 'hair' | 'sleep' | 'teacher';
interface Trial { id: string; type: SceneType; text: string; }

const TRIALS: Trial[] = [
  { id: 't1', type: 'candle', text: 'Yanan eli kurtar!' },
  { id: 't2', type: 'teeth', text: 'Çocuğun dişlerini temizle' },
  { id: 't3', type: 'hair', text: 'Çocuğun saçını tara' },
  { id: 't4', type: 'sleep', text: 'Uykusu gelen çocuğu uyut' },
  // Öğretmen: durum → mantıklı çözüm (düz emir değil)
  { id: 't5', type: 'teacher', text: 'Elleri kirli, yıka' },
  { id: 't6', type: 'teacher', text: 'Ayakkabı bağları açık, bağla' },
  { id: 't7', type: 'teacher', text: 'Oda karanlık, ışığı aç' },
  { id: 't8', type: 'teacher', text: 'Kapı açık kalmış, kapat' },
  { id: 't9', type: 'teacher', text: 'Masa dağınık, topla' },
  { id: 't10', type: 'teacher', text: 'Pencere açık ve üşüyor, kapat' },
];
