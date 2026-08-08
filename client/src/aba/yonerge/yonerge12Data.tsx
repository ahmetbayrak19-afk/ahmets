import topImg from './sesgorsel/top.png';
import sepetImg from './sesgorsel/sepet.png';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import marakasImg from './sesgorsel/Marakas.png';
import kalemImg from './sesgorsel/kalem.png';
import marakasSes from './sesgorsel/marakas.mp3';
import topsepetSes from './sesgorsel/topsepet.mp3';

const SES41 = import.meta.glob('./sesgorsel/ses/41ses/*.mp3', { eager: true, import: 'default' }) as Record<string, string>;
export function ses41(name: string): string {
  return SES41[`./sesgorsel/ses/41ses/${name}.mp3`] || '';
}
export const SES41_BY_ID: Record<string, string> = {
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

export type ActKind =
  | 'tap'
  | 'hold'
  | 'drag'
  | 'swipe'
  | 'draw'
  | 'shake'
  | 'rotate'
  | 'balloon'
  | 'marakas'
  | 'bell'
  | 'target';

export interface SceneItem {
  id: string;
  kind: ActKind;
  emoji?: string;
  img?: string;
  dropTarget?: string;
  mergeImg?: string;
  successSound?: string;
}

export interface TripleTask {
  id: string;
  text: string;
  sequence: [string, string, string];
  items: SceneItem[];
}

export const TASK_POOL: TripleTask[] = [
  {
    id: 't01',
    text: 'Yıldıza dokun, topu sepete koy, zile bas',
    sequence: ['star', 'ball', 'bell'],
    items: [
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'ball', kind: 'drag', img: topImg, dropTarget: 'basket', mergeImg: sepetTopImg, successSound: topsepetSes },
      { id: 'basket', kind: 'target', img: sepetImg },
      { id: 'bell', kind: 'bell' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
    ],
  },
  {
    id: 't02',
    text: 'Kalbe basılı tut, kaleme dokun, daire çiz',
    sequence: ['heart', 'pencil', 'draw'],
    items: [
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'pencil', kind: 'tap', img: kalemImg },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'bell', kind: 'bell' },
      { id: 'card', kind: 'swipe', emoji: '🃏' },
    ],
  },
  {
    id: 't03',
    text: 'Zile bas, yıldızı çöpe at, balonu patlat',
    sequence: ['bell', 'star', 'balloon'],
    items: [
      { id: 'bell', kind: 'bell' },
      { id: 'star', kind: 'drag', emoji: '⭐', dropTarget: 'trash' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
      { id: 'balloon', kind: 'balloon' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
  {
    id: 't04',
    text: 'Kartı kaydır, topu sepete koy, telefonu çevir',
    sequence: ['card', 'ball', 'rotate'],
    items: [
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'ball', kind: 'drag', img: topImg, dropTarget: 'basket', mergeImg: sepetTopImg, successSound: topsepetSes },
      { id: 'basket', kind: 'target', img: sepetImg },
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't05',
    text: 'Balonu patlat, kalbe basılı tut, kaleme dokun',
    sequence: ['balloon', 'heart', 'pencil'],
    items: [
      { id: 'balloon', kind: 'balloon' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'pencil', kind: 'tap', img: kalemImg },
      { id: 'bell', kind: 'bell' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't06',
    text: 'Yıldıza dokun, marakası salla, kartı kaydır',
    sequence: ['star', 'marakas', 'card'],
    items: [
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'marakas', kind: 'marakas', img: marakasImg, successSound: marakasSes },
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'heart', kind: 'hold', emoji: '🧡' },
      { id: 'bell', kind: 'bell' },
    ],
  },
  {
    id: 't07',
    text: 'Topu sepete koy, balonu patlat, zile bas',
    sequence: ['ball', 'balloon', 'bell'],
    items: [
      { id: 'ball', kind: 'drag', img: topImg, dropTarget: 'basket', mergeImg: sepetTopImg, successSound: topsepetSes },
      { id: 'basket', kind: 'target', img: sepetImg },
      { id: 'balloon', kind: 'balloon' },
      { id: 'bell', kind: 'bell' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't08',
    text: 'Kaleme dokun, daire çiz, telefonu çevir',
    sequence: ['pencil', 'draw', 'rotate'],
    items: [
      { id: 'pencil', kind: 'tap', img: kalemImg },
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'bell', kind: 'bell' },
      { id: 'heart', kind: 'tap', emoji: '❤️' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't09',
    text: 'Yıldızı çöpe at, marakası salla, onaya bas',
    sequence: ['star', 'marakas', 'ok'],
    items: [
      { id: 'star', kind: 'drag', emoji: '⭐', dropTarget: 'trash' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
      { id: 'marakas', kind: 'marakas', img: marakasImg, successSound: marakasSes },
      { id: 'ok', kind: 'tap', emoji: '✅' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
  {
    id: 't10',
    text: 'Kartı kaydır, balonu patlat, kalbe basılı tut',
    sequence: ['card', 'balloon', 'heart'],
    items: [
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'balloon', kind: 'balloon' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'bell', kind: 'bell' },
    ],
  },
  {
    id: 't11',
    text: 'Zile bas, kaleme dokun, topu sepete koy',
    sequence: ['bell', 'pencil', 'ball'],
    items: [
      { id: 'bell', kind: 'bell' },
      { id: 'pencil', kind: 'tap', img: kalemImg },
      { id: 'ball', kind: 'drag', img: topImg, dropTarget: 'basket', mergeImg: sepetTopImg, successSound: topsepetSes },
      { id: 'basket', kind: 'target', img: sepetImg },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't12',
    text: 'Telefonu çevir, yıldıza dokun, balonu patlat',
    sequence: ['rotate', 'star', 'balloon'],
    items: [
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'balloon', kind: 'balloon' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'bell', kind: 'bell' },
    ],
  },
  {
    id: 't13',
    text: 'Marakası salla, kartı kaydır, zile bas',
    sequence: ['marakas', 'card', 'bell'],
    items: [
      { id: 'marakas', kind: 'marakas', img: marakasImg, successSound: marakasSes },
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'bell', kind: 'bell' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
  {
    id: 't14',
    text: 'Kaleme dokun, daire çiz, marakası salla',
    sequence: ['pencil', 'draw', 'marakas'],
    items: [
      { id: 'pencil', kind: 'tap', img: kalemImg },
      { id: 'marakas', kind: 'marakas', img: marakasImg, successSound: marakasSes },
      { id: 'bell', kind: 'bell' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'heart', kind: 'tap', emoji: '❤️' },
    ],
  },
  {
    id: 't15',
    text: 'Telefonu salla, yıldıza dokun, zile bas',
    sequence: ['shake', 'star', 'bell'],
    items: [
      { id: 'shake', kind: 'shake', emoji: '📱' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'bell', kind: 'bell' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'card', kind: 'swipe', emoji: '🃏' },
    ],
  },
  {
    id: 't16',
    text: 'Yıldıza dokun, telefonu salla, balonu patlat',
    sequence: ['star', 'shake', 'balloon'],
    items: [
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'shake', kind: 'shake', emoji: '📱' },
      { id: 'balloon', kind: 'balloon' },
      { id: 'bell', kind: 'bell' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
];
