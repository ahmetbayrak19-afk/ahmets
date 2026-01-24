import { useEffect, useRef, useState } from "react";

const SCREEN_W = window.innerWidth;
const SCREEN_H = window.innerHeight;

// DENİZ SINIRLARI
const SEA_TOP = SCREEN_H * 0.2;
const SEA_BOTTOM = SCREEN_H * 0.75;

// KUM (EN ALT TABAN)
const SAND_HEIGHT = 80;

type Dot = {
  x: number;
  y: number;
  r: number;
  color: string;
};

export default function EslemeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fishY, setFishY] = useState((SEA_TOP + SEA_BOTTOM) / 2);
  const fishVy = useRef(0);

  const dots = useRef<Dot[]>([]);

  // TOP ÜRETİMİ
  useEffect(() => {
    const colors = ["green", "yellow", "red"];

    const interval = setInterval(() => {
      dots.current.push({
        x: SCREEN_W + 30,
        y:
          SEA_TOP +
          Math.random() * (SEA_BOTTOM - SEA_TOP - SAND_HEIGHT),
        r: 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // ANA OYUN DÖNGÜSÜ
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;

    let animationId: number;

    const loop = () => {
      ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

      // 🌌 UZAY (ARKA PLAN)
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // 🌊 DENİZ
      const seaGrad = ctx.createLinearGradient(0, SEA_TOP, 0, SEA_BOTTOM);
      seaGrad.addColorStop(0, "#06354a");
      seaGrad.addColorStop(1, "#041f2d");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, SEA_TOP, SCREEN_W, SEA_BOTTOM - SEA_TOP);

      // 🟨 KUM (EN ALT SINIR)
      ctx.fillStyle = "#c2a46d";
      ctx.fillRect(
        0,
        SEA_BOTTOM - SAND_HEIGHT,
        SCREEN_W,
        SAND_HEIGHT
      );

      // 🐟 BALIK
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(120, fishY, 20, 0, Math.PI * 2);
      ctx.fill();

      // BALIK FİZİK
      fishVy.current += 0.5;
      let newY = fishY + fishVy.current;

      // ÜST SINIR (DENİZ DIŞI YOK)
      if (newY < SEA_TOP + 20) {
        newY = SEA_TOP + 20;
        fishVy.current = 0;
      }

      // ALT SINIR (KUM)
      const FISH_BOTTOM_LIMIT = SEA_BOTTOM - SAND_HEIGHT - 20;
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

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationId);
  }, [fishY]);

  // DOKUN / TIKLA
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
