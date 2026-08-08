import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import kirmiziBalon from './sesgorsel/kirmizibalon.png';
import maviBalon from './sesgorsel/mavibalon.png';
import topImg from './sesgorsel/top.png';
import sepetImg from './sesgorsel/sepet.png';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import marakasImg from './sesgorsel/Marakas.png';
import kalemImg from './sesgorsel/kalem.png';
import zilAcikImg from './sesgorsel/zilacik.png';
import zilKapaliImg from './sesgorsel/zilkapali.png';

import marakasSes from './sesgorsel/marakas.mp3';
import topsepetSes from './sesgorsel/topsepet.mp3';
import zilSesi from './sesgorsel/zilsesi.mp3';
import onaySes from './sesgorsel/onay.mp3';

const SES41 = import.meta.glob('./sesgorsel/ses/41ses/*.mp3', { eager: true, import: 'default' }) as Record<string, string>;
function ses41(name: string): string {
  return SES41[`./sesgorsel/ses/41ses/${name}.mp3`] || '';
}
const SES41_BY_ID: Record<string, string> = {
  t01: 'yildizdokuntopkoyzilbas',
  t02: 'kalpdokunkalemdokundaireciz',
  t03: 'zilebasyildizcöpatbalonpatlat',
  t04: 'kartkaydırtopusepetekoytelefonucevir',
  t05: 'balonupatlatkalbebasilitutkalemedokun',
  t06: 'yildizadokunmarkassallakartikaydir',
  t07: 'topusepetekoybalonupatlatzilebas',
  t08: 'kalemedokundaireciztelefonucevir',
  t09: 'yildizcöpatmarakassallaonaybas',
  t10: 'kartikaydirbalonupatlatkalbebasilitut',
  t11: 'zilebaskalemedokuntopusepetekoy',
  t12: 'telefonuceviryildizdokunbalonupatlat',
  t13: 'marakassallakartkaydirzilbas',
  t14: 'kalemdokundairecizmarakassalla',
  t15: 'telefonusallayildizdokunzilbas',
  t16: 'yildizdokuntelefonsallabalonpatlat',
};

// Nötr geçiş sesleri (3lü yönerge bitince, sonraki yönergeye geçmeden önce)
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];
