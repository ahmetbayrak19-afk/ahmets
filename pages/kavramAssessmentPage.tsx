import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Save, Loader2, Check, X, PlayCircle, Volume2, 
  Briefcase, Smile, Carrot, Shirt, Car, Palette, Shapes, User, Apple, Scale,
  Maximize2, ThermometerSun, Unlock, Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

// --- KAVRAM OYUN SESLERİ ---
import bosSes from '@/kavram/bos.mp3';
import doluSes from '@/kavram/dolu.mp3';
import azSes from '@/kavram/az.mp3';
import cokSes from '@/kavram/cok.mp3';
import agirSes from '@/kavram/agir.mp3';
import hafifSes from '@/kavram/hafif.mp3';
import acikSes from '@/kavram/ek/acik.mp3';
import kapaliSes from '@/kavram/ek/kapali.mp3';
import uzunSes from '@/kavram/ek/uzun.mp3';
import kisaSes from '@/kavram/ek/kisa.mp3';
import buyukSes from '@/kavram/buyukkucuk/buyuk.mp3';
import kucukSes from '@/kavram/buyukkucuk/kucuk.mp3';
import sicakSes from '@/kavram/sicak.mp3';
import sogukSes from '@/kavram/soguk.mp3';

// --- KAVRAM OYUN VİDEOLARI/RESİMLERİ ---
import bosdolu1 from '@/kavram/bosdolu1.mp4';
import bosdolu2 from '@/kavram/bosdolu2.mp4';
import bosdolu3 from '@/kavram/bosdolu3.mp4';
import bosdolu4 from '@/kavram/bosdolu4.mp4';
import dolubos1 from '@/kavram/dolubos1.mp4';
import dolubos2 from '@/kavram/dolubos2.mp4';
import dolubos3 from '@/kavram/dolubos3.mp4';
import dolubos4 from '@/kavram/dolubos4.mp4';
import azcok1 from '@/kavram/azcok1.mp4';
import azcok2 from '@/kavram/azcok2.mp4';
import azcok3 from '@/kavram/azcok3.mp4';
import cokaz1 from '@/kavram/cokaz1.mp4';
import cokaz2 from '@/kavram/cokaz2.mp4';
import cokaz3 from '@/kavram/cokaz3.mp4';
import agirhafif1 from '@/kavram/agirhafif1.mp4';
import agirhafif2 from '@/kavram/agirhafif2.mp4';
import agirhafif3 from '@/kavram/agirhafif3.mp4';
import hafifagir1 from '@/kavram/hafifagir1.mp4';
import hafifagir2 from '@/kavram/hafifagir2.mp4';
import hafifagir3 from '@/kavram/hafifagir3.mp4';
import acikkapali1 from '@/kavram/ek/acikkapali1.jpeg';
import acikkapali2 from '@/kavram/ek/acikkapali2.jpeg';
import acikkapali3 from '@/kavram/ek/acikkapali3.jpeg';
import acikkapali4 from '@/kavram/ek/acikkapali4.jpeg';
import kapaliacik1 from '@/kavram/ek/kapaliacik1.jpeg';
import kapaliacik2 from '@/kavram/ek/kapaliacik2.jpeg';
import kapaliacik3 from '@/kavram/ek/kapaliacik3.jpeg';
import kapaliacik4 from '@/kavram/ek/kapaliacik4.jpeg';
import uzunkisa1 from '@/kavram/ek/uzunkisa1.jpeg';
import uzunkisa2 from '@/kavram/ek/uzunkisa2.jpeg';
import uzunkisa3 from '@/kavram/ek/uzunkisa3.jpeg';
import uzunkisa4 from '@/kavram/ek/uzunkisa4.jpeg';
import kisauzun1 from '@/kavram/ek/kisauzun1.jpeg';
import kisauzun2 from '@/kavram/ek/kisauzun2.jpeg';
import kisauzun3 from '@/kavram/ek/kisauzun3.jpeg';
import kisauzun4 from '@/kavram/ek/kisauzun4.jpeg';
import buyukkucuk1 from '@/kavram/buyukkucuk/buyukkucuk1.jpeg';
import buyukkucuk2 from '@/kavram/buyukkucuk/buyukkucuk2.jpeg';
import buyukkucuk3 from '@/kavram/buyukkucuk/buyukkucuk3.jpeg';
import buyukkucuk4 from '@/kavram/buyukkucuk/buyukkucuk4.jpeg';
import kucukbuyuk1 from '@/kavram/buyukkucuk/kucukbuyuk1.jpeg';
import kucukbuyuk2 from '@/kavram/buyukkucuk/kucukbuyuk2.jpeg';
import kucukbuyuk3 from '@/kavram/buyukkucuk/kucukbuyuk3.jpeg';
import kucukbuyuk4 from '@/kavram/buyukkucuk/kucukbuyuk4.jpeg';
import sicaksoguk1 from '@/kavram/sicaksoguk1.png';
import sicaksoguk2 from '@/kavram/sicaksoguk2.png';
import sicaksoguk3 from '@/kavram/sicaksoguk3.png';
import sicaksoguk4 from '@/kavram/sicaksoguk4.jpg';
import soguksicak1 from '@/kavram/soguksicak1.png';
import soguksicak2 from '@/kavram/soguksicak2.png';
import soguksicak3 from '@/kavram/soguksicak3.png';
import soguksicak4 from '@/kavram/soguksicak4.jpg';

// --- 1. HAYVANLAR ---
import aslanVid from '@/animals/aslan.mp4';
import atVid from '@/animals/at.mp4';
import ayiVid from '@/animals/ayi.mp4';
import kaplanVid from '@/animals/kaplan.mp4';
import filVid from '@/animals/fil.mp4';
import kediVid from '@/animals/kedi.mp4';
import kopekVid from '@/animals/kopek.mp4';
import penguenVid from '@/animals/penguen.mp4';
import yilanVid from '@/animals/yilan.mp4';
import tavukVid from '@/animals/tavuk.mp4';
import maymunVid from '@/animals/maymun.mp4';
// Hayvan MP3'leri (Flashcard için)
import aslanMp3 from '@/animals/aslan.mp3';
import atMp3 from '@/animals/at.mp3';
import ayiMp3 from '@/animals/ayi.mp3';
import kaplanMp3 from '@/animals/kaplan.mp3';
import filMp3 from '@/animals/fil.mp3';
import kediMp3 from '@/animals/kedi.mp3';
import kopekMp3 from '@/animals/kopek.mp3';
import penguenMp3 from '@/animals/penguen.mp3';
import yilanMp3 from '@/animals/yilan.mp3';
import tavukMp3 from '@/animals/tavuk.mp3';
import maymunMp3 from '@/animals/maymun.mp3';

// --- HAYVANLAR 3'LÜ GRUP VİDEOLARI ---
import aslanMaymunFilVid from '@/animals/aslanmaymunfil.mp4';
import atTavukKopekVid from '@/animals/attavukkopek.mp4';
import kaplanPenguenAyiVid from '@/animals/kaplanpenguenayi.mp4';
import yilanTavukKediVid from '@/animals/yilantavukkedi.mp4';

// --- HAYVAN SES YÖNERGELERİ (Ayırt Etme Oyunu İçin) ---
import aslanInstruction from '@/animals/aslanigoster.mp3';
import atInstruction from '@/animals/atigoster.mp3';
import ayiInstruction from '@/animals/ayiyigoster.mp3';
import filInstruction from '@/animals/filigoster.mp3';
import kaplanInstruction from '@/animals/kaplanigoster.mp3';
import kediInstruction from '@/animals/kediyigoster.mp3';
import kopekInstruction from '@/animals/kopekgoster.mp3';
import maymunInstruction from '@/animals/maymunugoster.mp3';
import penguenInstruction from '@/animals/penguengoster.mp3';
import tavukInstruction from '@/animals/tavukgoster.mp3';
import yilanInstruction from '@/animals/yilanigoster.mp3';

// --- 2. MESLEKLER ---
import asciVid from '@/jobs/asci.mp4';
import askerVid from '@/jobs/asker.mp4';
import astronotVid from '@/jobs/astronot.mp4';
import berberVid from '@/jobs/berber.mp4';
import ciftciVid from '@/jobs/ciftci.mp4';
import doktorVid from '@/jobs/doktor.mp4';
import itfaiyeVid from '@/jobs/itfaiye.mp4';
import ogretmenVid from '@/jobs/ogretmen.mp4';
import polisVid from '@/jobs/polis.mp4';
import terziVid from '@/jobs/terzi.mp4';
// Meslek MP3'leri
import asciMp3 from '@/jobs/asci.mp3';
import askerMp3 from '@/jobs/asker.mp3';
import astronotMp3 from '@/jobs/astronot.mp3';
import berberMp3 from '@/jobs/berber.mp3';
import ciftciMp3 from '@/jobs/ciftci.mp3';
import doktorMp3 from '@/jobs/doktor.mp3';
import itfaiyeMp3 from '@/jobs/itfaiye.mp3';
import ogretmenMp3 from '@/jobs/ogretmen.mp3';
import polisMp3 from '@/jobs/polis.mp3';
import terziMp3 from '@/jobs/terzi.mp3';

// --- 3. TAŞITLAR ---
import arabaVid from '@/vehicles/araba.mp4';
import bisikletVid from '@/vehicles/bisiklet.mp4';
import gemiVid from '@/vehicles/gemi.mp4';
import helikopterVid from '@/vehicles/helikopter.mp4';
import kamyonVid from '@/vehicles/kamyon.mp4';
import kepceVid from '@/vehicles/kepce.mp4';
import motosikletVid from '@/vehicles/motosiklet.mp4';
import otobusVid from '@/vehicles/otobus.mp4';
import trenVid from '@/vehicles/tren.mp4';
import ucakVid from '@/vehicles/ucak.mp4';
// Taşıt MP3'leri
import arabaMp3 from '@/vehicles/araba.mp3';
import bisikletMp3 from '@/vehicles/bisiklet.mp3';
import gemiMp3 from '@/vehicles/gemi.mp3';
import helikopterMp3 from '@/vehicles/helikopter.mp3';
import kamyonMp3 from '@/vehicles/kamyon.mp3';
import kepceMp3 from '@/vehicles/kepce.mp3';
import motosikletMp3 from '@/vehicles/motosiklet.mp3';
import otobusMp3 from '@/vehicles/otobus.mp3';
import trenMp3 from '@/vehicles/tren.mp3';
import ucakMp3 from '@/vehicles/ucak.mp3';

// --- 4. DUYGULAR ---
import sasirmisVid from '@/emotions/Sasirmis.mp4';
import korkmusVid from '@/emotions/korkmus.mp4';
import mutluVid from '@/emotions/mutlu.mp4';
import sinirliVid from '@/emotions/sinirli.mp4';
import uzgunVid from '@/emotions/uzgun.mp4';
// Duygu MP3'leri
import sasirmisMp3 from '@/emotions/Sasirmis.mp3';
import korkmusMp3 from '@/emotions/korkmus.mp3';
import mutluMp3 from '@/emotions/mutlu.mp3';
import sinirliMp3 from '@/emotions/sinirli.mp3';
import uzgunMp3 from '@/emotions/uzgun.mp3';

// --- 5. VÜCUDUMUZ (SESSİZ) ---
import agizVid from '@/limbs/agiz.mp4';
import ayakVid from '@/limbs/ayak.mp4';
import burunVid from '@/limbs/burun.mp4';
import dilVid from '@/limbs/dil.mp4';
import disVid from '@/limbs/dis.mp4';
import elVid from '@/limbs/el.mp4';
import gozVid from '@/limbs/goz.mp4';
import kolVid from '@/limbs/kol.mp4';
import kulakVid from '@/limbs/kulak.mp4';
import parmakVid from '@/limbs/parmak.mp4';
import sacVid from '@/limbs/sac.mp4';

// --- DİĞER GÖRSELLER (SESSİZ) ---
import ananasImg from '@/fruits/ananas.jpg';
import armutImg from '@/fruits/armut.jpg';
import cilekImg from '@/fruits/cilek.jpg';
import elmaImg from '@/fruits/elma.jpg';
import karpuzImg from '@/fruits/karpuz.jpg';
import kirazImg from '@/fruits/kiraz.jpg';
import muzImg from '@/fruits/muz.jpg';
import narImg from '@/fruits/nar.jpg';
import portakalImg from '@/fruits/portakal.jpg';
import uzumImg from '@/fruits/uzum.jpg';
import biberImg from '@/vegetables/biber.jpg';
import brokoliImg from '@/vegetables/brokoli.jpg';
import domatesImg from '@/vegetables/domates.jpg';
import havucImg from '@/vegetables/havuc.jpg';
import kabakImg from '@/vegetables/kabak.jpg';
import mantarImg from '@/vegetables/mantar.jpg';
import misirImg from '@/vegetables/misir.jpg';
import patatesImg from '@/vegetables/patates.jpg';
import patlicanImg from '@/vegetables/patlican.jpg';
import salatalikImg from '@/vegetables/salatalik.jpg';
import soganImg from '@/vegetables/sogan.jpg';
import atletImg from '@/clothes/atlet.jpg';
import ayakkabiImg from '@/clothes/ayakkabi.jpg';
import corapImg from '@/clothes/corap.jpg';
import etekImg from '@/clothes/etek.jpg';
import gomlekImg from '@/clothes/gomlek.jpg';
import kabanImg from '@/clothes/kaban.jpg';
import kazakImg from '@/clothes/kazak.jpg';
import pantolonImg from '@/clothes/pantolon.jpg';
import sapkaImg from '@/clothes/sapka.jpg';
import tshirtImg from '@/clothes/tshirt.jpg';
import beyazImg from '@/colours/beyaz.jpg';
import kirmiziImg from '@/colours/kirmizi.jpg';
import maviImg from '@/colours/mavi.jpg';
import morImg from '@/colours/mor.jpg';
import sariImg from '@/colours/sari.jpg';
import siyahImg from '@/colours/siyah.jpg';
import turuncuImg from '@/colours/turuncu.jpg';
import yesilImg from '@/colours/yesil.jpg';
import besgenImg from '@/shapes/besgen.jpg';
import daireImg from '@/shapes/daire.jpg';
import dikdortgenImg from '@/shapes/dikdortgen.jpg';
import kareImg from '@/shapes/kare.jpg';
import ucgenImg from '@/shapes/ucgen.jpg';

// --- VERİ LİSTELERİ ---
// Not: `audio` alanı olanlar sesli, olmayanlar sessiz çalışır.

const ANIMALS_WITH_VIDEO = [ 
  { name: "Aslan", src: aslanVid, audio: aslanMp3 }, 
  { name: "At", src: atVid, audio: atMp3 }, 
  { name: "Ayı", src: ayiVid, audio: ayiMp3 }, 
  { name: "Kaplan", src: kaplanVid, audio: kaplanMp3 }, 
  { name: "Fil", src: filVid, audio: filMp3 }, 
  { name: "Kedi", src: kediVid, audio: kediMp3 }, 
  { name: "Köpek", src: kopekVid, audio: kopekMp3 }, 
  { name: "Penguen", src: penguenVid, audio: penguenMp3 }, 
  { name: "Yılan", src: yilanVid, audio: yilanMp3 }, 
  { name: "Maymun", src: maymunVid, audio: maymunMp3 }, 
  { name: "Tavuk", src: tavukVid, audio: tavukMp3 } 
];

const JOBS_WITH_VIDEO = [ 
  { name: "Aşçı", src: asciVid, audio: asciMp3 }, 
  { name: "Asker", src: askerVid, audio: askerMp3 }, 
  { name: "Astronot", src: astronotVid, audio: astronotMp3 }, 
  { name: "Berber", src: berberVid, audio: berberMp3 }, 
  { name: "Çiftçi", src: ciftciVid, audio: ciftciMp3 }, 
  { name: "Doktor", src: doktorVid, audio: doktorMp3 }, 
  { name: "İtfaiyeci", src: itfaiyeVid, audio: itfaiyeMp3 }, 
  { name: "Öğretmen", src: ogretmenVid, audio: ogretmenMp3 }, 
  { name: "Polis", src: polisVid, audio: polisMp3 }, 
  { name: "Terzi", src: terziVid, audio: terziMp3 } 
];

const VEHICLES_WITH_VIDEO = [ 
  { name: "Araba", src: arabaVid, audio: arabaMp3 }, 
  { name: "Bisiklet", src: bisikletVid, audio: bisikletMp3 }, 
  { name: "Gemi", src: gemiVid, audio: gemiMp3 }, 
  { name: "Helikopter", src: helikopterVid, audio: helikopterMp3 }, 
  { name: "Kamyon", src: kamyonVid, audio: kamyonMp3 }, 
  { name: "Kepçe", src: kepceVid, audio: kepceMp3 }, 
  { name: "Motosiklet", src: motosikletVid, audio: motosikletMp3 }, 
  { name: "Otobüs", src: otobusVid, audio: otobusMp3 }, 
  { name: "Tren", src: trenVid, audio: trenMp3 }, 
  { name: "Uçak", src: ucakVid, audio: ucakMp3 } 
];

const EMOTIONS_WITH_VIDEO = [ 
  { name: "Mutlu", src: mutluVid, audio: mutluMp3 }, 
  { name: "Üzgün", src: uzgunVid, audio: uzgunMp3 }, 
  { name: "Sinirli", src: sinirliVid, audio: sinirliMp3 }, 
  { name: "Korkmuş", src: korkmusVid, audio: korkmusMp3 }, 
  { name: "Şaşırmış", src: sasirmisVid, audio: sasirmisMp3 } 
];

// SESSİZ KATEGORİ (MP3 YOK)
const LIMBS_WITH_VIDEO = [ 
  { name: "Ağız", src: agizVid }, 
  { name: "Ayak", src: ayakVid }, 
  { name: "Burun", src: burunVid }, 
  { name: "Dil", src: dilVid }, 
  { name: "Diş", src: disVid }, 
  { name: "El", src: elVid }, 
  { name: "Göz", src: gozVid }, 
  { name: "Kol", src: kolVid }, 
  { name: "Kulak", src: kulakVid }, 
  { name: "Parmak", src: parmakVid }, 
  { name: "Saç", src: sacVid } 
];

const FRUITS_WITH_IMAGE = [ { name: "Ananas", src: ananasImg }, { name: "Armut", src: armutImg }, { name: "Çilek", src: cilekImg }, { name: "Elma", src: elmaImg }, { name: "Karpuz", src: karpuzImg }, { name: "Kiraz", src: kirazImg }, { name: "Muz", src: muzImg }, { name: "Nar", src: narImg }, { name: "Portakal", src: portakalImg }, { name: "Üzüm", src: uzumImg } ];
const VEGETABLES_WITH_IMAGE = [ { name: "Biber", src: biberImg }, { name: "Brokoli", src: brokoliImg }, { name: "Domates", src: domatesImg }, { name: "Havuç", src: havucImg }, { name: "Kabak", src: kabakImg }, { name: "Mantar", src: mantarImg }, { name: "Mısır", src: misirImg }, { name: "Patates", src: patatesImg }, { name: "Patlıcan", src: patlicanImg }, { name: "Salatalık", src: salatalikImg }, { name: "Soğan", src: soganImg } ];
const CLOTHES_WITH_IMAGE = [ { name: "Atlet", src: atletImg }, { name: "Ayakkabı", src: ayakkabiImg }, { name: "Çorap", src: corapImg }, { name: "Etek", src: etekImg }, { name: "Gömlek", src: gomlekImg }, { name: "Kaban", src: kabanImg }, { name: "Kazak", src: kazakImg }, { name: "Pantolon", src: pantolonImg }, { name: "Şapka", src: sapkaImg }, { name: "Tişört", src: tshirtImg } ];
const COLOURS_WITH_IMAGE = [ { name: "Beyaz", src: beyazImg }, { name: "Kırmızı", src: kirmiziImg }, { name: "Mavi", src: maviImg }, { name: "Mor", src: morImg }, { name: "Sarı", src: sariImg }, { name: "Siyah", src: siyahImg }, { name: "Turuncu", src: turuncuImg }, { name: "Yeşil", src: yesilImg } ];
const SHAPES_WITH_IMAGE = [ { name: "Beşgen", src: besgenImg }, { name: "Daire", src: daireImg }, { name: "Dikdörtgen", src: dikdortgenImg }, { name: "Kare", src: kareImg }, { name: "Üçgen", src: ucgenImg } ];

// --- AYIRT ETME SENARYOLARI (MANUEL LİSTE) ---
const ANIMAL_DISCRIMINATION_SCENARIOS = [
  // VİDEO 1: ASLAN - MAYMUN - FİL
  { id: 'sec_aslan', targetName: 'Aslan', src: aslanMaymunFilVid, correctPosition: 'left', audioSrc: aslanInstruction },
  { id: 'sec_maymun', targetName: 'Maymun', src: aslanMaymunFilVid, correctPosition: 'center', audioSrc: maymunInstruction },
  { id: 'sec_fil', targetName: 'Fil', src: aslanMaymunFilVid, correctPosition: 'right', audioSrc: filInstruction },

  // VİDEO 2: AT - TAVUK - KÖPEK
  { id: 'sec_at', targetName: 'At', src: atTavukKopekVid, correctPosition: 'left', audioSrc: atInstruction },
  { id: 'sec_tavuk', targetName: 'Tavuk', src: atTavukKopekVid, correctPosition: 'center', audioSrc: tavukInstruction },
  { id: 'sec_kopek', targetName: 'Köpek', src: atTavukKopekVid, correctPosition: 'right', audioSrc: kopekInstruction },

  // VİDEO 3: KAPLAN - PENGUEN - AYI
  { id: 'sec_kaplan', targetName: 'Kaplan', src: kaplanPenguenAyiVid, correctPosition: 'left', audioSrc: kaplanInstruction },
  { id: 'sec_penguen', targetName: 'Penguen', src: kaplanPenguenAyiVid, correctPosition: 'center', audioSrc: penguenInstruction },
  { id: 'sec_ayi', targetName: 'Ayı', src: kaplanPenguenAyiVid, correctPosition: 'right', audioSrc: ayiInstruction },

  // VİDEO 4: YILAN - TAVUK - KEDİ
  { id: 'sec_yilan', targetName: 'Yılan', src: yilanTavukKediVid, correctPosition: 'left', audioSrc: yilanInstruction },
  { id: 'sec_kedi', targetName: 'Kedi', src: yilanTavukKediVid, correctPosition: 'right', audioSrc: kediInstruction }
];

const SCENARIO_POOLS: Record<string, any[]> = {
  'Boş-Dolu': [ { id: 'bd1', src: bosdolu1, fullSide: 'right' }, { id: 'bd2', src: bosdolu2, fullSide: 'right' }, { id: 'bd3', src: bosdolu3, fullSide: 'right' }, { id: 'bd4', src: bosdolu4, fullSide: 'right' }, { id: 'db1', src: dolubos1, fullSide: 'left' }, { id: 'db2', src: dolubos2, fullSide: 'left' }, { id: 'db3', src: dolubos3, fullSide: 'left' }, { id: 'db4', src: dolubos4, fullSide: 'left' } ],
  'Az-Çok': [ { id: 'ac1', src: azcok1, fullSide: 'right' }, { id: 'ac2', src: azcok2, fullSide: 'right' }, { id: 'ac3', src: azcok3, fullSide: 'right' }, { id: 'ca1', src: cokaz1, fullSide: 'left' }, { id: 'ca2', src: cokaz2, fullSide: 'left' }, { id: 'ca3', src: cokaz3, fullSide: 'left' } ],
  'Ağır-Hafif': [ { id: 'ah1', src: agirhafif1, fullSide: 'left' }, { id: 'ah2', src: agirhafif2, fullSide: 'left' }, { id: 'ah3', src: agirhafif3, fullSide: 'left' }, { id: 'ha1', src: hafifagir1, fullSide: 'right' }, { id: 'ha2', src: hafifagir2, fullSide: 'right' }, { id: 'ha3', src: hafifagir3, fullSide: 'right' } ],
  'Açık-Kapalı': [ { id: 'ak1', src: acikkapali1, fullSide: 'left' }, { id: 'ak2', src: acikkapali2, fullSide: 'left' }, { id: 'ak3', src: acikkapali3, fullSide: 'left' }, { id: 'ak4', src: acikkapali4, fullSide: 'left' }, { id: 'ka1', src: kapaliacik1, fullSide: 'right' }, { id: 'ka2', src: kapaliacik2, fullSide: 'right' }, { id: 'ka3', src: kapaliacik3, fullSide: 'right' }, { id: 'ka4', src: kapaliacik4, fullSide: 'right' } ],
  'Uzun-Kısa': [ { id: 'uk1', src: uzunkisa1, fullSide: 'left' }, { id: 'uk2', src: uzunkisa2, fullSide: 'left' }, { id: 'uk3', src: uzunkisa3, fullSide: 'left' }, { id: 'uk4', src: uzunkisa4, fullSide: 'left' }, { id: 'ku1', src: kisauzun1, fullSide: 'right' }, { id: 'ku2', src: kisauzun2, fullSide: 'right' }, { id: 'ku3', src: kisauzun3, fullSide: 'right' }, { id: 'ku4', src: kisauzun4, fullSide: 'right' } ],
  'Büyük-Küçük': [ { id: 'bk1', src: buyukkucuk1, fullSide: 'left' }, { id: 'bk2', src: buyukkucuk2, fullSide: 'left' }, { id: 'bk3', src: buyukkucuk3, fullSide: 'left' }, { id: 'bk4', src: buyukkucuk4, fullSide: 'left' }, { id: 'kb1', src: kucukbuyuk1, fullSide: 'right' }, { id: 'kb2', src: kucukbuyuk2, fullSide: 'right' }, { id: 'kb3', src: kucukbuyuk3, fullSide: 'right' }, { id: 'kb4', src: kucukbuyuk4, fullSide: 'right' } ],
  'Sıcak-Soğuk': [ { id: 'ss1', src: sicaksoguk1, fullSide: 'left' }, { id: 'ss2', src: sicaksoguk2, fullSide: 'left' }, { id: 'ss3', src: sicaksoguk3, fullSide: 'left' }, { id: 'ss4', src: sicaksoguk4, fullSide: 'left' }, { id: 'so1', src: soguksicak1, fullSide: 'right' }, { id: 'so2', src: soguksicak2, fullSide: 'right' }, { id: 'so3', src: soguksicak3, fullSide: 'right' }, { id: 'so4', src: soguksicak4, fullSide: 'right' } ]
};

// --- KATEGORİ YAPILANDIRMASI ---
const CATEGORY_MAP = [
  { id: 'animals', title: 'Hayvanlar', icon: <PlayCircle />, data: ANIMALS_WITH_VIDEO, type: 'video' },
  { id: 'jobs', title: 'Meslekler', icon: <Briefcase />, data: JOBS_WITH_VIDEO, type: 'video' },
  { id: 'vehicles', title: 'Taşıtlar', icon: <Car />, data: VEHICLES_WITH_VIDEO, type: 'video' },
  { id: 'limbs', title: 'Vücudumuz', icon: <User />, data: LIMBS_WITH_VIDEO, type: 'video' },
  { id: 'fruits', title: 'Meyveler', icon: <Apple />, data: FRUITS_WITH_IMAGE, type: 'image' },
  { id: 'vegetables', title: 'Sebzeler', icon: <Carrot />, data: VEGETABLES_WITH_IMAGE, type: 'image' },
  { id: 'clothes', title: 'Giysiler', icon: <Shirt />, data: CLOTHES_WITH_IMAGE, type: 'image' },
  { id: 'colors', title: 'Renkler', icon: <Palette />, data: COLOURS_WITH_IMAGE, type: 'image' },
  { id: 'shapes', title: 'Şekiller', icon: <Shapes />, data: SHAPES_WITH_IMAGE, type: 'image' },
  { id: 'emotions', title: 'Duygular', icon: <Smile />, data: EMOTIONS_WITH_VIDEO, type: 'video' },
  
  // OYUNLU OLANLAR
  { id: 'Boş-Dolu', title: 'Boş-Dolu', icon: <Scale />, isGame: true },
  { id: 'Az-Çok', title: 'Az-Çok', icon: <Scale />, isGame: true },
  { id: 'Ağır-Hafif', title: 'Ağır-Hafif', icon: <Scale />, isGame: true },
  { id: 'Açık-Kapalı', title: 'Açık-Kapalı', icon: <Unlock />, isGame: true },
  { id: 'Uzun-Kısa', title: 'Uzun-Kısa', icon: <Maximize2 />, isGame: true },
  { id: 'Büyük-Küçük', title: 'Büyük-Küçük', icon: <Layout />, isGame: true },
  { id: 'Sıcak-Soğuk', title: 'Sıcak-Soğuk', icon: <ThermometerSun />, isGame: true },
];

// DİZİYİ KARIŞTIRMA FONKSİYONU (Shuffle)
const shuffleArray = (array: any[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export default function KavramAssessmentPage() {
  const [match, params] = useRoute('/kavram-assessment/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();
  const { students } = useStudentData();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  // OYUN STATE'LERİ
  const [activeGame, setActiveGame] = useState<string | null>(null); 
  const [currentGameScenario, setCurrentGameScenario] = useState<any>(null);
  const [targetQuestion, setTargetQuestion] = useState<'full' | 'empty'>('full');
  const [questionCount, setQuestionCount] = useState(0); 
  const [correctCount, setCorrectCount] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);

  // FLASHCARD DEĞERLENDİRME STATE'LERİ
  const [activeEvaluation, setActiveEvaluation] = useState<any | null>(null);
  const [evalIndex, setEvalIndex] = useState(0);

  // AYIRT ETME MODU STATE'LERİ
  const [isDiscriminationMode, setIsDiscriminationMode] = useState(false);
  const [discrimIndex, setDiscrimIndex] = useState(0);
  const [shuffledScenarios, setShuffledScenarios] = useState<any[]>([]);

  // DOKUNMA EFEKTİ STATE'İ
  const [touchEffect, setTouchEffect] = useState<{x: number, y: number, id: number} | null>(null);

  // SES REFERANSLARI
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const flashcardAudioRef = useRef<HTMLAudioElement | null>(null);

  const student = students.find(s => s.id === studentId);

  // Dokunma Efekti Tetikleyici
  const handleTouchEffect = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setTouchEffect({ x: clientX, y: clientY, id: Date.now() });
    setTimeout(() => setTouchEffect(null), 600);
  };

  useEffect(() => {
    // Sesleri Yükle
    audioRefs.current = {
      dolu: new Audio(doluSes), bos: new Audio(bosSes), az: new Audio(azSes), cok: new Audio(cokSes),
      agir: new Audio(agirSes), hafif: new Audio(hafifSes), acik: new Audio(acikSes), kapali: new Audio(kapaliSes),
      uzun: new Audio(uzunSes), kisa: new Audio(kisaSes), sicak: new Audio(sicakSes), soguk: new Audio(sogukSes),
      buyuk: new Audio(buyukSes), kucuk: new Audio(kucukSes)
    };

    const loadData = async () => {
      if (!studentId) return;
      setLoading(true);
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      const docSnap = await getDoc(doc(db, "institutions", instId!, "students", studentId, "assessments", "kavram"));
      if (docSnap.exists()) setFormData(docSnap.data());
      setLoading(false);
    };
    loadData();
  }, [studentId]);

  // FLASHCARD MODUNDA SES MANTIĞI (VARSA ÇAL, YOKSA SESSİZ)
  useEffect(() => {
    if (activeEvaluation) {
        // Önceki sesi durdur
        if (flashcardAudioRef.current) {
             flashcardAudioRef.current.pause();
             flashcardAudioRef.current.currentTime = 0;
        }

        const item = activeEvaluation.data[evalIndex];
        
        // Eğer bu item'ın bir 'audio' özelliği varsa (Hayvan, Taşıt vb.) onu çal
        if (item.audio) {
            const audio = new Audio(item.audio); 
            flashcardAudioRef.current = audio;
            audio.play().catch(e => console.log("Flashcard ses hatası:", e));
        }
        // Eğer audio yoksa (Limbs, Fruits vb.) hiçbir şey yapma (Sessiz kal)
    }
  }, [evalIndex, activeEvaluation]);

  // AYIRT ETME MODU BAŞLADIĞINDA LİSTEYİ KARIŞTIR (SHUFFLE)
  useEffect(() => {
      if (isDiscriminationMode) {
          const mixed = shuffleArray([...ANIMAL_DISCRIMINATION_SCENARIOS]);
          setShuffledScenarios(mixed);
          setDiscrimIndex(0); 
      }
  }, [isDiscriminationMode]);

  // AYIRT ETME MODUNDA OTOMATİK SES ÇALMA
  useEffect(() => {
    if (isDiscriminationMode && shuffledScenarios.length > 0) {
      const scenario = shuffledScenarios[discrimIndex];
      if (scenario && scenario.audioSrc) {
        if (questionAudioRef.current) {
          questionAudioRef.current.pause();
          questionAudioRef.current.currentTime = 0;
        }
        const audio = new Audio(scenario.audioSrc);
        questionAudioRef.current = audio;
        setTimeout(() => audio.play().catch(e => console.log("Ses oynatma hatası:", e)), 500);
      }
    }
  }, [isDiscriminationMode, discrimIndex, shuffledScenarios]);

  // YÖNERGE TEKRARI (SES ÇALMA)
  const replayInstruction = () => {
      if (questionAudioRef.current) {
          questionAudioRef.current.currentTime = 0;
          questionAudioRef.current.play().catch(e => console.log("Tekrar çalma hatası:", e));
          toast.info("Ses tekrar çalınıyor...");
      }
  };

  const handleSave = async () => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    await setDoc(doc(db, "institutions", instId!, "students", studentId!, "assessments", "kavram"), formData);
    toast.success("Kavramlar kaydedildi!");
  };

  const playSound = (key: string) => {
    const audio = audioRefs.current[key];
    if (audio) { audio.currentTime = 0; audio.play().catch(e => console.error(e)); }
  };

  // --- 1. OYUN MOTORU ---
  const initGame = (concept: string) => {
    setQuestionCount(0); setCorrectCount(0); setActiveGame(concept); loadNextQuestion(0, concept);
  };

  const loadNextQuestion = (currentStep: number, gameType: string | null = activeGame) => {
    if (!gameType) return;
    const pool = SCENARIO_POOLS[gameType];
    const selectedScenario = pool[Math.floor(Math.random() * pool.length)];
    setCurrentGameScenario(selectedScenario);
    const isAskingFull = Math.random() > 0.5;
    setTargetQuestion(isAskingFull ? 'full' : 'empty');
    setQuestionCount(currentStep + 1);
    setIsTransitioning(false);

    setTimeout(() => {
        if (gameType === 'Boş-Dolu') isAskingFull ? playSound('dolu') : playSound('bos');
        else if (gameType === 'Az-Çok') isAskingFull ? playSound('cok') : playSound('az');
        else if (gameType === 'Ağır-Hafif') isAskingFull ? playSound('agir') : playSound('hafif');
        else if (gameType === 'Açık-Kapalı') isAskingFull ? playSound('acik') : playSound('kapali');
        else if (gameType === 'Uzun-Kısa') isAskingFull ? playSound('uzun') : playSound('kisa');
        else if (gameType === 'Büyük-Küçük') isAskingFull ? playSound('buyuk') : playSound('kucuk');
        else if (gameType === 'Sıcak-Soğuk') isAskingFull ? playSound('sicak') : playSound('soguk');
    }, 500);
  };

  const handleGameSelection = (clickedSide: 'left' | 'right', e: any) => {
    handleTouchEffect(e);
    if (!currentGameScenario || isTransitioning) return;
    setIsTransitioning(true);
    let correctSide = targetQuestion === 'full' ? currentGameScenario.fullSide : (currentGameScenario.fullSide === 'left' ? 'right' : 'left');
    let newCorrect = clickedSide === correctSide ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (questionCount >= 5) {
      setTimeout(() => {
        setFormData(p => ({ ...p, [activeGame!]: newCorrect === 5 }));
        setActiveGame(null);
      }, 500);
    } else {
      setTimeout(() => loadNextQuestion(questionCount), 1000);
    }
  };

  // --- 2. DEĞERLENDİRME MOTORU (FLASHCARD) ---
  const startEvaluation = (category: any) => {
    if (category.isGame) {
      initGame(category.id);
    } else {
      setActiveEvaluation(category);
      setEvalIndex(0);
    }
  };

  const handleEvalResponse = (status: boolean) => {
    const currentItem = activeEvaluation.data[evalIndex];
    setFormData(prev => ({ ...prev, [currentItem.name]: status }));
    
    if (evalIndex < activeEvaluation.data.length - 1) {
      setEvalIndex(prev => prev + 1);
    } else {
      if (activeEvaluation.id === 'animals') {
        toast.success("Harika! Şimdi karışık bulmaca zamanı 🎯");
        setIsDiscriminationMode(true);
      } else {
        toast.success(`${activeEvaluation.title} değerlendirmesi tamamlandı!`);
        setActiveEvaluation(null);
      }
    }
  };

  // --- 3. AYIRT ETME MOTORU ---
  const handleDiscriminationChoice = (selectedSide: 'left' | 'center' | 'right', e: any) => {
    handleTouchEffect(e);
    const currentScenario = shuffledScenarios[discrimIndex];
    const isCorrect = selectedSide === currentScenario.correctPosition;
    
    setFormData(prev => ({ ...prev, [`${currentScenario.targetName}_Ayirt_Etme`]: isCorrect }));

    if (isCorrect) {
      toast.success("Süpersin! Doğru bildin. 🎉");
    } else {
      toast.error("Tekrar dene bakalım.");
    }

    if (discrimIndex < shuffledScenarios.length - 1) {
      setTimeout(() => setDiscrimIndex(prev => prev + 1), 600); 
    } else {
      setTimeout(() => {
        toast.success("Tüm hayvan değerlendirmesi bitti!");
        setIsDiscriminationMode(false);
        setActiveEvaluation(null);
      }, 1000);
    }
  };

  // --- SCORE HESAPLAMA ---
  const calculateScore = (category: any) => {
    if (category.isGame) {
       const val = formData[category.id];
       if (val === true) return 100;
       if (val === false) return 0;
       return null; 
    }
    const items = category.data;
    if (!items || items.length === 0) return null;
    let correct = 0;
    let attempted = 0;
    items.forEach((item: any) => {
        const val = formData[item.name];
        if (val !== undefined && val !== null) {
            attempted++;
            if (val === true) correct++;
        }
    });
    if (attempted === 0) return null;
    return Math.round((correct / items.length) * 100);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-slate-800 border-slate-700 opacity-80 hover:opacity-100 hover:border-slate-500";
    if (score === 100) return "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20";
    if (score >= 80) return "bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20";
    if (score >= 50) return "bg-yellow-500/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20";
    return "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20";
  };
  
  const getProgressBarColor = (score: number | null) => {
    if (score === null) return "bg-slate-700";
    if (score === 100) return "bg-emerald-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // --- RENDER 1: OYUN MODU ---
  const renderGame = () => {
    if (!currentGameScenario) return null;
    const isVideo = currentGameScenario.src && currentGameScenario.src.endsWith('.mp4');
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
        <button onClick={() => setActiveGame(null)} className="absolute top-8 right-8 z-[110] bg-white/20 text-white p-3 rounded-full hover:bg-white/30 backdrop-blur-md"><X size={32} /></button>
        <div className="absolute top-4 left-4 z-[110] bg-black/50 px-4 py-2 rounded-full text-white font-bold text-sm border border-white/20">Soru: {questionCount} / 5</div>
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden animate-in fade-in zoom-in duration-300" key={questionCount}>
            {isVideo ? <video src={currentGameScenario.src} autoPlay loop muted playsInline className="h-full w-auto max-w-none object-contain pointer-events-none select-none" /> : <img src={currentGameScenario.src} className="h-full w-auto max-w-none object-contain pointer-events-none select-none" />}
            <div className="absolute inset-0 z-20 flex">
                <div onClick={(e) => handleGameSelection('left', e)} className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors"></div>
                <div onClick={(e) => handleGameSelection('right', e)} className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors"></div>
            </div>
        </div>
      </div>
    );
  };

  // --- RENDER 2: FLASHCARD MODU (POP-IN CSS EFEKTİ İLE) ---
  const renderEvaluationMode = () => {
    if (!activeEvaluation) return null;
    const item = activeEvaluation.data[evalIndex];
    const isVideo = activeEvaluation.type === 'video';
    const progress = Math.round(((evalIndex) / activeEvaluation.data.length) * 100);

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl flex items-center justify-between mb-4 z-50">
           <div className="flex items-center gap-3">
               <span className="text-white/70 text-sm font-medium">{activeEvaluation.title}</span>
               <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
               <span className="text-xs text-white/50">{evalIndex + 1} / {activeEvaluation.data.length}</span>
           </div>
           <button onClick={() => setActiveEvaluation(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={24} /></button>
        </div>

        {/* ANİMASYON BURADA: CSS CLASS 'animate-pop-in' KULLANILDI */}
        <div 
           className="relative flex-1 w-full max-w-4xl bg-black rounded-3xl overflow-hidden border border-white/10 mb-6 flex items-center justify-center animate-pop-in" 
           key={evalIndex}
        >
            {isVideo ? (
                // MUTED = TRUE (SES ARKA PLANDA playSound İLE ÇALIYOR)
                <video src={item.src} autoPlay loop playsInline muted={true} className="w-full h-full object-contain" />
            ) : (
                <img src={item.src} alt={item.name} className="w-full h-full object-contain" />
            )}
            <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 animate-in fade-in duration-700 delay-300">
                <h2 className="text-2xl font-bold text-white tracking-wide">{item.name}</h2>
            </div>
        </div>

        <div className="flex items-center gap-8 z-50">
            <button onClick={() => handleEvalResponse(false)} className="group flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center group-active:scale-95 transition-all hover:bg-red-500/30">
                    <X size={40} className="text-red-500" />
                </div>
                <span className="text-sm font-medium text-red-400">Bilmiyor</span>
            </button>
            <button onClick={() => handleEvalResponse(true)} className="group flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center group-active:scale-95 transition-all hover:bg-green-500/30">
                    <Check size={40} className="text-green-500" />
                </div>
                <span className="text-sm font-medium text-green-400">Biliyor</span>
            </button>
        </div>
      </div>
    );
  };

  // --- RENDER 3: AYIRT ETME MODU (POP-IN CSS EFEKTİ İLE) ---
  const renderDiscriminationGame = () => {
    if (!isDiscriminationMode || shuffledScenarios.length === 0) return null;
    const scenario = shuffledScenarios[discrimIndex];

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <button 
          onClick={() => { setIsDiscriminationMode(false); setActiveEvaluation(null); }} 
          className="absolute top-8 right-8 z-[120] bg-white/20 p-3 rounded-full text-white hover:bg-white/30"
        >
          <X size={32} />
        </button>

        <div 
           className="absolute top-8 left-8 z-[110] animate-in slide-in-from-top duration-500 cursor-pointer active:scale-95 transition-transform" 
           key={scenario.id + 'text'}
           onClick={replayInstruction}
        >
           <div className="bg-blue-600/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-xl flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                 <Volume2 size={24} />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                "{scenario.targetName}" hangisi?
              </span>
           </div>
        </div>

        {/* ANİMASYON BURADA: CSS CLASS 'animate-pop-in' KULLANILDI */}
        <div 
           className="relative w-full h-full flex items-center justify-center bg-black animate-pop-in" 
           key={scenario.id}
        >
           <video 
             src={scenario.src}
             autoPlay 
             loop 
             muted 
             playsInline
             className="h-full w-auto max-w-none object-contain pointer-events-none select-none"
           />
           
           <div className="absolute inset-0 flex z-50 w-full h-full">
              <div 
                onClick={(e) => handleDiscriminationChoice('left', e)} 
                className="flex-[2] h-full active:bg-white/5 transition-colors cursor-pointer border-r border-white/5"
              ></div>
              <div 
                onClick={(e) => handleDiscriminationChoice('center', e)} 
                className="flex-[1] h-full active:bg-white/5 transition-colors cursor-pointer border-r border-white/5"
              ></div>
              <div 
                onClick={(e) => handleDiscriminationChoice('right', e)} 
                className="flex-[2] h-full active:bg-white/5 transition-colors cursor-pointer"
              ></div>
           </div>
        </div>
      </div>
    );
  };

  const renderTouchEffect = () => {
      if (!touchEffect) return null;
      return (
          <div 
            key={touchEffect.id}
            className="fixed w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 pointer-events-none z-[200] animate-out fade-out zoom-out duration-500"
            style={{ 
                left: touchEffect.x - 40, 
                top: touchEffect.y - 40,
                boxShadow: '0 0 30px rgba(255,255,255,0.5)'
            }}
          />
      );
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 pb-20 font-sans">
      
      {/* --- ÖZEL ANİMASYON STİLİ (BURADA TANIMLANDI) --- */}
      <style>{`
        @keyframes popInFromBottomRight {
          0% { 
            transform: translate(20%, 20%) scale(0.8); 
            opacity: 0; 
          }
          100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1; 
          }
        }
        .animate-pop-in {
          animation: popInFromBottomRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {renderTouchEffect()}

      {/* AKTİF MODLAR */}
      {activeGame && renderGame()}
      {activeEvaluation && !isDiscriminationMode && renderEvaluationMode()}
      {isDiscriminationMode && renderDiscriminationGame()}

      {/* HEADER */}
      <header className="flex items-center justify-between mb-6 sticky top-0 bg-[#020617]/95 backdrop-blur z-20 py-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/assessment/${studentId}`)} className="text-slate-400 hover:bg-slate-800"><ArrowLeft /></Button>
          <div>
              <h1 className="text-lg font-bold">Kavram Değerlendirme</h1>
              <p className="text-xs text-slate-400">{student.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-green-600 h-9 px-4 text-xs shadow-lg shadow-green-900/20"><Save className="mr-2 h-4 w-4" /> Kaydet</Button>
      </header>

      {/* ANA GRID MENU */}
      <main className="max-w-4xl mx-auto">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div> : (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {CATEGORY_MAP.map((cat) => {
                 const score = calculateScore(cat);
                 const colorClass = getScoreColor(score);
                 const barColor = getProgressBarColor(score);

                 return (
                    <button 
                        key={cat.id} 
                        onClick={() => startEvaluation(cat)}
                        className={twMerge(
                            "relative group flex flex-col items-start p-4 rounded-xl border transition-all duration-300 overflow-hidden h-32",
                            colorClass
                        )}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                             <div className="scale-[2.5]">{cat.icon}</div>
                        </div>

                        <div className="relative z-10 w-full flex flex-col h-full justify-between">
                            <div className="flex items-start justify-between w-full">
                                <div className={twMerge("p-2 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10", score === 100 ? "text-emerald-400" : "text-white/70")}>
                                    {cat.icon}
                                </div>
                                {score !== null && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black tracking-tighter">{score}%</span>
                                    </div>
                                )}
                            </div>
                            <div className="w-full">
                                <h3 className="text-sm font-bold leading-tight mb-2">{cat.title}</h3>
                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${score || 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </button>
                 );
             })}
          </div>
        )}
      </main>
    </div>
  );
}
