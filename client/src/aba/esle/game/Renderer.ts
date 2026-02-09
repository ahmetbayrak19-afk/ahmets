// Renderer.ts
import { AssetLibrary } from "./Assets";
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from "./Physics";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;

  private columns: { x: number; w: number; alpha: number }[] = [];
  private surfaceOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    // ✅ ÖNEMLİ: alpha TRUE -> 3D arkayı gösterebilir
    const ctx = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | null;
    if (!ctx) throw new Error("2D context alınamadı");
    this.ctx = ctx;

    this.tempCanvas = document.createElement("canvas");
    const tctx = this.tempCanvas.getContext("2d");
    if (!tctx) throw new Error("temp 2D context alınamadı");
    this.tempCtx = tctx;

    // Sütunlar
    let currentX = -2000;
    while (currentX < WORLD_WIDTH + 2000) {
      const w = 40 + Math.random() * 80;
      const alpha = 0.03 + Math.random() * 0.12;
      this.columns.push({ x: currentX, w, alpha });
      currentX += w;
    }
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;

    this.tempCanvas.width = w;
    this.tempCanvas.height = h;
  }

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, targets: any[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.surfaceOffset += 1.0;

    // ✅ 1) ŞEFFAF TEMİZLEME (arka plan BOYAMA YOK!)
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // --- KATMAN: ZEMİNLER (kum vs)
    const tileW = 600;
    const tileOrder = [0, 0, 1, 0, 1];
    tileOrder.forEach((type, index) => {
      const img = assets.zeminler?.[type];
      if (img) ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
    });

    // --- KATMAN: SU YÜZEYİ (varsa)
    if (assets.su) {
      const diff = camera.y - SEA_LEVEL;
      let lidHeight = 0;
      let drawY = SEA_LEVEL;

      if (diff >= 0) {
        lidHeight = Math.min(800, diff * 1.1);
        drawY = SEA_LEVEL - lidHeight * 0.98;
      } else {
        lidHeight = Math.min(150, Math.abs(diff) * 0.4);
        drawY = SEA_LEVEL - lidHeight * 0.5;
      }

      lidHeight = Math.max(2, lidHeight);

      this.tempCtx.clearRect(0, 0, w, h);
      this.tempCtx.save();
      this.tempCtx.translate(-camera.x + w / 2, -camera.y + h / 2);

      const imgW = 592;
      const shift = this.surfaceOffset % imgW;
      const count = Math.ceil(WORLD_WIDTH / imgW) + 2;

      for (let i = 0; i < count; i++) {
        const drawX = i * imgW - shift;
        if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
          this.tempCtx.drawImage(assets.su, drawX, drawY, imgW, lidHeight);
        }
      }

      this.tempCtx.globalCompositeOperation = "destination-in";
      const fadeGradient = this.tempCtx.createLinearGradient(0, drawY, 0, drawY + lidHeight);
      fadeGradient.addColorStop(0, "rgba(0,0,0,0.1)");
      fadeGradient.addColorStop(0.4, "rgba(0,0,0,0.7)");
      fadeGradient.addColorStop(1, "rgba(0,0,0,1.0)");
      this.tempCtx.fillStyle = fadeGradient;
      this.tempCtx.fillRect(camera.x - w, drawY, w * 3, lidHeight);

      this.tempCtx.restore();
      this.tempCtx.globalCompositeOperation = "source-over";

      ctx.drawImage(this.tempCanvas, camera.x - w / 2, camera.y - h / 2);
    }

    // --- BALIK
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    let img = assets.swim?.[0];
    if (fish.state === "TURN_LEFT") img = assets.turnLeft?.[fish.frame % assets.turnLeft.length];
    else if (fish.state === "EAT") img = assets.eat?.[fish.frame % assets.eat.length];
    else img = assets.swim?.[fish.frame % assets.swim.length];

    if (img) {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      ctx.drawImage(img, -80, -60, 160, 120);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // --- OTLAR
    const grassMap = ["ot1", null, "ot2", "ot1", null] as const;
    grassMap.forEach((grassType, index) => {
      if (!grassType) return;
      const grassImg = grassType === "ot1" ? assets.otlar?.ot1 : assets.otlar?.ot2;
      if (grassImg) ctx.drawImage(grassImg, index * tileW, WORLD_HEIGHT - 300, 600, 300);
    });

    ctx.restore();
  }
}
