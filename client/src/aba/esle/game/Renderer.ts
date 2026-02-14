// client/src/aba/esle/game/Renderer.ts
import { AssetLibrary } from "./Assets";
import { FishState } from "./Physics";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    // Transparan, böylece arkadaki 3D dünya görünür
    this.ctx = canvas.getContext("2d", { alpha: true })!;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, Math.floor(w));
    this.height = Math.max(1, Math.floor(h));
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;
  }

  // 2D çizim fonksiyonu (Artık balığı çizmiyor, sadece temizliyor)
  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Ekranı temizle (3D arkada gözüksün)
    ctx.clearRect(0, 0, w, h);

    // 🔥 BURADAKİ 2D BALIK ÇİZİM KODLARINI SİLDİK 🔥
    // Artık balık 3D dünyada (Fish3D.tsx) çiziliyor.
    
    // İleride buraya CAN, PUAN veya BALONCUK çizimi ekleyebilirsin.
    // Şimdilik boş bırakıyoruz.
  }
}
