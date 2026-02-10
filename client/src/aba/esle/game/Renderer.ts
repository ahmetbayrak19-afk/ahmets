import { AssetLibrary } from "./Assets";
import { FishState } from "./Physics";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    // ✅ alpha:true -> 3D arkası görünsün
    this.ctx = canvas.getContext("2d", { alpha: true })!;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
  }

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, targets: any[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // ✅ Arka plan BOYAMA YOK. Sadece temizle.
    ctx.clearRect(0, 0, w, h);

    // Dünya -> ekran dönüşümü
    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // (İstersen targets çizimi burada kalır — şimdilik dokunmuyorum)
    // targets.forEach(...)

    // Balık
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    let img = assets.swim[0];
    if (fish.state === "TURN_LEFT") img = assets.turnLeft[fish.frame % assets.turnLeft.length];
    else if (fish.state === "EAT") img = assets.eat[fish.frame % assets.eat.length];
    else img = assets.swim[fish.frame % assets.swim.length];

    if (img) {
      ctx.drawImage(img, -80, -60, 160, 120);
    }

    ctx.restore();
    ctx.restore();
  }
       }
