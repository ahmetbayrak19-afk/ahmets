import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XCircle, Check, X, Trophy, PlayCircle, RefreshCw, ListOrdered, Box,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import topImg from './sesgorsel/top.png';
import kalemImg from './sesgorsel/kalem.png';
import kitapImg from './sesgorsel/kitap.png';
import anahtarImg from './sesgorsel/anahtar.png';
import arabaImg from './sesgorsel/araba.png';
import elmaImg from './sesgorsel/elma.png';
import cicekImg from './sesgorsel/cicek.png';
import saatImg from './sesgorsel/saat.png';
import silgiImg from './sesgorsel/silgi.png';
import defterImg from './sesgorsel/defter.png';
import cantaImg from './sesgorsel/canta.png';
import tarakImg from './sesgorsel/tarak.png';
import bebekImg from './sesgorsel/bebek.png';
import sepetImg from './sesgorsel/sepet.png';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import havucImg from './sesgorsel/havuc.png';
import tavsanImg from './sesgorsel/tavsan.png';
import tavsanhavucImg from './sesgorsel/tavsanhavuc.png';
import kilitImg from './sesgorsel/kilit.png';
import kilitanahtarImg from './sesgorsel/kilitanahtar.png';
import vazoImg from './sesgorsel/vazo.png';
import vazocicekImg from './sesgorsel/vazocicek.png';
import marakasImg from './sesgorsel/Marakas.png';
import zilkapaliImg from './sesgorsel/zilkapali.png';
import zilacikImg from './sesgorsel/zilacik.png';
import yumurta1 from './sesgorsel/yumurta1.png';
import yumurta2 from './sesgorsel/yumurta2.png';
import yumurta3 from './sesgorsel/yumurta3.png';
import yumurta4 from './sesgorsel/yumurta4.png';
import hamur1 from './sesgorsel/hamur1.png';
import hamur2 from './sesgorsel/hamur2.png';
import hamur3 from './sesgorsel/hamur3.png';
import hamur4 from './sesgorsel/hamur4.png';
import hediye1 from './sesgorsel/hediye1.png';
import hediye2 from './sesgorsel/hediye2.png';
import hediye3 from './sesgorsel/hediye3.png';
import hediye4 from './sesgorsel/hediye4.png';

import girisSes from './sesgorsel/yonerge33giris.mp3';
import yumurtacatlama1 from './sesgorsel/yumurtacatlama1.mp3';
import yumurtacatlama2 from './sesgorsel/yumurtacatlama2.mp3';
import yumurtacatlama3 from './sesgorsel/yumurtacatlama3.mp3';
import hamurvurmasesi from './sesgorsel/hamurvurmasesi.mp3';
import kutuacSes from './sesgorsel/kutuac.mp3';
import marakasSes from './sesgorsel/marakas.mp3';
import zilsesi from './sesgorsel/zilsesi.mp3';
import topsepetSes from './sesgorsel/topsepet.mp3';

import s_ziplaelcirp from './sesgorsel/ziplaelcirp.mp3';
import s_elcirpzipla from './sesgorsel/elcirpzipla.mp3';
import s_kalkotur from './sesgorsel/kalkotur.mp3';
import s_oturkalk from './sesgorsel/oturkalk.mp3';
import s_elkaldirindir from './sesgorsel/elkaldirindir.mp3';
import s_omuzsilkzipla from './sesgorsel/omuzsilkzipla.mp3';
import s_ziplatopavur from './sesgorsel/ziplatopavur.mp3';
import s_topavurelcirp from './sesgorsel/topavurelcirp.mp3';
import s_sandalyeyeoturonecek from './sesgorsel/sandalyeyeoturonecek.mp3';
import s_ayakkabinadokuncorabinadokun from './sesgorsel/ayakkabinadokuncorabinadokun.mp3';
import s_burundokunkulakdokun from './sesgorsel/burundokunkulakdokun.mp3';
import s_yereoturkalk from './sesgorsel/yereoturkalk.mp3';
import s_ayaklavurelcirp from './sesgorsel/ayaklavurelcirp.mp3';
import s_basegelcirp from './sesgorsel/basegelcirp.mp3';
import s_basinisagasolacevir from './sesgorsel/basinisagasolacevir.mp3';
import s_dizbukelcirp from './sesgorsel/dizbukelcirp.mp3';
import s_elbaglazipla from './sesgorsel/elbaglazipla.mp3';
import s_elcirpburnunadokun from './sesgorsel/elcirpburnunadokun.mp3';
import s_kulakdokunelcirp from './sesgorsel/kulakdokunelcirp.mp3';
import s_kolacindir from './sesgorsel/kolacindir.mp3';
import s_topualbirak from './sesgorsel/topualbirak.mp3';
import s_ziplaburnunadokun from './sesgorsel/ziplaburnunadokun.mp3';
import s_marakassallazipla from './sesgorsel/marakassallazipla.mp3';
import s_elcirpmarakassalla from './sesgorsel/elcirpmarakassalla.mp3';
import s_marakassallatopavur from './sesgorsel/marakassallatopavur.mp3';
import s_topadokunkalemedokun from './sesgorsel/topadokunkalemedokun.mp3';
import s_kalemedokuntopadokun from './sesgorsel/kalemedokuntopadokun.mp3';
import s_elmadokunkitapdokun from './sesgorsel/elmadokunkitapdokun.mp3';
import s_anahtardokunsaatdokun from './sesgorsel/anahtardokunsaatdokun.mp3';
import s_cicekdokunarabadokun from './sesgorsel/cicekdokunarabadokun.mp3';
import s_silgidokundefterdokun from './sesgorsel/silgidokundefterdokun.mp3';
import s_cantadokuntarakdokun from './sesgorsel/cantadokuntarakdokun.mp3';
import s_bebekdokuntopdokun from './sesgorsel/bebekdokuntopdokun.mp3';
import s_kitapkalemtopdokun from './sesgorsel/kitapkalemtopdokun.mp3';
import s_arabasaatcicekdokun from './sesgorsel/arabasaatcicekdokun.mp3';
import s_yumurtakirarabadokun from './sesgorsel/yumurtakirarabadokun.mp3';
import s_yumurtakircicekdokunsaatdokun from './sesgorsel/yumurtakircicekdokunsaatdokun.mp3';
import s_hamurezbebekdokun from './sesgorsel/hamurezbebekdokun.mp3';
import s_kutuactopdokun from './sesgorsel/kutuactopdokun.mp3';
import s_havucvertopdokun from './sesgorsel/havucvertopdokun.mp3';
import s_havuctavsanvertopusepeteat from './sesgorsel/havuctavsanvertopusepeteat.mp3';
import s_topsepeteatkalemdokun from './sesgorsel/topsepeteatkalemdokun.mp3';
import s_marakassallakalemdokun from './sesgorsel/marakassallakalemdokun.mp3';
import s_marakassallatopadokun from './sesgorsel/marakassallatopadokun.mp3';
import s_marakassallatopdokunkalemdokun from './sesgorsel/marakassallatopdokunkalemdokun.mp3';
import s_zilbaselmadokun from './sesgorsel/zilbaselmadokun.mp3';
import s_zilbaskalemdokun from './sesgorsel/zilbaskalemdokun.mp3';
import s_zilbasmarakassalla from './sesgorsel/zilbasmarakassalla.mp3';
import s_anahtartakbebekdokun from './sesgorsel/anahtartakbebekdokun.mp3';
import s_cicekvazokoyelmadokun from './sesgorsel/cicekvazokoyelmadokun.mp3';

export interface NesneDef { id: string; name: string; img?: string; }

const OBJECTS: Record<string, NesneDef> = {
  top: { id: 'top', name: 'Top', img: topImg },
  kalem: { id: 'kalem', name: 'Kalem', img: kalemImg },
  kitap: { id: 'kitap', name: 'Kitap', img: kitapImg },
  anahtar: { id: 'anahtar', name: 'Anahtar', img: anahtarImg },
  araba: { id: 'araba', name: 'Araba', img: arabaImg },
  elma: { id: 'elma', name: 'Elma', img: elmaImg },
  cicek: { id: 'cicek', name: 'Çiçek', img: cicekImg },
  saat: { id: 'saat', name: 'Saat', img: saatImg },
  silgi: { id: 'silgi', name: 'Silgi', img: silgiImg },
  defter: { id: 'defter', name: 'Defter', img: defterImg },
  canta: { id: 'canta', name: 'Çanta', img: cantaImg },
  tarak: { id: 'tarak', name: 'Tarak', img: tarakImg },
  bebek: { id: 'bebek', name: 'Bebek', img: bebekImg },
  sepet: { id: 'sepet', name: 'Sepet', img: sepetImg },
  havuc: { id: 'havuc', name: 'Havuç', img: havucImg },
  tavsan: { id: 'tavsan', name: 'Tavşan', img: tavsanImg },
  kilit: { id: 'kilit', name: 'Kilit', img: kilitImg },
  vazo: { id: 'vazo', name: 'Vazo', img: vazoImg },
  marakas: { id: 'marakas', name: 'Marakas', img: marakasImg },
  zil: { id: 'zil', name: 'Zil', img: zilkapaliImg },
  yumurta: { id: 'yumurta', name: 'Yumurta', img: yumurta1 },
  hamur: { id: 'hamur', name: 'Hamur', img: hamur1 },
  hediye: { id: 'hediye', name: 'Hediye', img: hediye1 },
};

export type StepKind = 'tap' | 'multi' | 'drag' | 'shake' | 'hold';
export interface TaskStep {
  kind: StepKind; targetId: string; dropId?: string;
  stages?: string[]; stageSounds?: string[]; mergeImg?: string; successSound?: string;
}
export type TaskType = 'physical' | 'digital';
export interface SequentialTask {
  id: string; text: string; type: TaskType; materials: string[];
  sound?: string; steps?: TaskStep[]; distractors?: string[];
}

const YUMURTA_STAGES = [yumurta1, yumurta2, yumurta3, yumurta4];
const HAMUR_STAGES = [hamur1, hamur2, hamur3, hamur4];
const HEDIYE_STAGES = [hediye1, hediye2, hediye3, hediye4];
const YUMURTA_SOUNDS = [yumurtacatlama1, yumurtacatlama2, yumurtacatlama3];
const HAMUR_SOUNDS = [hamurvurmasesi, hamurvurmasesi, hamurvurmasesi];
const HEDIYE_SOUNDS = [kutuacSes, kutuacSes, kutuacSes];

const TASK_POOL: SequentialTask[] = [
  { id: 'p01', text: 'Zıpla, sonra ellerini çırp', type: 'physical', materials: [], sound: s_ziplaelcirp },
  { id: 'p02', text: 'Ellerini çırp, sonra zıpla', type: 'physical', materials: [], sound: s_elcirpzipla },
  { id: 'p03', text: 'Kalk, sonra otur', type: 'physical', materials: ['Sandalye'], sound: s_kalkotur },
  { id: 'p04', text: 'Otur, sonra kalk', type: 'physical', materials: ['Sandalye'], sound: s_oturkalk },
  { id: 'p05', text: 'Ellerini kaldır, sonra indir', type: 'physical', materials: [], sound: s_elkaldirindir },
  { id: 'p06', text: 'Omuzlarını silk, sonra zıpla', type: 'physical', materials: [], sound: s_omuzsilkzipla },
  { id: 'p07', text: 'Zıpla, sonra topa vur', type: 'physical', materials: ['Top'], sound: s_ziplatopavur },
  { id: 'p08', text: 'Topa vur, sonra ellerini çırp', type: 'physical', materials: ['Top'], sound: s_topavurelcirp },
  { id: 'p09', text: 'Sandalyeye otur, sonra öne çek', type: 'physical', materials: ['Sandalye'], sound: s_sandalyeyeoturonecek },
  { id: 'p10', text: 'Ayakkabına dokun, sonra çorabına dokun', type: 'physical', materials: ['Ayakkabı', 'Çorap'], sound: s_ayakkabinadokuncorabinadokun },
  { id: 'p11', text: 'Burnuna dokun, sonra kulağına dokun', type: 'physical', materials: [], sound: s_burundokunkulakdokun },
  { id: 'p12', text: 'Yere otur, sonra kalk', type: 'physical', materials: [], sound: s_yereoturkalk },
  { id: 'p13', text: 'Ayağını kaldır, sonra ellerini çırp', type: 'physical', materials: [], sound: s_ayaklavurelcirp },
  { id: 'p14', text: 'Başına gel, sonra ellerini çırp', type: 'physical', materials: [], sound: s_basegelcirp },
  { id: 'p15', text: 'Başını sağa sola çevir', type: 'physical', materials: [], sound: s_basinisagasolacevir },
  { id: 'p16', text: 'Dizini bük, sonra ellerini çırp', type: 'physical', materials: [], sound: s_dizbukelcirp },
  { id: 'p17', text: 'Ellerini bağla, sonra zıpla', type: 'physical', materials: [], sound: s_elbaglazipla },
  { id: 'p18', text: 'Ellerini çırp, sonra burnuna dokun', type: 'physical', materials: [], sound: s_elcirpburnunadokun },
  { id: 'p19', text: 'Kulağına dokun, sonra ellerini çırp', type: 'physical', materials: [], sound: s_kulakdokunelcirp },
  { id: 'p20', text: 'Kollarını aç, sonra indir', type: 'physical', materials: [], sound: s_kolacindir },
  { id: 'p21', text: 'Topu al, sonra bırak', type: 'physical', materials: ['Top'], sound: s_topualbirak },
  { id: 'p22', text: 'Zıpla, sonra burnuna dokun', type: 'physical', materials: [], sound: s_ziplaburnunadokun },
  { id: 'p23', text: 'Marakası salla, sonra zıpla', type: 'physical', materials: ['Marakas'], sound: s_marakassallazipla },
  { id: 'p24', text: 'Ellerini çırp, sonra marakası salla', type: 'physical', materials: ['Marakas'], sound: s_elcirpmarakassalla },
  { id: 'p25', text: 'Marakası salla, sonra topa vur', type: 'physical', materials: ['Marakas', 'Top'], sound: s_marakassallatopavur },
  { id: 'd01', text: 'Topa dokun, sonra kaleme dokun', type: 'digital', materials: [], sound: s_topadokunkalemedokun, steps: [{ kind: 'tap', targetId: 'top' }, { kind: 'tap', targetId: 'kalem' }] },
  { id: 'd02', text: 'Kaleme dokun, sonra topa dokun', type: 'digital', materials: [], sound: s_kalemedokuntopadokun, steps: [{ kind: 'tap', targetId: 'kalem' }, { kind: 'tap', targetId: 'top' }] },
  { id: 'd03', text: 'Elmaya dokun, sonra kitaba dokun', type: 'digital', materials: [], sound: s_elmadokunkitapdokun, steps: [{ kind: 'tap', targetId: 'elma' }, { kind: 'tap', targetId: 'kitap' }] },
  { id: 'd04', text: 'Anahtara dokun, sonra saate dokun', type: 'digital', materials: [], sound: s_anahtardokunsaatdokun, steps: [{ kind: 'tap', targetId: 'anahtar' }, { kind: 'tap', targetId: 'saat' }] },
  { id: 'd05', text: 'Çiçeğe dokun, sonra arabaya dokun', type: 'digital', materials: [], sound: s_cicekdokunarabadokun, steps: [{ kind: 'tap', targetId: 'cicek' }, { kind: 'tap', targetId: 'araba' }] },
  { id: 'd06', text: 'Silgiye dokun, sonra deftere dokun', type: 'digital', materials: [], sound: s_silgidokundefterdokun, steps: [{ kind: 'tap', targetId: 'silgi' }, { kind: 'tap', targetId: 'defter' }] },
  { id: 'd07', text: 'Çantaya dokun, sonra tarağa dokun', type: 'digital', materials: [], sound: s_cantadokuntarakdokun, steps: [{ kind: 'tap', targetId: 'canta' }, { kind: 'tap', targetId: 'tarak' }] },
  { id: 'd08', text: 'Bebeğe dokun, sonra topa dokun', type: 'digital', materials: [], sound: s_bebekdokuntopdokun, steps: [{ kind: 'tap', targetId: 'bebek' }, { kind: 'tap', targetId: 'top' }] },
  { id: 'd09', text: 'Kitaba, kaleme ve topa sırayla dokun', type: 'digital', materials: [], sound: s_kitapkalemtopdokun, steps: [{ kind: 'tap', targetId: 'kitap' }, { kind: 'tap', targetId: 'kalem' }, { kind: 'tap', targetId: 'top' }] },
  { id: 'd10', text: 'Arabaya, saate ve çiçeğe sırayla dokun', type: 'digital', materials: [], sound: s_arabasaatcicekdokun, steps: [{ kind: 'tap', targetId: 'araba' }, { kind: 'tap', targetId: 'saat' }, { kind: 'tap', targetId: 'cicek' }] },
  { id: 'd11', text: 'Yumurtayı kır, sonra arabaya dokun', type: 'digital', materials: [], sound: s_yumurtakirarabadokun, steps: [{ kind: 'multi', targetId: 'yumurta', stages: YUMURTA_STAGES, stageSounds: YUMURTA_SOUNDS }, { kind: 'tap', targetId: 'araba' }], distractors: ['kalem', 'elma'] },
  { id: 'd12', text: 'Yumurtayı kır, çiçeğe dokun, saate dokun', type: 'digital', materials: [], sound: s_yumurtakircicekdokunsaatdokun, steps: [{ kind: 'multi', targetId: 'yumurta', stages: YUMURTA_STAGES, stageSounds: YUMURTA_SOUNDS }, { kind: 'tap', targetId: 'cicek' }, { kind: 'tap', targetId: 'saat' }] },
  { id: 'd13', text: 'Hamuru ez, sonra bebeğe dokun', type: 'digital', materials: [], sound: s_hamurezbebekdokun, steps: [{ kind: 'multi', targetId: 'hamur', stages: HAMUR_STAGES, stageSounds: HAMUR_SOUNDS }, { kind: 'tap', targetId: 'bebek' }], distractors: ['top', 'kalem'] },
  { id: 'd14', text: 'Kutuyu aç, sonra topa dokun', type: 'digital', materials: [], sound: s_kutuactopdokun, steps: [{ kind: 'multi', targetId: 'hediye', stages: HEDIYE_STAGES, stageSounds: HEDIYE_SOUNDS }, { kind: 'tap', targetId: 'top' }], distractors: ['elma', 'kalem'] },
  { id: 'd15', text: 'Havucu tavşana ver, sonra topa dokun', type: 'digital', materials: [], sound: s_havucvertopdokun, steps: [{ kind: 'drag', targetId: 'havuc', dropId: 'tavsan', mergeImg: tavsanhavucImg }, { kind: 'tap', targetId: 'top' }], distractors: ['kalem', 'elma'] },
  { id: 'd16', text: 'Havucu tavşana ver, topu sepete at', type: 'digital', materials: [], sound: s_havuctavsanvertopusepeteat, steps: [{ kind: 'drag', targetId: 'havuc', dropId: 'tavsan', mergeImg: tavsanhavucImg }, { kind: 'drag', targetId: 'top', dropId: 'sepet', mergeImg: sepetTopImg, successSound: topsepetSes }] },
  { id: 'd17', text: 'Topu sepete at, sonra kaleme dokun', type: 'digital', materials: [], sound: s_topsepeteatkalemdokun, steps: [{ kind: 'drag', targetId: 'top', dropId: 'sepet', mergeImg: sepetTopImg, successSound: topsepetSes }, { kind: 'tap', targetId: 'kalem' }], distractors: ['elma', 'araba'] },
  { id: 'd18', text: 'Anahtarı kilide tak, sonra bebeğe dokun', type: 'digital', materials: [], sound: s_anahtartakbebekdokun, steps: [{ kind: 'drag', targetId: 'anahtar', dropId: 'kilit', mergeImg: kilitanahtarImg }, { kind: 'tap', targetId: 'bebek' }], distractors: ['top', 'kalem'] },
  { id: 'd19', text: 'Çiçeği vazoya koy, sonra elmaya dokun', type: 'digital', materials: [], sound: s_cicekvazokoyelmadokun, steps: [{ kind: 'drag', targetId: 'cicek', dropId: 'vazo', mergeImg: vazocicekImg }, { kind: 'tap', targetId: 'elma' }], distractors: ['top', 'saat'] },
  { id: 'd20', text: 'Marakası salla, sonra kaleme dokun', type: 'digital', materials: [], sound: s_marakassallakalemdokun, steps: [{ kind: 'shake', targetId: 'marakas', successSound: marakasSes }, { kind: 'tap', targetId: 'kalem' }], distractors: ['top', 'elma'] },
  { id: 'd21', text: 'Marakası salla, sonra topa dokun', type: 'digital', materials: [], sound: s_marakassallatopadokun, steps: [{ kind: 'shake', targetId: 'marakas', successSound: marakasSes }, { kind: 'tap', targetId: 'top' }], distractors: ['kalem', 'elma'] },
  { id: 'd22', text: 'Marakası salla, topa dokun, kaleme dokun', type: 'digital', materials: [], sound: s_marakassallatopdokunkalemdokun, steps: [{ kind: 'shake', targetId: 'marakas', successSound: marakasSes }, { kind: 'tap', targetId: 'top' }, { kind: 'tap', targetId: 'kalem' }] },
  { id: 'd23', text: 'Zile bas, sonra elmaya dokun', type: 'digital', materials: [], sound: s_zilbaselmadokun, steps: [{ kind: 'hold', targetId: 'zil', successSound: zilsesi }, { kind: 'tap', targetId: 'elma' }], distractors: ['top', 'kalem'] },
  { id: 'd24', text: 'Zile bas, sonra kaleme dokun', type: 'digital', materials: [], sound: s_zilbaskalemdokun, steps: [{ kind: 'hold', targetId: 'zil', successSound: zilsesi }, { kind: 'tap', targetId: 'kalem' }], distractors: ['top', 'elma'] },
  { id: 'd25', text: 'Zile bas, sonra marakası salla', type: 'digital', materials: [], sound: s_zilbasmarakassalla, steps: [{ kind: 'hold', targetId: 'zil', successSound: zilsesi }, { kind: 'shake', targetId: 'marakas', successSound: marakasSes }], distractors: ['top', 'kalem'] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function playFx(src?: string) {
  if (!src) return;
  const a = new Audio(src); a.volume = 1; a.play().catch(() => {});
}
function buildGrid(task: SequentialTask): NesneDef[] {
  if (!task.steps) return [];
  const ids = new Set<string>();
  task.steps.forEach((s) => { ids.add(s.targetId); if (s.dropId) ids.add(s.dropId); });
  (task.distractors || []).forEach((d) => ids.add(d));
  const all = Object.keys(OBJECTS);
  const extra = shuffle(all.filter((id) => !ids.has(id))).slice(0, Math.max(0, 5 - ids.size));
  extra.forEach((e) => ids.add(e));
  return shuffle(Array.from(ids).map((id) => OBJECTS[id]).filter(Boolean));
}
function vibrate(pattern: number | number[] = 40) {
  try { navigator.vibrate?.(pattern); } catch { /* */ }
}

interface Yonerge8Props {
  itemCode?: string; itemText?: string;
  onClose: () => void; onComplete: (success: boolean) => void;
}
type Phase = 'prep' | 'running' | 'result';

const HOLD_OK_MS = 500;
const MOVE_FOR_DRAG = 8;
const SHAKE_THRESHOLD = 6;
/** En az 1.5 sn aktif sallama */
const SHAKE_MIN_MS = 1500;
const TAP_MAX_MOVE = 18;
const HOLD_CANCEL_MOVE = 55;

export default function Yonerge8({
  itemCode = 'YTB 3.3',
  itemText = 'Verilen Yönergeleri İstenen Sıra ile Yerine Getirme',
  onClose, onComplete,
}: Yonerge8Props) {
  const [selected, setSelected] = useState<SequentialTask[]>(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('prep');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [multiCount, setMultiCount] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  /** Sürükleme kaynağı — verildi/atıldı, artık görünmez */
  const [consumedIds, setConsumedIds] = useState<string[]>([]);
  const [mergeMap, setMergeMap] = useState<Record<string, string>>({});
  const [zilPressed, setZilPressed] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [gridItems, setGridItems] = useState<NesneDef[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [shakeActiveId, setShakeActiveId] = useState<string | null>(null);

  const ghostRef = useRef<HTMLImageElement | null>(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const ptr = useRef<{
    id: string; pointerId: number; startX: number; startY: number;
    lastX: number; lastY: number; moved: boolean;
    shakeAccumMs: number; lastShakeMoveAt: number; shakeStarted: boolean;
    isHoldTarget: boolean; holdStart: number; isShakeTarget: boolean;
  } | null>(null);

  const zilAudioRef = useRef<HTMLAudioElement | null>(null);
  const marakasAudioRef = useRef<HTMLAudioElement | null>(null);
  const vibrateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** multi (hamur/yumurta/hediye) 3. dokunuş sonrası animasyon — ekstra basışları yoksay */
  const multiFinishingRef = useRef(false);
  const introRef = useRef<HTMLAudioElement | null>(null);
  const instrRef = useRef<HTMLAudioElement | null>(null);
  const lockedRef = useRef(false);
  const stepIdxRef = useRef(0);
  const multiCountRef = useRef(0);
  const currentIndexRef = useRef(0);
  const selectedRef = useRef(selected);
  const scoreRef = useRef(0);
  const completeStepRef = useRef<() => void>(() => {});
  const failTrialRef = useRef<(id?: string) => void>(() => {});

  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { stepIdxRef.current = stepIdx; }, [stepIdx]);
  useEffect(() => { multiCountRef.current = multiCount; }, [multiCount]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const currentTask = selected[currentIndex];
  const currentStep = currentTask?.steps?.[stepIdx];
  const materialsList = (() => {
    const set = new Set<string>();
    selected.forEach((t) => t.materials.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  })();

  const stopIntro = () => { if (introRef.current) { introRef.current.pause(); introRef.current.currentTime = 0; } };
  const stopInstr = () => { if (instrRef.current) { instrRef.current.pause(); instrRef.current.currentTime = 0; } };

  const startZilSound = () => {
    stopZilSound();
    const a = new Audio(zilsesi);
    a.volume = 1; a.loop = true;
    zilAudioRef.current = a;
    a.play().catch(() => {});
    vibrate(35);
    vibrateTimerRef.current = setInterval(() => vibrate(20), 160);
  };
  const stopZilSound = () => {
    if (zilAudioRef.current) {
      zilAudioRef.current.pause();
      zilAudioRef.current.currentTime = 0;
      zilAudioRef.current = null;
    }
    if (vibrateTimerRef.current) {
      clearInterval(vibrateTimerRef.current);
      vibrateTimerRef.current = null;
    }
    vibrate(0);
  };

  const startMarakasSound = () => {
    if (marakasAudioRef.current) return;
    const a = new Audio(marakasSes);
    a.volume = 1;
    a.loop = true;
    marakasAudioRef.current = a;
    a.play().catch(() => {});
  };
  const stopMarakasSound = () => {
    if (marakasAudioRef.current) {
      marakasAudioRef.current.pause();
      marakasAudioRef.current.currentTime = 0;
      marakasAudioRef.current = null;
    }
  };

  const updateGhostPos = (x: number, y: number, angle = 0) => {
    dragPosRef.current = { x, y };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = ghostRef.current;
      if (el) {
        el.style.left = `${dragPosRef.current.x - 56}px`;
        el.style.top = `${dragPosRef.current.y - 56}px`;
        el.style.transform = `rotate(${angle}deg)`;
        el.style.display = 'block';
      }
    });
  };

  const hideGhost = () => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setDragId(null);
    if (ghostRef.current) {
      ghostRef.current.style.display = 'none';
      ghostRef.current.style.transform = 'none';
    }
  };

  useEffect(() => {
    if (phase !== 'prep') return;
    const a = new Audio(girisSes);
    introRef.current = a; a.volume = 1; a.play().catch(() => {});
    return () => { a.pause(); a.currentTime = 0; };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running') return;
    const task = selected[currentIndex];
    if (!task?.sound) return;
    stopInstr();
    const a = new Audio(task.sound);
    instrRef.current = a; a.volume = 1; a.play().catch(() => {});
    return () => { a.pause(); a.currentTime = 0; };
  }, [phase, currentIndex]); // eslint-disable-line

  const resetStepState = useCallback(() => {
    setStepIdx(0); stepIdxRef.current = 0;
    setMultiCount(0); multiCountRef.current = 0;
    multiFinishingRef.current = false;
    setDoneIds([]); setConsumedIds([]); setMergeMap({});
    setZilPressed(false); setWrongId(null);
    hideGhost(); setShakeActiveId(null); ptr.current = null; stopZilSound(); stopMarakasSound();
  }, []); // eslint-disable-line

  const replaceTask = (index: number) => {
    const used = new Set(selected.map((t) => t.id));
    const alts = TASK_POOL.filter((t) => !used.has(t.id));
    if (alts.length === 0) return;
    const next = alts[Math.floor(Math.random() * alts.length)];
    setSelected((prev) => { const copy = [...prev]; copy[index] = next; return copy; });
  };

  const startAssessment = () => {
    stopIntro();
    setCurrentIndex(0); currentIndexRef.current = 0;
    setScore(0); scoreRef.current = 0;
    setLocked(false); lockedRef.current = false;
    resetStepState();
    const first = selected[0];
    if (first?.type === 'digital') setGridItems(buildGrid(first)); else setGridItems([]);
    setPhase('running');
  };

  const goNext = useCallback((correct: boolean) => {
    const newScore = scoreRef.current + (correct ? 1 : 0);
    scoreRef.current = newScore; setScore(newScore);
    const next = currentIndexRef.current + 1;
    if (next >= 10) {
      setPhase('result');
      if (newScore >= 8) confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
      return;
    }
    currentIndexRef.current = next; setCurrentIndex(next);
    setLocked(false); lockedRef.current = false;
    resetStepState();
    const nextTask = selectedRef.current[next];
    if (nextTask?.type === 'digital') setGridItems(buildGrid(nextTask)); else setGridItems([]);
  }, [resetStepState]);

  const failTrial = useCallback((id?: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true; setLocked(true);
    multiFinishingRef.current = false;
    stopZilSound(); stopMarakasSound(); ptr.current = null; hideGhost();
    setShakeActiveId(null); setZilPressed(false);
    if (id) setWrongId(id);
    setTimeout(() => { setWrongId(null); goNext(false); }, 500);
  }, [goNext]); // eslint-disable-line

  const completeStep = useCallback(() => {
    if (lockedRef.current) return;
    const task = selectedRef.current[currentIndexRef.current];
    if (!task?.steps) return;
    const si = stepIdxRef.current;
    const step = task.steps[si];
    if (step) setDoneIds((d) => (d.includes(step.targetId) ? d : [...d, step.targetId]));
    const nextStep = si + 1;
    multiFinishingRef.current = false;
    if (nextStep >= task.steps.length) {
      lockedRef.current = true; setLocked(true);
      setTimeout(() => goNext(true), 400);
    } else {
      stepIdxRef.current = nextStep; setStepIdx(nextStep);
      multiCountRef.current = 0; setMultiCount(0);
      setZilPressed(false); setShakeActiveId(null);
      ptr.current = null; stopZilSound(); stopMarakasSound();
    }
  }, [goNext]);

  useEffect(() => {
    completeStepRef.current = completeStep;
    failTrialRef.current = failTrial;
  }, [completeStep, failTrial]);

  const getStep = () => selectedRef.current[currentIndexRef.current]?.steps?.[stepIdxRef.current];

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = ptr.current;
      if (!p || lockedRef.current || e.pointerId !== p.pointerId) return;

      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (p.isHoldTarget) {
        if (dist > HOLD_CANCEL_MOVE) {
          stopZilSound(); setZilPressed(false);
          p.isHoldTarget = false; p.moved = true;
        }
      } else if (dist > MOVE_FOR_DRAG) {
        p.moved = true;
      }

      if (p.isShakeTarget || p.moved) {
        setDragId((prev) => (prev === p.id ? prev : p.id));
        const angle = p.isShakeTarget
          ? Math.max(-28, Math.min(28, dx * 0.35 + Math.sin(Date.now() / 60) * 8))
          : 0;
        updateGhostPos(e.clientX, e.clientY, angle);
      }

      // Sallama: aktif hareket süresini biriktir, min 1.5 sn
      const sdx = e.clientX - p.lastX;
      const sdy = e.clientY - p.lastY;
      const stepDist = Math.sqrt(sdx * sdx + sdy * sdy);
      if (p.isShakeTarget && stepDist > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (!p.shakeStarted) {
          p.shakeStarted = true;
          p.lastShakeMoveAt = now;
          p.shakeAccumMs = 0;
          startMarakasSound();
        } else {
          const gap = now - p.lastShakeMoveAt;
          // Aralıksız sallama say (0.4 sn'den uzun duraklama birikimi sıfırlamaz ama eklemez)
          if (gap < 400) p.shakeAccumMs += gap;
          p.lastShakeMoveAt = now;
        }
        p.lastX = e.clientX; p.lastY = e.clientY;

        const step = getStep();
        if (step?.kind === 'shake' && step.targetId === p.id && p.shakeAccumMs >= SHAKE_MIN_MS) {
          stopMarakasSound();
          setShakeActiveId(null); hideGhost(); ptr.current = null;
          completeStepRef.current();
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      const p = ptr.current;
      if (!p || e.pointerId !== p.pointerId) return;

      if (p.isHoldTarget) {
        const heldMs = Date.now() - p.holdStart;
        stopZilSound(); setZilPressed(false); hideGhost(); setShakeActiveId(null);
        ptr.current = null;
        if (lockedRef.current) return;
        if (heldMs >= HOLD_OK_MS) completeStepRef.current();
        return;
      }

      stopZilSound(); stopMarakasSound(); setZilPressed(false); setShakeActiveId(null);
      if (lockedRef.current) { ptr.current = null; hideGhost(); return; }

      // multi animasyon penceresinde tüm dokunuşları yoksay
      if (multiFinishingRef.current) {
        ptr.current = null; hideGhost(); return;
      }

      const step = getStep();
      const totalMove = Math.sqrt((e.clientX - p.startX) ** 2 + (e.clientY - p.startY) ** 2);
      const wasTap = !p.moved && totalMove < TAP_MAX_MOVE;

      if (p.moved && step) {
        if (ghostRef.current) ghostRef.current.style.display = 'none';
        const dropEl = document.elementFromPoint(e.clientX, e.clientY);
        const dropId =
          dropEl?.closest?.('[data-obj-id]')?.getAttribute('data-obj-id') ||
          (dropEl as HTMLElement | null)?.getAttribute?.('data-obj-id');

        if (step.kind === 'drag') {
          if (p.id === step.targetId && dropId === step.dropId) {
            // Hedef birleşik görsel + kaynak kaybolur
            if (step.mergeImg) {
              setMergeMap((m) => ({ ...m, [step.dropId!]: step.mergeImg! }));
            }
            setConsumedIds((c) => (c.includes(step.targetId) ? c : [...c, step.targetId]));
            playFx(step.successSound);
            hideGhost(); ptr.current = null; completeStepRef.current(); return;
          }
          if (dropId && dropId !== p.id) {
            hideGhost(); ptr.current = null;
            failTrialRef.current(p.id === step.targetId ? dropId : p.id); return;
          }
          hideGhost(); ptr.current = null; return;
        }

        if (step.kind === 'shake' && p.id === step.targetId) {
          hideGhost(); ptr.current = null; return;
        }

        if (p.id !== step.targetId) {
          hideGhost(); ptr.current = null; failTrialRef.current(p.id); return;
        }
      }

      if (wasTap && step) {
        if (step.kind === 'multi') {
          if (p.id === step.targetId) {
            // 3'e ulaştıysa ekstra basışları yoksay (sonraki adıma sızmasın)
            if (multiCountRef.current >= 3) {
              // ignore
            } else {
              const next = multiCountRef.current + 1;
              const soundIdx = Math.min(multiCountRef.current, (step.stageSounds?.length || 1) - 1);
              playFx(step.stageSounds?.[soundIdx]);
              multiCountRef.current = next; setMultiCount(next);
              // Sadece 3. basışta BİR KEZ completeStep planla
              if (next === 3) {
                multiFinishingRef.current = true;
                setTimeout(() => {
                  multiFinishingRef.current = false;
                  completeStepRef.current();
                }, 700);
              }
            }
          } else {
            failTrialRef.current(p.id);
          }
        } else if (step.kind === 'tap') {
          if (p.id === step.targetId) completeStepRef.current();
          else failTrialRef.current(p.id);
        } else if (step.kind === 'drag') {
          if (p.id !== step.targetId && p.id !== step.dropId) failTrialRef.current(p.id);
        } else if (step.kind === 'shake') {
          if (p.id !== step.targetId) failTrialRef.current(p.id);
        } else if (step.kind === 'hold') {
          if (p.id !== step.targetId) failTrialRef.current(p.id);
        }
      }

      ptr.current = null; hideGhost();
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, []); // eslint-disable-line

  const onItemPointerDown = (e: React.PointerEvent, id: string) => {
    if (lockedRef.current) return;
    if (multiFinishingRef.current) return;
    if (consumedIds.includes(id)) return;
    e.preventDefault(); e.stopPropagation();
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* */ }

    const step = getStep();
    const isHoldTarget = !!(step?.kind === 'hold' && step.targetId === id);
    const isShakeTarget = !!(step?.kind === 'shake' && step.targetId === id);

    ptr.current = {
      id, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      moved: false,
      shakeAccumMs: 0, lastShakeMoveAt: 0, shakeStarted: false,
      isHoldTarget, holdStart: Date.now(), isShakeTarget,
    };

    if (isHoldTarget) {
      setZilPressed(true);
      startZilSound();
    }
    if (isShakeTarget) {
      setShakeActiveId(id);
      setDragId(id);
      updateGhostPos(e.clientX, e.clientY, 0);
    }
  };

  useEffect(() => () => { stopZilSound(); stopMarakasSound(); }, []);

  const handlePhysical = (correct: boolean) => {
    if (lockedRef.current) return;
    lockedRef.current = true; setLocked(true); goNext(correct);
  };

  const displayImg = (id: string): string | undefined => {
    if (mergeMap[id]) return mergeMap[id];
    if (id === 'zil') return zilPressed ? zilacikImg : zilkapaliImg;
    const step = currentStep;
    if (step?.kind === 'multi' && step.targetId === id && step.stages) {
      return step.stages[Math.min(multiCount, step.stages.length - 1)];
    }
    if (doneIds.includes(id)) {
      const st = currentTask?.steps?.find((s) => s.targetId === id && s.kind === 'multi');
      if (st?.stages) return st.stages[st.stages.length - 1];
    }
    return OBJECTS[id]?.img;
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none" style={{ touchAction: 'none' }}>
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button onClick={() => { stopIntro(); stopInstr(); stopZilSound(); stopMarakasSound(); onClose(); }}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center px-2">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-100">{itemCode} — {itemText}</h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === 'prep' && 'HAZIRLIK'}
            {phase === 'running' && `DEĞERLENDİRME · ${currentIndex + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8" />
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950" style={{ touchAction: 'none' }}>
        {phase === 'prep' && (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300 pb-6 space-y-5 overflow-y-auto max-h-full" style={{ touchAction: 'pan-y' }}>
            <div className="text-center">
              <ListOrdered size={44} className="mx-auto text-blue-500 mb-3 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
              <h1 className="text-2xl font-black mb-2">Sıralı Görev Hazırlığı</h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                Bu oturumda <span className="text-blue-300 font-semibold">10 sıralı yönerge</span> sorulacak.
                İstemediğin göreve dokunarak değiştirebilirsin. Uygulama yönergeyi sesli okur.
              </p>
            </div>
            <div className="space-y-2 max-h-[42dvh] overflow-y-auto pr-1">
              {selected.map((task, i) => (
                <button key={`${task.id}-${i}`} type="button" onClick={() => replaceTask(i)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-900/70 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all group">
                  <span className="min-w-[28px] h-7 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 leading-snug">{task.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ' + (task.type === 'physical' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30')}>
                        {task.type === 'physical' ? 'Fiziksel' : 'Dijital'}
                      </span>
                      {task.materials.length > 0 && <span className="text-[10px] text-slate-500 truncate">{task.materials.join(', ')}</span>}
                    </div>
                  </div>
                  <RefreshCw size={14} className="text-slate-600 group-hover:text-blue-400 shrink-0 mt-1" />
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <Box size={16} className="text-amber-400" /><span className="text-xs font-bold uppercase tracking-wider">Hazır bulundurulacak malzemeler</span>
              </div>
              {materialsList.length === 0 ? (
                <p className="text-sm text-slate-500">Ekstra malzeme gerekmiyor (sadece beden hareketleri / ekran).</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {materialsList.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium">{m}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={startAssessment} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 active:scale-95 transition-all">
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {phase === 'running' && currentTask && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-6 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-5 md:p-8 flex flex-col items-center shadow-2xl mb-4">
              <span className={'text-xs font-bold tracking-widest uppercase mb-2 px-3 py-1 rounded-full ' + (currentTask.type === 'physical' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30')}>
                {currentTask.type === 'physical' ? 'Fiziksel' : 'Dijital'}
              </span>
              <h1 className="text-xl md:text-3xl font-black text-center text-white leading-tight">"{currentTask.text}"</h1>
              {currentTask.type === 'digital' && currentTask.steps && (
                <p className="text-slate-400 text-xs mt-2">
                  Adım {Math.min(stepIdx + 1, currentTask.steps.length)} / {currentTask.steps.length}
                  {currentStep?.kind === 'multi' && multiCount > 0 && ` · ${Math.min(multiCount, 3)}/3`}
                </p>
              )}
            </div>

            {currentTask.type === 'digital' && (
              <div className="grid grid-cols-2 landscape:grid-cols-3 gap-3 landscape:gap-4 w-full max-w-md landscape:max-w-2xl" style={{ touchAction: 'none' }}>
                {gridItems.map((item) => {
                  const consumed = consumedIds.includes(item.id);
                  const done = doneIds.includes(item.id) && !consumed;
                  const img = displayImg(item.id);
                  const hiding = dragId === item.id || consumed;
                  const shaking = shakeActiveId === item.id;
                  return (
                    <div key={item.id} data-obj-id={item.id} className="min-h-[120px] landscape:min-h-[100px] relative" style={{ touchAction: 'none' }}>
                      <div role="button" tabIndex={0} data-obj-id={item.id}
                        onPointerDown={(e) => onItemPointerDown(e, item.id)}
                        className={
                          `relative flex flex-col items-center justify-center rounded-2xl border-2 bg-slate-800/80 overflow-hidden w-full h-full p-2 transition-colors duration-150 ` +
                          (wrongId === item.id ? 'border-red-400 ring-2 ring-red-500/50 ' :
                            done ? 'border-green-400 ring-2 ring-green-500/40 bg-green-900/25 opacity-55 ' :
                            shaking ? 'border-amber-400 ring-2 ring-amber-500/40 ' :
                            zilPressed && item.id === 'zil' ? 'border-yellow-400 ring-2 ring-yellow-500/40 ' :
                            'border-slate-700 ') +
                          (locked || done || consumed ? 'pointer-events-none ' : 'cursor-grab active:cursor-grabbing ') +
                          (hiding ? 'opacity-0 ' : '')
                        }
                        style={{ touchAction: 'none' }}
                      >
                        {!consumed && img ? (
                          <img src={img} alt="" className="w-[80%] h-[80%] max-w-[120px] max-h-[120px] object-contain pointer-events-none" draggable={false} />
                        ) : !consumed ? (
                          <span className="text-5xl pointer-events-none">📦</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentTask.type === 'physical' && (
              <p className="text-slate-500 text-sm text-center max-w-md">
                Öğrenci istenen sırada yaparsa <span className="text-green-400">Yaptı</span>, aksi halde <span className="text-red-400">Yapamadı</span>.
              </p>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl animate-in zoom-in-95 duration-500">
            <Trophy size={72} className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'text-slate-500 mb-5'} />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10</p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2"><Check size={22} /> Kazanım başarıyla sağlandı!</div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2"><X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.</div>
            )}
            <button onClick={() => onComplete(score >= 8)} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-blue-900/50 w-full sm:w-auto">KAYDET VE ÇIK</button>
          </div>
        )}
      </div>

      <img
        ref={ghostRef}
        src={dragId && OBJECTS[dragId]?.img ? OBJECTS[dragId].img : ''}
        alt=""
        className="fixed pointer-events-none z-[200] w-28 h-28 object-contain opacity-95 drop-shadow-2xl"
        style={{ display: 'none', left: 0, top: 0, transformOrigin: 'center center' }}
        draggable={false}
      />

      {phase === 'running' && currentTask?.type === 'physical' && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button onClick={() => handlePhysical(false)} disabled={locked} className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 disabled:opacity-40">
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" /><span className="text-sm font-bold uppercase tracking-wider">Yapamadı</span>
          </button>
          <button onClick={() => handlePhysical(true)} disabled={locked} className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] disabled:opacity-40">
            <Check className="w-9 h-9 landscape:w-6 landscape:h-6" /><span className="text-sm font-bold uppercase tracking-wider">Yaptı</span>
          </button>
        </div>
      )}
    </div>
  );
}
