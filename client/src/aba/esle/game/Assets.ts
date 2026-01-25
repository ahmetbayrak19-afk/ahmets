// Assets.ts

// 1. BALIK RESİMLERİ (balik klasörünün içinde)
import d1 from './balik/d1.png'; import d2 from './balik/d2.png'; import d3 from './balik/d3.png';
import d4 from './balik/d4.png'; import d5 from './balik/d5.png'; import d6 from './balik/d6.png';
import d7 from './balik/d7.png'; import d8 from './balik/d8.png';

// Dönüş Animasyonu
import l1 from './balik/l1.png'; import l2 from './balik/l2.png'; import l3 from './balik/l3.png';
import l4 from './balik/l4.png'; import l5 from './balik/l5.png'; import l6 from './balik/l6.png';
import l7 from './balik/l7.png';

// Yeme Animasyonu
import y1 from './balik/y1.png'; import y2 from './balik/y2.png'; import y3 from './balik/y3.png';
import y4 from './balik/y4.png'; 

// 2. ÇEVRE RESİMLERİ
import gok1Img from './gok1.png'; // Sol Gökyüzü
import gok2Img from './gok2.png'; // Sağ Gökyüzü (Yeni Eklendi)
import anazemin from './anazemin.png'; 
import zemin from './zemin.png';
// su_doku şimdilik kaldırıldı ama import hatası vermesin diye dursun, kullanmayacağız.
import suDokuImg from './su_doku.png'; 

// LİSTELER
const SWIM_SRCS = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const TURN_LEFT_SRCS = [l1, l2, l3, l4, l5, l6, l7];
const EAT_SRCS = [y1, y2, y3, y4, y3, y2, y1]; 

export type AssetLibrary = {
    swim: HTMLImageElement[];
    turnLeft: HTMLImageElement[];
    eat: HTMLImageElement[];
    gok1: HTMLImageElement | null;
    gok2: HTMLImageElement | null;
    zeminler: HTMLImageElement[];
    su: HTMLImageElement | null;
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
        const [swim, turnLeft, eat, gok1, gok2, anazeminImg, zeminImg, suImg] = await Promise.all([
            Promise.all(SWIM_SRCS.map((s, i) => loadImage(s, `swim_${i}`))),
            Promise.all(TURN_LEFT_SRCS.map((s, i) => loadImage(s, `turn_${i}`))),
            Promise.all(EAT_SRCS.map((s, i) => loadImage(s, `eat_${i}`))),
            loadImage(gok1Img, 'gok1'),
            loadImage(gok2Img, 'gok2'), // gok2 yükleniyor
            loadImage(anazemin, 'anazemin'),
            loadImage(zemin, 'zemin'),
            loadImage(suDokuImg, 'su_doku')
        ]);

        return { 
            swim, turnLeft, eat, 
            gok1, gok2, // Ayrı ayrı döndürüyoruz
            zeminler: [anazeminImg, zeminImg],
            su: suImg
        };
    } catch (e) {
        console.error("Asset Hatası:", e);
        throw e;
    }
};
