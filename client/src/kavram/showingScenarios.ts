export type ShowingPosition = 'left' | 'center' | 'right';

export type ShowingScenario = {
  id: string;
  targetName: string;
  promptText: string;
  src: string;
  audioSrc: string;
  correctPosition: ShowingPosition;
  zoneCount: 2 | 3;
  aspectRatio: number;
};

type ShowingVariant = Pick<ShowingScenario, 'src' | 'correctPosition' | 'zoneCount' | 'aspectRatio'>;

type ShowingTarget = {
  targetName: string;
  promptText: string;
  audioSrc: string;
  variants: ShowingVariant[];
};

const mediaModules = import.meta.glob('./*goster/*.{mp4,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const audioModules = import.meta.glob('./kavramses/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const media = (folder: string, fileName: string) => {
  const path = `./${folder}/${fileName}`;
  const src = mediaModules[path];
  if (!src) throw new Error(`Kavram gösterme görseli bulunamadı: ${path}`);
  return src;
};

const audio = (fileName: string) => {
  const path = `./kavramses/${fileName}`;
  const src = audioModules[path];
  if (!src) throw new Error(`Kavram yönerge sesi bulunamadı: ${path}`);
  return src;
};

const variant = (
  folder: string,
  fileName: string,
  correctPosition: ShowingPosition,
  aspectRatio = 16 / 9,
  zoneCount: 2 | 3 = 3,
): ShowingVariant => ({
  src: media(folder, fileName),
  correctPosition,
  zoneCount,
  aspectRatio,
});

const target = (
  targetName: string,
  promptText: string,
  audioFile: string,
  variants: ShowingVariant[],
): ShowingTarget => ({
  targetName,
  promptText,
  audioSrc: audio(audioFile),
  variants,
});

const vehicle1 = 'araba-helikopter-kamyon.mp4';
const vehicle2 = 'bisiklet-tren-motosiklet.mp4';
const vehicle3 = 'helikopter-gemi-ucak.mp4';
const vehicle4 = 'kepce-araba-otobus.mp4';

const fruit1 = 'cilek-ananas-karpuz.mp4';
const fruit2 = 'elma-muz-portakal.mp4';
const fruit3 = 'kiraz-portakal-nar.mp4';
const fruit4 = 'uzum-armut-muz.mp4';

const vegetable1 = 'brokoli-salatalik-patates.mp4';
const vegetable2 = 'et-mantar-patlican.mp4';
const vegetable3 = 'kabak-havuc-domates.mp4';
const vegetable4 = 'sogan-misir-biber.mp4';

const clothes1 = 'atletcorapsapka.mp4';
const clothes2 = 'mont-etekkazak-tshirt.mp4';
const clothes3 = 'pantolon-gomleksapka-ayakkabi.mp4';
const clothes4 = 'terlik-pijama-eldivenkemer.mp4';

const color1 = 'mor-kirmizi-sari.mp4';
const color2 = 'turuncu-beyaz-mavi.mp4';
const color3 = 'yesil-siyah-sari.mp4';

const home1 = 'buzdolabi-ocak-supurge.webp';
const home2 = 'buzdolabi-tostmakina-bulasikmakina.webp';
const home3 = 'dolap-hali-kanepe.webp';
const home4 = 'sandalye-perde-televizyon.webp';
const home5 = 'utu-camasirmakina-masa.webp';

const emotion1 = 'sasirmismutluuzgun.mp4';
const emotion2 = 'sinirlikorkmus.mp4';

export const SHOWING_TARGETS: Record<string, ShowingTarget[]> = {
  vehicles: [
    target('Araba', 'Arabayı göster.', 'arabayigoster.mp3', [
      variant('tasitgoster', vehicle1, 'left'),
      variant('tasitgoster', vehicle4, 'center'),
    ]),
    target('Helikopter', 'Helikoptere dokun.', 'helikopteredokun.mp3', [
      variant('tasitgoster', vehicle1, 'center'),
      variant('tasitgoster', vehicle3, 'left'),
    ]),
    target('Kamyon', 'Kamyon hangisi?', 'kamyonhangisi.mp3', [variant('tasitgoster', vehicle1, 'right')]),
    target('Bisiklet', 'Bisikleti bul bakalım.', 'bisikletibul.mp3', [variant('tasitgoster', vehicle2, 'left')]),
    target('Tren', 'Treni göster.', 'trenigoster.mp3', [variant('tasitgoster', vehicle2, 'center')]),
    target('Motosiklet', 'Motosiklete dokun.', 'motosikletedokun.mp3', [variant('tasitgoster', vehicle2, 'right')]),
    target('Gemi', 'Gemi hangisi?', 'gemihangisi.mp3', [variant('tasitgoster', vehicle3, 'center')]),
    target('Uçak', 'Uçağı göster.', 'ucagigoster.mp3', [variant('tasitgoster', vehicle3, 'right')]),
    target('Kepçe', 'Kepçeyi bul.', 'kepceyibul.mp3', [variant('tasitgoster', vehicle4, 'left')]),
    target('Otobüs', 'Otobüse dokun.', 'otobusedokun.mp3', [variant('tasitgoster', vehicle4, 'right')]),
  ],
  fruits: [
    target('Çilek', 'Çileği göster.', 'cilegigoster.mp3', [variant('meyvegoster', fruit1, 'left')]),
    target('Ananas', 'Ananasa dokun.', 'ananasadokun.mp3', [variant('meyvegoster', fruit1, 'center')]),
    target('Karpuz', 'Karpuz hangisi?', 'karpuzhangisi.mp3', [variant('meyvegoster', fruit1, 'right')]),
    target('Elma', 'Elmayı bul bakalım.', 'elmayibul.mp3', [variant('meyvegoster', fruit2, 'left')]),
    target('Muz', 'Muzu göster.', 'muzugoster.mp3', [
      variant('meyvegoster', fruit2, 'center'),
      variant('meyvegoster', fruit4, 'right'),
    ]),
    target('Portakal', 'Portakala dokun.', 'portakaladokun.mp3', [
      variant('meyvegoster', fruit2, 'right'),
      variant('meyvegoster', fruit3, 'center'),
    ]),
    target('Kiraz', 'Kiraz hangisi?', 'kirazhangisi.mp3', [variant('meyvegoster', fruit3, 'left')]),
    target('Nar', 'Narı göster.', 'narigoster.mp3', [variant('meyvegoster', fruit3, 'right')]),
    target('Üzüm', 'Üzümü bul.', 'uzumubul.mp3', [variant('meyvegoster', fruit4, 'left')]),
    target('Armut', 'Armuda dokun.', 'armudadokun.mp3', [variant('meyvegoster', fruit4, 'center')]),
  ],
  vegetables: [
    target('Brokoli', 'Brokoliyi göster.', 'brokoliyigoster.mp3', [variant('sebzegoster', vegetable1, 'left', 736 / 400)]),
    target('Salatalık', 'Salatalığa dokun.', 'salataligadokun.mp3', [variant('sebzegoster', vegetable1, 'center', 736 / 400)]),
    target('Patates', 'Patates hangisi?', 'patateshangisi.mp3', [variant('sebzegoster', vegetable1, 'right', 736 / 400)]),
    target('Mantar', 'Mantarı göster.', 'mantargoster.mp3', [variant('sebzegoster', vegetable2, 'center', 736 / 400)]),
    target('Patlıcan', 'Patlıcanı göster.', 'patlicangoster.mp3', [variant('sebzegoster', vegetable2, 'right', 736 / 400)]),
    target('Kabak', 'Kabak hangisi?', 'kabakhangisi.mp3', [variant('sebzegoster', vegetable3, 'left', 736 / 400)]),
    target('Havuç', 'Havucu göster.', 'havucugoster.mp3', [variant('sebzegoster', vegetable3, 'center', 736 / 400)]),
    target('Domates', 'Domatesi bul.', 'domatesibul.mp3', [variant('sebzegoster', vegetable3, 'right', 736 / 400)]),
    target('Soğan', 'Soğana dokun.', 'soganadokun.mp3', [variant('sebzegoster', vegetable4, 'left', 736 / 400)]),
    target('Mısır', 'Mısır hangisi?', 'misirhangisi.mp3', [variant('sebzegoster', vegetable4, 'center', 736 / 400)]),
    target('Biber', 'Biberi göster.', 'biberigoster.mp3', [variant('sebzegoster', vegetable4, 'right', 736 / 400)]),
  ],
  clothes: [
    target('Atlet', 'Atlet giyeni göster.', 'atletgoster.mp3', [variant('kiyafetgoster', clothes1, 'left', 2058 / 1080)]),
    target('Çorap', 'Çorap giyene dokun.', 'corapdokun.mp3', [variant('kiyafetgoster', clothes1, 'center', 2058 / 1080)]),
    target('Şapka', 'Şapka takan hangisi?', 'sapkahangisi.mp3', [
      variant('kiyafetgoster', clothes1, 'right', 2058 / 1080),
      variant('kiyafetgoster', clothes3, 'center'),
    ]),
    target('Mont', 'Mont giyeni bul.', 'montbul.mp3', [variant('kiyafetgoster', clothes2, 'left')]),
    target('Etek', 'Etek giyene dokun.', 'etekdokun.mp3', [variant('kiyafetgoster', clothes2, 'center')]),
    target('Kazak', 'Kazak giyeni göster.', 'kazakgoster.mp3', [variant('kiyafetgoster', clothes2, 'center')]),
    target('Tişört', 'Tişört giyen hangisi?', 'tshirthangisi.mp3', [variant('kiyafetgoster', clothes2, 'right')]),
    target('Pantolon', 'Pantolon giyeni göster.', 'pantolongoster.mp3', [variant('kiyafetgoster', clothes3, 'left')]),
    target('Gömlek', 'Gömlek giyeni bul.', 'gomlekbul.mp3', [variant('kiyafetgoster', clothes3, 'center')]),
    target('Ayakkabı', 'Ayakkabı giyene dokun.', 'ayakkabidokun.mp3', [variant('kiyafetgoster', clothes3, 'right')]),
    target('Terlik', 'Terlik giyen hangisi?', 'terlikhangisi.mp3', [variant('kiyafetgoster', clothes4, 'left', 736 / 400)]),
    target('Pijama', 'Pijama giyeni göster.', 'pijamagoster.mp3', [variant('kiyafetgoster', clothes4, 'center', 736 / 400)]),
    target('Eldiven', 'Eldiven giyene dokun.', 'eldivendokun.mp3', [variant('kiyafetgoster', clothes4, 'right', 736 / 400)]),
    target('Kemer', 'Kemer takan hangisi?', 'kemerhangisi.mp3', [variant('kiyafetgoster', clothes4, 'right', 736 / 400)]),
  ],
  colors: [
    target('Mor', 'Moru göster.', 'morgoster.mp3', [variant('renkgoster', color1, 'left', 864 / 480)]),
    target('Kırmızı', 'Kırmızıyı göster.', 'kirmizigoster.mp3', [variant('renkgoster', color1, 'center', 864 / 480)]),
    target('Sarı', 'Sarı hangisi?', 'sarigoster.mp3', [
      variant('renkgoster', color1, 'right', 864 / 480),
      variant('renkgoster', color3, 'right', 736 / 400),
    ]),
    target('Turuncu', 'Turuncuyu göster.', 'turuncugoster.mp3', [variant('renkgoster', color2, 'left', 736 / 400)]),
    target('Beyaz', 'Beyazı göster.', 'beyazgoster.mp3', [variant('renkgoster', color2, 'center', 736 / 400)]),
    target('Mavi', 'Maviyi göster.', 'mavigoster.mp3', [variant('renkgoster', color2, 'right', 736 / 400)]),
    target('Yeşil', 'Yeşil hangisi?', 'yesilgoster.mp3', [variant('renkgoster', color3, 'left', 736 / 400)]),
    target('Siyah', 'Siyahı göster.', 'siyahgoster.mp3', [variant('renkgoster', color3, 'center', 736 / 400)]),
  ],
  home: [
    target('Buzdolabı', 'Buzdolabını göster.', 'buzdolabigoster.mp3', [
      variant('evesyagoster', home1, 'left', 1600 / 872),
      variant('evesyagoster', home2, 'left'),
    ]),
    target('Ocak', 'Ocağa dokun.', 'ocagadokun.mp3', [variant('evesyagoster', home1, 'center', 1600 / 872)]),
    target('Süpürge', 'Süpürge hangisi?', 'supurgehangisi.mp3', [variant('evesyagoster', home1, 'right', 1600 / 872)]),
    target('Tost makinesi', 'Tost makinesini bul.', 'tostmakinesibul.mp3', [variant('evesyagoster', home2, 'center')]),
    target('Bulaşık makinesi', 'Bulaşık makinesini göster.', 'bulasikmakinesigoster.mp3', [variant('evesyagoster', home2, 'right')]),
    target('Dolap', 'Dolaba dokun.', 'dolabadokun.mp3', [variant('evesyagoster', home3, 'left')]),
    target('Halı', 'Halı hangisi?', 'halihangisi.mp3', [variant('evesyagoster', home3, 'center')]),
    target('Kanepe', 'Kanepeyi göster.', 'kanepeyigoster.mp3', [variant('evesyagoster', home3, 'right')]),
    target('Sandalye', 'Sandalyeyi bul.', 'sandalyeyibul.mp3', [variant('evesyagoster', home4, 'left')]),
    target('Perde', 'Perdeye dokun.', 'perdeyedokun.mp3', [variant('evesyagoster', home4, 'center')]),
    target('Televizyon', 'Televizyon hangisi?', 'televizyonhangisi.mp3', [variant('evesyagoster', home4, 'right')]),
    target('Ütü', 'Ütüyü göster.', 'utuyugoster.mp3', [variant('evesyagoster', home5, 'left')]),
    target('Çamaşır makinesi', 'Çamaşır makinesine dokun.', 'camasirmakinesidokun.mp3', [variant('evesyagoster', home5, 'center')]),
    target('Masa', 'Masayı bul.', 'masayibul.mp3', [variant('evesyagoster', home5, 'right')]),
  ],
  emotions: [
    target('Şaşırmış', 'Şaşırmış olanı göster.', 'sasirmisgoster.mp3', [variant('duygugoster', emotion1, 'left')]),
    target('Mutlu', 'Mutlu olana dokun.', 'mutludokun.mp3', [variant('duygugoster', emotion1, 'center')]),
    target('Üzgün', 'Üzgün olan hangisi?', 'uzgunhangisi.mp3', [variant('duygugoster', emotion1, 'right')]),
    target('Sinirli', 'Sinirli olanı bul.', 'sinirlibul.mp3', [variant('duygugoster', emotion2, 'left', 16 / 9, 2)]),
    target('Korkmuş', 'Korkmuş olanı göster.', 'korkmusgoster.mp3', [variant('duygugoster', emotion2, 'right', 16 / 9, 2)]),
  ],
};

export const createShowingSession = (categoryId: string): ShowingScenario[] => {
  const targets = SHOWING_TARGETS[categoryId] ?? [];
  return targets
    .map((entry) => {
      const selectedVariant = entry.variants[Math.floor(Math.random() * entry.variants.length)];
      return {
        id: `${categoryId}-${entry.targetName}-${selectedVariant.src}`,
        targetName: entry.targetName,
        promptText: entry.promptText,
        audioSrc: entry.audioSrc,
        ...selectedVariant,
      };
    })
    .sort(() => Math.random() - 0.5);
};

export const getShowingTargetNames = (categoryId: string) =>
  (SHOWING_TARGETS[categoryId] ?? []).map((entry) => entry.targetName);
