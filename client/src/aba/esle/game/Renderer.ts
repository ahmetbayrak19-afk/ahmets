import { AssetLibrary } from "./Assets";
import { FishState } from "./Physics";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    // ✅ ŞEFFAF CANVAS: 3D arkası görünsün
    this.ctx = canvas.getContext("2d", { alpha: true })!;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;

    // gerçek piksel boyutu
    this.ctx.canvas.width = Math.max(1, Math.floor(w));
    this.ctx.canvas.height = Math.max(1, Math.floor(h));
  }

  draw(
    assets: AssetLibrary,
    fish: FishState,
    camera: { x: number; y: number },
    targets: any[]
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // ✅ Arkaplanı SİL: hiçbir fillRect yok
    ctx.clearRect(0, 0, w, h);

    // Dünya -> ekran dönüşümü
    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // --- TARGETLAR (varsa) ---
    // (istersen sonra ekleriz; şimdilik boş geçiyorum)

    // --- BALIK ---
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    let img = assets.swim?.[0];
    if (fish.state === "TURN_LEFT") img = assets.turnLeft[fish.frame % assets.turnLeft.length];
    else if (fish.state === "EAT") img = assets.eat[fish.frame % assets.eat.length];
    else img = assets.swim[fish.frame % assets.swim.length];

    if (img) {
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 14;
      ctx.drawImage(img, -80, -60, 160, 120);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.restore();
  }
    }
