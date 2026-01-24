// game/Assets.ts

// Resim importları (Yollarını kendi projene göre ayarla)
import d1 from '../d1.png'; import d2 from '../d2.png'; import d3 from '../d3.png';
import d4 from '../d4.png'; import d5 from '../d5.png'; import d6 from '../d6.png';
import d7 from '../d7.png'; import d8 from '../d8.png'; 
import balikye1 from '../balikye1.png'; import balikye2 from '../balikye2.png';
import balikye3 from '../balikye3.png'; import balikye4 from '../balikye4.png';
import suDokuImg from '../su_doku.png'; 
import geceImg from '../gece.png';
import altzemin1 from '../altzemin1.png'; import altzemin2 from '../altzemin2.png';
import ustzemin1 from '../ustzemin1.png'; import ustzemin2 from '../ustzemin2.png';
import ustzemin3 from '../ustzemin3.png';

const SWIM_SRCS = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const EAT_SRCS = [balikye1, balikye2, balikye3, balikye4];

export type AssetLibrary = {
    swim: HTMLImageElement[];
    eat: HTMLImageElement[];
    su: HTMLImageElement | null;
    gece: HTMLImageElement | null;
    zeminler: HTMLImageElement[];
    ustler: HTMLImageElement[];
};

export const loadAssets = async (): Promise<AssetLibrary> => {
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Asset yüklenemedi: ${src}. Yerine boş kutu çizilecek.`);
            // Hata olsa bile "boş" bir resim objesi dön ki oyun patlamasın
            resolve(new Image()); 
        };
    });

    // Paralel yükleme
    const [swim, eat, su, gece, zeminler, ustler] = await Promise.all([
        Promise.all(SWIM_SRCS.map(s => loadImage(s))),
        Promise.all(EAT_SRCS.map(s => loadImage(s))),
        loadImage(suDokuImg),
        loadImage(geceImg),
        Promise.all([loadImage(altzemin1), loadImage(altzemin2)]),
        Promise.all([loadImage(ustzemin1), loadImage(ustzemin2), loadImage(ustzemin3)])
    ]);

    return { swim, eat, su, gece, zeminler, ustler };
};
