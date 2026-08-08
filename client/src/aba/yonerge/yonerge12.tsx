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

type ActKind =
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

interface SceneItem {
  id: string;
  kind: ActKind;
  emoji?: string;
  img?: string;
  dropTarget?: string;
  mergeImg?: string;
  successSound?: string;
}

interface TripleTask {
  id: string;
  text: string;
  sequence: [string, string, string];
  items: SceneItem[];
}

const TASK_POOL: TripleTask[] = [
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
  try {
    const a = new Audio(src);
    a.volume = 0.9;
    a.play().catch(() => {});
  } catch {
    /* */
  }
}

/** 3lü yönerge bitince nötr geçiş sesi — ses bitene kadar Promise resolve eder. */
function playNeutralTransition(): Promise<void> {
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

function DrawOverlay({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef<{ x: number; y: number }[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const check = () => {
    if (finished.current || points.current.length < 18) return;
    let len = 0;
    for (let i = 1; i < points.current.length; i++) {
      const a = points.current[i - 1];
      const b = points.current[i];
      len += Math.hypot(a.x - b.x, a.y - b.y);
    }
    if (len > 120) {
      finished.current = true;
      onDone();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/95">
      <div className="shrink-0 flex items-center justify-between px-4 py-2">
        <span className="text-sm font-bold text-sky-300">Çiz</span>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 px-3 py-1 rounded-lg border border-slate-700">
          Vazgeç
        </button>
      </div>
      <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden border border-slate-700 touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onPointerDown={(e) => {
            drawing.current = true;
            points.current = [pos(e)];
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const p = pos(e);
            const pts = points.current;
            pts.push(p);
            const ctx = canvasRef.current!.getContext('2d')!;
            if (pts.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
            check();
          }}
        />
      </div>
    </div>
  );
}

function FloatingBalloon({ active, onPop }: { active: boolean; onPop: () => void }) {
  const [y, setY] = useState(110);
  const [x, setX] = useState(() => 20 + Math.random() * 60);
  const [sway, setSway] = useState(0);
  const [img, setImg] = useState(() => (Math.random() > 0.5 ? kirmiziBalon : maviBalon));
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const [burst, setBurst] = useState(false);
  const popped = useRef(false);
  const cycle = useRef(0);
  const baseX = useRef(20 + Math.random() * 60);

  const startRise = useCallback(() => {
    setY(110);
    baseX.current = 20 + Math.random() * 60;
    setX(baseX.current);
    setSway(0);
    setImg(Math.random() > 0.5 ? kirmiziBalon : maviBalon);
    setVisible(true);
    setScale(1);
    setBurst(false);
    popped.current = false;
    cycle.current += 1;
    const thisCycle = cycle.current;
    let start: number | null = null;
    const dur = 9000 + Math.random() * 2000;
    const tick = (t: number) => {
      if (cycle.current !== thisCycle) return;
      if (start == null) start = t;
      const elapsed = t - start;
      const p = Math.min(1, elapsed / dur);
      setY(110 - p * 130);
      const s = Math.sin(elapsed / 450) * 4.5;
      setSway(s);
      setX(baseX.current + s);
      if (p < 1 && !popped.current) {
        requestAnimationFrame(tick);
      } else if (p >= 1 && !popped.current) {
        setVisible(false);
        setTimeout(() => {
          if (cycle.current === thisCycle) startRise();
        }, 500);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    startRise();
    return () => {
      cycle.current += 1;
    };
  }, [startRise]);

  const handlePop = (e: React.MouseEvent | React.PointerEvent) => {
    if (popped.current || burst) return;
    popped.current = true;
    setBurst(true);
    setScale(1.4);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = (rect.left + rect.width / 2) / window.innerWidth;
    const oy = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 28,
      origin: { x: ox, y: oy },
      colors: ['#ef4444', '#3b82f6', '#fbbf24', '#f472b6', '#a78bfa'],
    });
    setTimeout(() => {
      setVisible(false);
      onPop();
    }, 200);
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="absolute z-30 leading-none active:scale-90 transition-transform duration-150"
      style={{
        left: x + '%',
        top: y + '%',
        transform: 'translate(-50%, -50%) scale(' + scale + ') rotate(' + sway * 1.2 + 'deg)',
        width: '8rem',
        height: '10rem',
      }}
      onClick={handlePop}
    >
      <img
        src={img}
        alt=""
        draggable={false}
        className={'w-full h-full object-contain drop-shadow-xl pointer-events-none select-none' + (burst ? ' opacity-0 transition-opacity duration-150' : '')}
      />
    </button>
  );
}

function DragItem({
  item,
  disabled,
  done,
  onDrop,
}: {
  item: SceneItem;
  disabled: boolean;
  done: boolean;
  onDrop: (clientX: number, clientY: number) => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  if (done) {
    return <div className="w-32 h-32 sm:w-40 sm:h-40" />;
  }

  return (
    <>
      <div
        className={'w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-2 border-slate-600 bg-slate-800 flex items-center justify-center touch-none' + (pos ? ' opacity-0' : '') + (disabled ? ' opacity-50' : '')}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          dragging.current = true;
          setPos({ x: e.clientX, y: e.clientY });
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setPos({ x: e.clientX, y: e.clientY });
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          setPos(null);
          onDrop(e.clientX, e.clientY);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setPos(null);
        }}
      >
        {item.img ? (
          <img src={item.img} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-contain pointer-events-none" draggable={false} />
        ) : (
          <span className="text-6xl sm:text-7xl leading-none pointer-events-none">{item.emoji}</span>
        )}
      </div>

      {pos && (
        <div
          className="fixed z-[90] pointer-events-none flex items-center justify-center"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            width: 112,
            height: 112,
          }}
        >
          {item.img ? (
            <img src={item.img} alt="" className="w-28 h-28 object-contain drop-shadow-2xl" draggable={false} />
          ) : (
            <span className="text-7xl leading-none drop-shadow-2xl">{item.emoji}</span>
          )}
        </div>
      )}
    </>
  );
}

function TileShell({ done, children, className = '' }: { done?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={'w-32 h-32 sm:w-40 sm:h-40 rounded-3xl flex items-center justify-center border-2 ' + (done ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60' : 'border-slate-600 bg-slate-800') + ' ' + className}
    >
      {children}
    </div>
  );
}

function ItemVisual({ item, size = 'md' }: { item: SceneItem; size?: 'md' | 'lg' }) {
  if (item.img) {
    return (
      <img
        src={item.img}
        alt=""
        draggable={false}
        className={(size === 'lg' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24') + ' object-contain pointer-events-none'}
      />
    );
  }
  return <span className="text-6xl sm:text-7xl leading-none pointer-events-none">{item.emoji}</span>;
}

function MarakasTile({
  item,
  done,
  disabled,
  isExpected,
  onShake,
}: {
  item: SceneItem;
  done: boolean;
  disabled: boolean;
  isExpected: boolean;
  onShake: () => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const moved = useRef(0);
  const fired = useRef(false);

  return (
    <div
      className={'w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-2 flex items-center justify-center touch-none ' + (done ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60' : 'border-slate-600 bg-slate-800') + (disabled ? ' opacity-50' : '')}
      style={{ transform: 'translate(' + offset.x + 'px, ' + offset.y + 'px)' }}
      onPointerDown={(e) => {
        if (disabled || done) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY };
        moved.current = 0;
        fired.current = false;
        setOffset({ x: 0, y: 0 });
      }}
      onPointerMove={(e) => {
        if (disabled || done) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        setOffset({ x: Math.max(-40, Math.min(40, dx)), y: Math.max(-40, Math.min(40, dy)) });
        moved.current = Math.max(moved.current, Math.hypot(dx, dy));
        if (!fired.current && moved.current > 55) {
          fired.current = true;
          onShake();
        }
      }}
      onPointerUp={() => setOffset({ x: 0, y: 0 })}
      onPointerCancel={() => setOffset({ x: 0, y: 0 })}
    >
      <img src={item.img} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-contain pointer-events-none drop-shadow-lg" draggable={false} />
    </div>
  );
}

function BellTile({
  done,
  disabled,
  isExpected,
  onSuccess,
}: {
  done: boolean;
  disabled: boolean;
  isExpected: boolean;
  onSuccess: () => void;
}) {
  const [pressing, setPressing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const successFired = useRef(false);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const clear = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPressing(false);
    stopSound();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className="relative active:scale-95"
      onPointerDown={(e) => {
        if (disabled || done) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = Date.now();
        successFired.current = false;
        setPressing(true);
        try {
          const a = new Audio(zilSesi);
          a.loop = true;
          a.volume = 0.85;
          a.play().catch(() => {});
          audioRef.current = a;
        } catch {
          /* */
        }
        const tick = () => {
          const elapsed = Date.now() - start.current;
          if (elapsed >= 1000 && !successFired.current) {
            successFired.current = true;
            stopSound();
            setPressing(false);
            onSuccess();
            return;
          }
          raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      <div
        className={'w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-2 flex items-center justify-center ' + (done ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60' : 'border-slate-600 bg-slate-800')}
      >
        <img
          src={pressing ? zilAcikImg : zilKapaliImg}
          alt=""
          draggable={false}
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain pointer-events-none"
        />
      </div>
    </button>
  );
}

interface Yonerge12Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';

export default function Yonerge12({
  itemCode = 'YTB 4.1',
  itemText = 'Birbirinden Bağımsız Üç Yönergeyi Yerine Getirme',
  onClose,
  onComplete,
}: Yonerge12Props) {
  const [tasks] = useState(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [seqPos, setSeqPos] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [mergedIds, setMergedIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [layoutItems, setLayoutItems] = useState<SceneItem[]>([]);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [balloonKey, setBalloonKey] = useState(0);
  const trialFailedRef = useRef(false);

  const task = tasks[idx];
  const instrAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!task) return;
    const src = ses41(SES41_BY_ID[task.id] || '');
    if (!src) return;
    try {
      if (instrAudioRef.current) { instrAudioRef.current.pause(); instrAudioRef.current = null; }
      const a = new Audio(src);
      a.volume = 1;
      instrAudioRef.current = a;
      a.play().catch(() => {});
    } catch { /* */ }
    return () => {
      if (instrAudioRef.current) { instrAudioRef.current.pause(); instrAudioRef.current = null; }
    };
  }, [task?.id]);

  const expected = task?.sequence[seqPos];
  const expectedKind = task?.items.find((i) => i.id === expected)?.kind;

  const pencilOpensDraw = expected === 'pencil' && task?.sequence[seqPos + 1] === 'draw';

  const lockPortrait = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('portrait');
      } else {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      }
    } catch (e) {
      console.log('Portrait lock hatası:', e);
    }
  }, []);

  const unlockOrientation = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('unlock');
      } else {
        await ScreenOrientation.unlock();
      }
    } catch (e) {
      console.log('Unlock hatası:', e);
    }
  }, []);

  useEffect(() => {
    lockPortrait();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      unlockOrientation();
    };
  }, [lockPortrait, unlockOrientation]);

  useEffect(() => {
    if (!task) return;
    setLayoutItems(shuffle(task.items.filter((i) => i.kind !== 'balloon' && i.kind !== 'draw')));
    setBalloonKey((k) => k + 1);
    setMergedIds(new Set());
    trialFailedRef.current = false;
  }, [task?.id]);

  const finishTrial = useCallback(
    async (correct: boolean) => {
      if (locked) return;
      setLocked(true);
      setDrawingId(null);
      const newScore = score + (correct ? 1 : 0);
      setScore(newScore);

      await playNeutralTransition();

      const next = idx + 1;
      if (next >= 10) {
        setPhase('result');
        return;
      }
      setIdx(next);
      setSeqPos(0);
      setDoneIds(new Set());
      trialFailedRef.current = false;
      setLocked(false);
    },
    [locked, score, idx]
  );

  const resolveStep = useCallback(
    (itemId: string, extra?: { merge?: boolean; sound?: string; skipDraw?: boolean; forceCorrect?: boolean }) => {
      if (locked || !task || seqPos >= 3) return;

      const isCorrect = extra?.forceCorrect !== undefined ? extra.forceCorrect : itemId === expected;
      if (!isCorrect) {
        trialFailedRef.current = true;
      }

      playFx(extra?.sound || onaySes);

      if (isCorrect) {
        if (extra?.merge) {
          setMergedIds((prev) => new Set(prev).add(itemId));
        }
        setDoneIds((prev) => new Set(prev).add(itemId));
      }

      let nextPos = seqPos + 1;
      if (extra?.skipDraw && task.sequence[seqPos + 1] === 'draw') {
        nextPos = seqPos + 2;
        if (isCorrect) {
          setDoneIds((prev) => new Set(prev).add('draw'));
        }
      }

      if (nextPos >= 3) {
        setSeqPos(3);
        const allCorrect = !trialFailedRef.current;
        setTimeout(() => finishTrial(allCorrect), 280);
      } else {
        setSeqPos(nextPos);
      }
    },
    [locked, task, expected, seqPos, finishTrial]
  );

  useEffect(() => {
    if (phase !== 'running' || locked) return;
    if (expectedKind !== 'shake') return;

    let last = 0;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = Date.now();
      if (mag > 28 && now - last > 1000) {
        last = now;
        resolveStep(expected!);
      }
    };
    const req = async () => {
      try {
        const DOM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOM.requestPermission === 'function') await DOM.requestPermission();
      } catch {
        /* */
      }
      window.addEventListener('devicemotion', handler);
    };
    req();
    return () => window.removeEventListener('devicemotion', handler);
  }, [phase, locked, expectedKind, expected, resolveStep]);

  useEffect(() => {
    if (phase !== 'running' || locked) return;
    if (expectedKind !== 'rotate') return;

    let baseBeta: number | null = null;
    let baseGamma: number | null = null;
    let fired = false;
    const handler = (e: DeviceOrientationEvent) => {
      if (fired) return;
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      if (baseBeta == null) {
        baseBeta = beta;
        baseGamma = gamma;
        return;
      }
      const dB = Math.abs(beta - baseBeta);
      const dG = Math.abs(gamma - (baseGamma || 0));
      if (dB > 80 || dG > 80) {
        fired = true;
        resolveStep(expected!);
      }
    };
    const req = async () => {
      try {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOE.requestPermission === 'function') await DOE.requestPermission();
      } catch {
        /* */
      }
      window.addEventListener('deviceorientation', handler);
    };
    req();
    return () => window.removeEventListener('deviceorientation', handler);
  }, [phase, locked, expectedKind, expected, resolveStep, seqPos, idx]);

  const hasBalloon = task?.items.some((i) => i.kind === 'balloon');

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 z-20">
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
          <XCircle className="w-6 h-6" />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            {phase === 'running' ? idx + 1 + '/10' : 'Sonuç'} · {itemCode}
          </p>
        </div>
        <div className="w-8 text-right text-xs font-bold text-violet-400 tabular-nums">
          {phase === 'running' ? score : ''}
        </div>
      </div>

      {phase === 'running' && task && (
        <>
          <div className="shrink-0 px-4 pt-3 pb-1 text-center">
            <div className="flex items-center justify-center gap-2 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={'h-1.5 w-8 rounded-full ' + (i < seqPos ? 'bg-emerald-400' : i === seqPos ? 'bg-violet-400' : 'bg-slate-700')}
                />
              ))}
            </div>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
            <div className="grid grid-cols-2 gap-5 sm:gap-6 place-items-center content-center w-full max-w-sm">
              {layoutItems.map((it) => {
                const isDone = doneIds.has(it.id);

                if (it.kind === 'drag') {
                  return (
                    <DragItem
                      key={it.id}
                      item={it}
                      disabled={locked}
                      done={isDone}
                      onDrop={(cx, cy) => {
                        if (locked) return;
                        const els = document.elementsFromPoint(cx, cy);
                        const dropEl = els.find((el) => el.getAttribute('data-drop-id'));
                        const dropId = dropEl?.getAttribute('data-drop-id');
                        if (!dropId) return;
                        const isCorrectDrop = dropId === it.dropTarget && it.id === expected;
                        resolveStep(it.id, {
                          merge: isCorrectDrop && !!it.mergeImg,
                          sound: isCorrectDrop ? it.successSound : undefined,
                          forceCorrect: isCorrectDrop,
                        });
                      }}
                    />
                  );
                }

                if (it.kind === 'target') {
                  const showMerge =
                    (it.id === 'basket' && mergedIds.has('ball')) ||
                    (it.id === 'trash' && doneIds.has('star') && task.items.find((x) => x.id === 'star')?.dropTarget === 'trash');
                  return (
                    <div key={it.id} data-drop-id={it.id}>
                      <TileShell done={false}>
                        {showMerge && it.id === 'basket' && sepetTopImg ? (
                          <img src={sepetTopImg} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" draggable={false} />
                        ) : (
                          <ItemVisual item={it} size="lg" />
                        )}
                      </TileShell>
                    </div>
                  );
                }

                if (it.kind === 'hold') {
                  return (
                    <HoldTile
                      key={it.id}
                      item={it}
                      done={isDone}
                      disabled={locked}
                      onHold={() => resolveStep(it.id)}
                      isExpected={expected === it.id}
                    />
                  );
                }

                if (it.kind === 'swipe') {
                  return (
                    <SwipeTile
                      key={it.id}
                      item={it}
                      done={isDone}
                      disabled={locked}
                      onSwipe={() => resolveStep(it.id)}
                      isExpected={expected === it.id}
                    />
                  );
                }

                if (it.kind === 'marakas') {
                  return (
                    <MarakasTile
                      key={it.id}
                      item={it}
                      done={isDone}
                      disabled={locked}
                      isExpected={expected === it.id}
                      onShake={() => resolveStep(it.id, { sound: expected === it.id ? it.successSound : undefined })}
                    />
                  );
                }

                if (it.kind === 'bell') {
                  return (
                    <BellTile
                      key={it.id}
                      done={isDone}
                      disabled={locked}
                      isExpected={expected === it.id}
                      onSuccess={() => resolveStep(it.id)}
                    />
                  );
                }

                if (it.kind === 'shake' || it.kind === 'rotate') {
                  return (
                    <TileShell key={it.id} done={isDone} className={!isDone ? 'border-violet-500/40' : ''}>
                      <ItemVisual item={it} size="lg" />
                    </TileShell>
                  );
                }

                return (
                  <button
                    key={it.id}
                    type="button"
                    disabled={locked || isDone}
                    onClick={() => {
                      if (it.id === 'pencil' && pencilOpensDraw) {
                        setDrawingId('draw');
                        setDoneIds((prev) => new Set(prev).add('pencil'));
                        playFx(onaySes);
                      } else {
                        resolveStep(it.id, { sound: it.successSound });
                      }
                    }}
                    className="active:scale-95"
                  >
                    <TileShell done={isDone}>
                      <ItemVisual item={it} />
                    </TileShell>
                  </button>
                );
              })}
            </div>

            {hasBalloon && !locked && (
              <FloatingBalloon
                key={task.id + '-' + balloonKey}
                active={expectedKind === 'balloon'}
                onPop={() => resolveStep('balloon')}
              />
            )}

            {drawingId && (
              <DrawOverlay
                onDone={() => {
                  setDrawingId(null);
                  resolveStep('pencil', { skipDraw: true, forceCorrect: true });
                }}
                onCancel={() => {
                  setDrawingId(null);
                  setDoneIds((prev) => {
                    const n = new Set(prev);
                    n.delete('pencil');
                    return n;
                  });
                }}
              />
            )}
          </div>

          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center">
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(false)}
              className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95"
            >
              <X className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Yapamadı</span>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(true)}
              className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Yaptı</span>
            </button>
          </div>
        </>
      )}

      {phase === 'result' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 max-w-xl w-full">
            <Trophy
              size={72}
              className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce' : 'text-slate-500 mb-5'}
            />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">
              Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10
            </p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold">
                Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold">
                Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              onClick={() => onComplete(score >= 8)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HoldTile({
  item,
  done,
  disabled,
  onHold,
  isExpected,
}: {
  item: SceneItem;
  done: boolean;
  disabled: boolean;
  onHold: () => void;
  isExpected: boolean;
}) {
  const [p, setP] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const clear = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setP(0);
  };
  const tick = () => {
    const v = Math.min(1, (Date.now() - start.current) / 850);
    setP(v);
    if (v >= 1) {
      onHold();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      disabled={disabled || done}
      className="relative overflow-hidden active:scale-95"
      onPointerDown={(e) => {
        if (done) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = Date.now();
        tick();
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      <TileShell done={done}>
        <div className="absolute bottom-0 left-0 right-0 bg-rose-500/40" style={{ height: p * 100 + '%' }} />
        <span className="relative z-10">
          <ItemVisual item={item} />
        </span>
      </TileShell>
    </button>
  );
}

function SwipeTile({
  item,
  done,
  disabled,
  onSwipe,
  isExpected,
}: {
  item: SceneItem;
  done: boolean;
  disabled: boolean;
  onSwipe: () => void;
  isExpected: boolean;
}) {
  const sx = useRef(0);
  const [dx, setDx] = useState(0);
  const active = useRef(false);

  const reset = () => {
    active.current = false;
    setDx(0);
  };

  return (
    <div
      className="touch-none select-none"
      style={{ transform: 'translateX(' + Math.max(-140, Math.min(140, dx)) + 'px)' }}
      onPointerDown={(e) => {
        if (disabled || done) return;
        e.preventDefault();
        e.stopPropagation();
        active.current = true;
        sx.current = e.clientX;
        setDx(0);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!active.current || disabled || done) return;
        e.preventDefault();
        setDx(e.clientX - sx.current);
      }}
      onPointerUp={(e) => {
        if (!active.current) return;
        const dist = e.clientX - sx.current;
        if (Math.abs(dist) > 55) {
          onSwipe();
        }
        reset();
      }}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <TileShell done={done}>
        <ItemVisual item={item} />
      </TileShell>
    </div>
  );
}
