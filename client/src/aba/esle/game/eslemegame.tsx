import { useEffect, useRef, useState } from "react";

const SCREEN_W = window.innerWidth;
const SCREEN_H = window.innerHeight;

// DENİZ SINIRLARI (mantıksal – çizim tüm ekran)
const SEA_TOP = 0;
const SEA_BOTTOM = SCREEN_H;

// KUM
const SAND_HEIGHT = 80;

type Dot = {
  x: number;
  y: number;
  r: number;
  color: string;
};

export default function EslemeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fishY, setFishY] = useState(SCREEN_H / 2);
  const fishVy = useRef(0);

  const dots = useRef<Dot[]>([]);

  // TOP ÜRET
  useEffect(() => {
    const colors = ["green", "yellow", "red"];

    const interval = setInterval(() => {
      dots.current.push({
        x: SCREEN_W + 30,
        y: Math.random() * (SCREEN_H - SAND_HEIGHT - 40),
        r: 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // OYUN LOOP
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;

    const loop = () => {
      // 🌊 DENİZ – TÜM EKRAN (UZAY YOK)
      const seaGrad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
      seaGrad.addColorStop(0, "#1e88e5"); // yüzey açık
      seaGrad.addColorStop(0.5, "#0d47a1");
      seaGrad.addColorStop(1, "#041a2d"); // dip koyu

      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // 🟨 KUM – EN ALT
      ctx.fillStyle = "#c2a46d";
      ctx.fillRect(
        0,
        SCREEN_H - SAND_HEIGHT,
        SCREEN_W,
        SAND_HEIGHT + 20 // biraz taşabilir, sorun değil
      );

      // 🐟 BALIK
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(120, fishY, 20, 0, Math.PI * 2);
      ctx.fill();

      // BALIK FİZİK
      fishVy.current += 0.5;
      let newY = fishY + fishVy.current;

      // ÜST SINIR (deniz yüzeyi)
      if (newY < 20) {
        newY = 20;
        fishVy.current = 0;
      }

      // ALT SINIR (kum)
      const FISH_BOTTOM_LIMIT =
        SCREEN_H - SAND_HEIGHT - 20;
      if (newY > FISH_BOTTOM_LIMIT) {
        newY = FISH_BOTTOM_LIMIT;
        fishVy.current = 0;
      }

      setFishY(newY);

      // ⚪ TOPLAR
      dots.current.forEach((d) => {
        d.x -= 3;

        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      dots.current = dots.current.filter((d) => d.x > -50);

      requestAnimationFrame(loop);
    };

    loop();
  }, [fishY]);

  // TIKLA → ZIPLA
  const jump = () => {
    fishVy.current = -8;
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={jump}
      style={{ display: "block" }}
    />
  );
      }
