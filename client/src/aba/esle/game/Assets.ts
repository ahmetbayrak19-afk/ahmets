// Assets.ts
// Resimlerin hepsi bu dosya ile AYNI klasörde olsun (veya yolunu ./balik/d1.png gibi düzelt)

// YÜZME (D)
import d1 from './d1.png'; import d2 from './d2.png'; import d3 from './d3.png';
import d4 from './d4.png'; import d5 from './d5.png'; import d6 from './d6.png';
import d7 from './d7.png'; import d8 from './d8.png';

// DÖNÜŞ (L - Left) - Sola Dönüş Animasyonu
import l1 from './l1.png'; import l2 from './l2.png'; import l3 from './l3.png';
import l4 from './l4.png'; import l5 from './l5.png'; import l6 from './l6.png';
import l7 from './l7.png';

// YEME (Y)
import y1 from './y1.png'; import y2 from './y2.png'; import y3 from './y3.png';
import y4 from './y4.png'; // Eğer y4 varsa ekle, yoksa listeden çıkar

// ÇEVRE
import geceImg from './gece.png';
import anazemin from './anazemin.png'; 
import zemin from './zemin.png';

// LİSTELER
const SWIM_SRCS = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const TURN_LEFT_SRCS = [l1, l2, l3, l4, l5, l6, l7]; // Dönüş animasyonu
const EAT_SRCS = [y1, y2, y3, y4, y3, y2, y1]; 

export type AssetLibrary = {
    swim: HTMLImageElement[];
    turnLeft: HTMLImageElement[];
    eat: HTMLImageElement[];
    gece: HTMLImageElement | null;
    zeminler: HTMLImageElement[]; // [anazemin, zemin]
};

export const loadAssets = async (): Promise<AssetLibrary> => {
    const loadImage = (src: string, name: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`UYARI: ${name} bulunamadı (${src}).`);
            resolve(new Image()); 
        };
    });

    try {
        const [swim, turnLeft, eat, gece, anazeminImg, zeminImg] = await Promise.all([
            Promise.all(SWIM_SRCS.map((s, i) => loadImage(s, `swim_${i}`))),
            Promise.all(TURN_LEFT_SRCS.map((s, i) => loadImage(s, `turn_${i}`))),
            Promise.all(EAT_SRCS.map((s, i) => loadImage(s, `eat_${i}`))),
            loadImage(geceImg, 'gece'),
            loadImage(anazemin, 'anazemin'),
            loadImage(zemin, 'zemin')
        ]);

        return { swim, turnLeft, eat, gece, zeminler: [anazeminImg, zeminImg] };
    } catch (e) {
        console.error("Asset Hatası:", e);
        throw e;
    }
};
