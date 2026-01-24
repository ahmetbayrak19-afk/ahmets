import { useEffect, useRef } from "react";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

// Y eksenleri
const SEA_TOP_Y = 80;        // deniz yüzeyi
const SAND_TOP_Y = 520;      // kumun başladığı yer
const SAND_HEIGHT = 120;

// Balık
const FISH_RADIUS = 14;
const GRAVITY = 0.35;
const SWIM_FORCE = -6;

export default function EslemeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Balık state (ref ile – performans için)
  const fish = useRef({
    x: CANVAS_WIDTH / 2,
    y: 200,
    vy: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      /* ===============================
         UZAY (ARKAPLAN – GÖRÜNMEYECEK)
         =============================== */
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      /* ===============================
         DENİZ (GRADYAN)
         =============================== */
      const seaGradient = ctx.createLinearGradient(
        0,
        SEA_TOP_Y,
        0,
        SAND_TOP_Y
      );
      seaGradient.addColorStop(0, "#0b4f6c"); // üst
      seaGradient.addColorStop(1, "#021a26"); // alt

      ctx.fillStyle = seaGradient;
      ctx.fillRect(
        0,
        SEA_TOP_Y,
        CANVAS_WIDTH,
        SAND_TOP_Y - SEA_TOP_Y
      );

      /* ===============================
         DENİZ YÜZEYİ ÇİZGİSİ
         =============================== */
      ctx.strokeStyle = "#7fd7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, SEA_TOP_Y);
      ctx.lineTo(CANVAS_WIDTH, SEA_TOP_Y);
      ctx.stroke();

      /* ===============================
         KUM (EN ALT – SINIR)
         =============================== */
      ctx.fillStyle = "#c2a15f";
      ctx.fillRect(
        0,
        SAND_TOP_Y,
        CANVAS_WIDTH,
        SAND_HEIGHT
      );

      /* ===============================
         BALIK FİZİK
         =============================== */
      fish.current.vy += GRAVITY;
      fish.current.y += fish.current.vy;

      // ÜST SINIR (deniz yüzeyi)
      if (fish.current.y - FISH_RADIUS < SEA_TOP_Y) {
        fish.current.y = SEA_TOP_Y + FISH_RADIUS;
        fish.current.vy = 0;
      }

      // ALT SINIR (kum)
      if (fish.current.y + FISH_RADIUS > SAND_TOP_Y) {
        fish.current.y = SAND_TOP_Y - FISH_RADIUS;
        fish.current.vy = 0;
      }

      /* ===============================
         BALIK ÇİZİM (GEÇİCİ)
         =============================== */
      ctx.fillStyle = "#ff9933";
      ctx.beginPath();
      ctx.arc(
        fish.current.x,
        fish.current.y,
        FISH_RADIUS,
        0,
        Math.PI * 2
      );
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const swimUp = () => {
      fish.current.vy = SWIM_FORCE;
    };

    window.addEventListener("mousedown", swimUp);
    window.addEventListener("touchstart", swimUp);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousedown", swimUp);
      window.removeEventListener("touchstart", swimUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: "block",
        margin: "0 auto",
        background: "black",
      }}
    />
  );
}
