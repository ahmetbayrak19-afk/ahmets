import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER (Senin dosya yolların) ---
import d1 from './d1.png'; import d2 from './d2.png'; import d3 from './d3.png';
import d4 from './d4.png'; import d5 from './d5.png'; import d6 from './d6.png';
import d7 from './d7.png'; import d8 from './d8.png'; 
import balikye1 from './balikye1.png'; import balikye2 from './balikye2.png';
import balikye3 from './balikye3.png'; import balikye4 from './balikye4.png';

import suDokuImg from './su_doku.png'; 
import geceImg from './gece.png';
import altzemin1 from './altzemin1.png'; import altzemin2 from './altzemin2.png';
import ustzemin1 from './ustzemin1.png'; import ustzemin2 from './ustzemin2.png';
import ustzemin3 from './ustzemin3.png';

const SWIM_SRCS = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const EAT_SRCS = [balikye1, balikye2, balikye3, balikye4];

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- AYARLAR ---
  const CHUNK_COUNT = 10; 
  const CHUNK_WIDTH = 2000; 
  const WORLD_WIDTH = CHUNK_COUNT * CHUNK_WIDTH; 
  const WORLD_HEIGHT = 2000; 
  const SEA_LEVEL = 500;     
  const ZEMIN_YUKSEKLIK = 350;

  // --- HTML5 CANVAS REFERANSI ---
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- STATE'LER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false); // Resimler yüklendi mi?

  // --- OYUN VERİLERİ (REACT STATE DEĞİL, REF KULLANIYORUZ - HIZ İÇİN) ---
  const assets = useRef<any>({}); // Yüklenen resimler burada duracak
  const fish = useRef({ x: WORLD_WIDTH / 2, y: 800, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1, frame: 0, timer: 0, isEating: false });
  const camera = useRef({ x: WORLD_WIDTH / 2, y: 0 });
  const targets = useRef<{id: number, x: number, y: number, color: string}[]>([]);
  const chunks = useRef<any[]>([]);
  const mousePos = useRef({ x: WORLD_WIDTH / 2, y: 800 });
  const requestRef = useRef<number>();
  const waterOffset = useRef(0); // Su akış animasyonu için

  // --- RESİMLERİ ÖNDEN YÜKLEME (PRELOAD) ---
  // Canvas'ta resim göstermek için önce tarayıcının o resmi hafızaya alması şarttır.
  useEffect(() => {
    const loadImages = async () => {
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });

      // Tüm görselleri yükle
      const loaded: any = {};
      loaded.swim = await Promise.all(SWIM_SRCS.map(src => loadImage(src)));
      loaded.eat = await Promise.all(EAT_SRCS.map(src => loadImage(src)));
      loaded.su = await loadImage(suDokuImg);
      loaded.gece = await loadImage(geceImg);
      loaded.zeminler = await Promise.all([loadImage(altzemin1), loadImage(altzemin2)]);
      loaded.ustler = await Promise.all([loadImage(ustzemin1), loadImage(ustzemin2), loadImage(ustzemin3)]);
      
      assets.current = loaded;

      // Zemin haritasını oluştur
      const newChunks = [];
      for (let i = 0; i < CHUNK_COUNT; i++) {
        newChunks.push({
            id: i, x: i * CHUNK_WIDTH, 
            base: Math.random() > 0.5 ? loaded.zeminler[0] : loaded.zeminler[1],
            overlay: Math.random() > 0.5 ? loaded.ustler[Math.floor(Math.random()*3)] : null
        });
      }
      chunks.current = newChunks;
      setIsLoaded(true);
    };
    loadImages();
  }, []);

  // --- INPUT HANDLER ---
  const handleInput = (e: any) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX; clientY = e.clientY;
    }

    // Canvas koordinatlarını dünya koordinatlarına çevir
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // Portrait/Landscape farkını burada çözüyoruz (CSS rotate ettiğimiz için mouse ters çalışır)
    const isPortrait = window.innerHeight > window.innerWidth;
    let worldMouseX, worldMouseY;

    if (isPortrait) {
        // Ekran döndüğü için X ve Y yer değiştirir
        const centerX = window.innerHeight / 2;
        const centerY = window.innerWidth / 2;
        const relX = screenY - centerX; // Dikkat: Y ekseni X oldu
        const relY = (window.innerWidth - screenX) - centerY; 
        worldMouseX = camera.current.x + relX;
        worldMouseY = camera.current.y + relY;
    } else {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        worldMouseX = camera.current.x + (screenX - centerX);
        worldMouseY = camera.current.y + (screenY - centerY);
    }
    
    mousePos.current = { x: worldMouseX, y: worldMouseY };
  };

  const startGame = () => {
    setIsPlaying(true); setScore(0);
    fish.current = { x: WORLD_WIDTH / 2, y: 800, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1, frame: 0, timer: 0, isEating: false };
    camera.current = { x: WORLD_WIDTH / 2, y: 800 }; 
    mousePos.current = { x: WORLD_WIDTH / 2, y: 800 };
    targets.current = [];
  };

  // --- OYUN DÖNGÜSÜ (GAME LOOP) ---
  useEffect(() => {
    if (!isPlaying || !isLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false }); // Alpha false performansı artırır
    if (!canvas || !ctx) return;

    const loop = () => {
      // 1. Ekran Boyutlarını Ayarla
      const isPortrait = window.innerHeight > window.innerWidth;
      // Canvas'ın render çözünürlüğü ekranla birebir olsun (Netlik için)
      if (canvas.width !== (isPortrait ? window.innerHeight : window.innerWidth)) {
          canvas.width = isPortrait ? window.innerHeight : window.innerWidth;
          canvas.height = isPortrait ? window.innerWidth : window.innerHeight;
      }
      const screenW = canvas.width;
      const screenH = canvas.height;

      // 2. Fizik Hesapları (Aynı mantık)
      const f = fish.current;
      const inWater = f.y > SEA_LEVEL;
      
      if (inWater) {
          const dx = mousePos.current.x - f.x; const dy = mousePos.current.y - f.y;
          f.vx += dx * 0.0008; f.vy += dy * 0.0008;
          f.vx *= 0.97; f.vy *= 0.97;
          const speed = Math.sqrt(f.vx**2 + f.vy**2);
          if (speed > 11) { const r = 11/speed; f.vx*=r; f.vy*=r; }
      } else {
          f.vy += 0.8; f.vx *= 0.99;
      }
      f.x += f.vx; f.y += f.vy;

      // Sınırlar
      if(f.x < 50) f.x = 50; if(f.x > WORLD_WIDTH-50) f.x = WORLD_WIDTH-50; if(f.y > WORLD_HEIGHT-50) f.y = WORLD_HEIGHT-50;

      // Kamera
      camera.current.x += (f.x - camera.current.x) * 0.15;
      camera.current.y += (f.y - camera.current.y) * 0.1;
      
      // Kamera Sınırları
      if (camera.current.y < screenH/2) camera.current.y = screenH/2;
      if (camera.current.y > WORLD_HEIGHT - screenH/2) camera.current.y = WORLD_HEIGHT - screenH/2;
      if (camera.current.x < 0) camera.current.x = 0; 
      if (camera.current.x > WORLD_WIDTH) camera.current.x = WORLD_WIDTH;

      // Animasyon Timer
      f.timer++;
      if (f.timer > 3) {
          f.frame++;
          f.timer = 0;
      }
      waterOffset.current += 1; // Su akış hızı

      // ---------------------------------------------
      // --- ÇİZİM (RENDERING) - SİHİR BURADA ---
      // ---------------------------------------------

      // A. ARKA PLAN (SABİT)
      // ctx.fillStyle ile gradient oluşturuyoruz. HTML'deki o kasma yok.
      const bgGrad = ctx.createRadialGradient(screenW/2, 0, 100, screenW/2, screenH/2, screenW);
      bgGrad.addColorStop(0, '#0d2b52'); // Merkez
      bgGrad.addColorStop(1, '#020a1a'); // Köşeler
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, screenW, screenH);

      // KAMERA TRANSFERİ (Tüm dünyayı kameraya göre kaydır)
      ctx.save();
      ctx.translate(-camera.current.x + screenW/2, -camera.current.y + screenH/2);

      // B. GÖKYÜZÜ
      if (assets.current.gece) {
          // Sonsuz döngü için basit mantık
          const pat = ctx.createPattern(assets.current.gece, 'repeat');
          if(pat) {
            ctx.fillStyle = pat;
            ctx.translate(0, -500); // Gökyüzü konumu
            ctx.fillRect(camera.current.x - screenW, 0, WORLD_WIDTH + screenW*2, SEA_LEVEL + 500); 
            ctx.translate(0, 500); // Geri al
          }
      }

      // C. SU YÜZEYİ (EN KRİTİK KISIM - PERFORMANCE OPTİMİZASYONU)
      const depth = Math.max(0, f.y - SEA_LEVEL);
      const lazyTilt = 100 - (70 * (depth / (depth + 600))); // Tembel Açı hesabı
      
      // Canvas'ta 3D Transform (Perspective) simülasyonu zordur ama scaleY ile hile yaparız.
      ctx.save();
      ctx.translate(camera.current.x, SEA_LEVEL); // Suyun başladığı yer
      ctx.scale(1, Math.cos(lazyTilt * Math.PI / 180)); // Açıyı "basıklık" olarak simüle et
      
      // Su Dokusu (Hayalet Mod + Maske)
      if (assets.current.su) {
        ctx.globalAlpha = 0.4; // %40 Opaklık
        ctx.globalCompositeOperation = 'overlay'; // Renk karışımı
        
        // Deseni kaydırarak akış efekti
        const patternOffset = waterOffset.current % 800;
        ctx.translate(-patternOffset, -300); // 300px yukarıdan başlat
        
        const pattern = ctx.createPattern(assets.current.su, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            // Çok geniş bir alana çiz ki kamera gidince bitmesin
            ctx.fillRect(camera.current.x - screenW - patternOffset, 0, WORLD_WIDTH + screenW*2, 600);
        }
      }
      ctx.restore(); // Transformu sıfırla

      // D. ZEMİNLER
      chunks.current.forEach(chunk => {
          // Sadece ekranda görünenleri çiz (Culling) - Performans artırır
          if (Math.abs(chunk.x - camera.current.x) < screenW + 1000) {
              if (chunk.base) ctx.drawImage(chunk.base, chunk.x, WORLD_HEIGHT - ZEMIN_YUKSEKLIK, 2000, 350);
              if (chunk.overlay) ctx.drawImage(chunk.overlay, chunk.x, WORLD_HEIGHT - ZEMIN_YUKSEKLIK, 2000, 350);
          }
      });

      // E. YEMLER
      targets.current.forEach(t => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
          ctx.fillStyle = t.color;
          ctx.shadowBlur = 15; ctx.shadowColor = t.color; // Işık efekti
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
      });

      // F. BALIK
      ctx.save();
      ctx.translate(f.x, f.y);
      
      // Derinlik efekti (Scale)
      const depthRatio = Math.max(0, (f.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
      const depthScale = 1 + (depthRatio * 0.6);
      
      // Yön ve Dönüş
      const faceDir = f.vx > 0.1 ? 1 : (f.vx < -0.1 ? -1 : (f.scaleX > 0 ? 1 : -1));
      let angle = Math.atan2(f.vy, Math.abs(f.vx));
      f.rotation += (angle * (180/Math.PI) * faceDir - f.rotation) * 0.1;
      
      ctx.rotate(f.rotation * Math.PI / 180);
      ctx.scale(faceDir * depthScale, depthScale);

      const frames = f.isEating ? assets.current.eat : assets.current.swim;
      const currentImg = frames[f.frame % frames.length];
      if (currentImg) {
          // Resmi ortala
          ctx.drawImage(currentImg, -80, -60, 160, 120);
      }
      ctx.restore();

      ctx.restore(); // Kamera translate'ini bitir

      // G. YEM MANTIĞI & SPAWN
      if (Math.random() < 0.04) {
         targets.current.push({ 
             id: Date.now(), 
             x: Math.random() * WORLD_WIDTH, 
             y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK) + SEA_LEVEL + 100, 
             color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)] 
         });
      }
      targets.current = targets.current.filter(t => {
          const dist = Math.hypot(f.x - t.x, f.y - t.y);
          if (dist < 80) {
              setScore(s => s + 10);
              confetti({ origin: { x: 0.5, y: 0.5 }, particleCount: 20, spread: 40 });
              f.isEating = true; f.frame = 0;
              setTimeout(() => f.isEating = false, 300);
              return false;
          }
          return true;
      });

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPlaying, isLoaded]); // Sadece oyun başlayınca ve resimler yüklenince çalış

  return (
    <div className="fixed inset-0 bg-black overflow-hidden touch-none select-none flex items-center justify-center">
        {/* CANVAS: HTML DOM'un HANTALLIĞI YOK, SAF PERFORMANS */}
        <canvas 
            ref={canvasRef}
            className="block"
            style={{
                width: isPortrait ? '100vh' : '100vw',
                height: isPortrait ? '100vw' : '100vh',
                transform: isPortrait ? 'rotate(90deg)' : 'none',
                // Mobilde yumuşatma ayarları
                touchAction: 'none'
            }}
            onMouseMove={handleInput}
            onTouchMove={handleInput}
            onClick={handleInput}
        />

        {/* UI KATMANI (Burası HTML kalabilir, performansı etkilemez) */}
        <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]">
            <span className="font-black text-2xl text-orange-600">SKOR: {score}</span>
        </div>
        
        <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition">
            <XCircle className="text-red-500 w-8 h-8" />
        </button>

        {/* LOADING EKRANI */}
        {!isLoaded && (
             <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
                 YÜKLENİYOR...
             </div>
        )}

        {/* BAŞLANGIÇ EKRANI */}
        {!isPlaying && isLoaded && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-[110]">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame} className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black text-4xl shadow-orange-500/50 shadow-2xl flex items-center gap-4 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all">
                    <Play size={40} fill="currentColor" /> BAŞLA
                </motion.button>
            </div>
        )}
    </div>
  );
  }
        
