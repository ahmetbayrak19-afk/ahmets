// client/src/aba/esle/game/Renderer.ts
import { AssetLibrary } from "./Assets";
import { FishState } from "./Physics";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    // ✅ transparan: 3D arkada görünsün
    this.ctx = canvas.getContext("2d", { alpha: true })!;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, Math.floor(w));
    this.height = Math.max(1, Math.floor(h));
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;
  }

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // --- BALIK ---
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    let img: HTMLImageElement | undefined;

    // assets arrays yoksa patlamasın
    const swim = (assets as any)?.swim as HTMLImageElement[] | undefined;
    const turnLeft = (assets as any)?.turnLeft as HTMLImageElement[] | undefined;
    const eat = (assets as any)?.eat as HTMLImageElement[] | undefined;

    if (fish.state === "TURN_LEFT" && turnLeft?.length) img = turnLeft[fish.frame % turnLeft.length];
    else if (fish.state === "EAT" && eat?.length) img = eat[fish.frame % eat.length];
    else if (swim?.length) img = swim[fish.frame % swim.length];

    if (img) {
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 18;
      ctx.drawImage(img, -80, -60, 160, 120);
      ctx.shadowBlur = 0;
    } else {
      // ✅ sprite yoksa bile balık görünür: turuncu daire
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,165,0,0.9)";
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }
                  }
