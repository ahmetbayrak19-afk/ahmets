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
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { associateCurrentTeacherWithStudent } from '@/lib/studentTeacherAssociation';
import LogoLoader from '@/components/LogoLoader';
import {
  createShowingSession,
  getShowingTargetNames,
  type ShowingPosition,
  type ShowingScenario,
} from '@/kavram/showingScenarios';

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
import dokunmaOnaySes from '@/aba/yonerge/sesgorsel/onay.mp3';

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

// --- HAYVANLAR ---
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

import aslanMaymunFilVid from '@/animals/aslanmaymunfil.mp4';
import atTavukKopekVid from '@/animals/attavukkopek.mp4';
import kaplanPenguenAyiVid from '@/animals/kaplanpenguenayi.mp4';
import yilanTavukKediVid from '@/animals/yilantavukkedi.mp4';

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

// --- MESLEKLER ---
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

// --- TAŞITLAR ---
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

// --- DUYGULAR ---
import sasirmisVid from '@/emotions/Sasirmis.mp4';
import korkmusVid from '@/emotions/korkmus.mp4';
import mutluVid from '@/emotions/mutlu.mp4';
import sinirliVid from '@/emotions/sinirli.mp4';
import uzgunVid from '@/emotions/uzgun.mp4';
import sasirmisMp3 from '@/emotions/Sasirmis.mp3';
import korkmusMp3 from '@/emotions/korkmus.mp3';
import mutluMp3 from '@/emotions/mutlu.mp3';
import sinirliMp3 from '@/emotions/sinirli.mp3';
import uzgunMp3 from '@/emotions/uzgun.mp3';

// --- VÜCUDUMUZ ---
import ayakVid from '@/limbs/uzuvgosterme/ayakgoster.mp4';
import burunVid from '@/limbs/uzuvgosterme/burungoster.mp4';
import dilVid from '@/limbs/uzuvgosterme/dilgoster.mp4';
import disVid from '@/limbs/uzuvgosterme/disgoster.mp4';
import dudakVid from '@/limbs/uzuvgosterme/dudakgoster.mp4';
import elVid from '@/limbs/uzuvgosterme/elgoster.mp4';
import gozVid from '@/limbs/uzuvgosterme/gozgoster.mp4';
import kolVid from '@/limbs/uzuvgosterme/kolgoster.mp4';
import kulakVid from '@/limbs/uzuvgosterme/kulakgoster.mp4';
import parmakVid from '@/limbs/uzuvgosterme/parmakgoster.mp4';
import sacVid from '@/limbs/uzuvgosterme/sacgoster.mp4';
import ayakMp3 from '@/limbs/uzuvgosterme/ayakgoster.mp3';
import burunMp3 from '@/limbs/uzuvgosterme/burungoster.mp3';
import dilMp3 from '@/limbs/uzuvgosterme/dilgoster.mp3';
import disMp3 from '@/limbs/uzuvgosterme/disgoster.mp3';
import dudakMp3 from '@/limbs/uzuvgosterme/dudakgoster.mp3';
import elMp3 from '@/limbs/uzuvgosterme/elgoster.mp3';
import gozMp3 from '@/limbs/uzuvgosterme/gozgoster.mp3';
import kolMp3 from '@/limbs/uzuvgosterme/kolgoster.mp3';
import kulakMp3 from '@/limbs/uzuvgosterme/kulakgoster.mp3';
import parmakMp3 from '@/limbs/uzuvgosterme/parmakgoster.mp3';
import sacMp3 from '@/limbs/uzuvgosterme/sacgoster.mp3';

// --- DİĞER GÖRSELLER ---
import ananasImg from '@/fruits/ananas.webp';
import armutImg from '@/fruits/armut.webp';
import cilekImg from '@/fruits/cilek.webp';
import elmaImg from '@/fruits/elma.webp';
import karpuzImg from '@/fruits/karpuz.webp';
import kirazImg from '@/fruits/kiraz.webp';
import muzImg from '@/fruits/muz.webp';
import narImg from '@/fruits/nar.webp';
import portakalImg from '@/fruits/portakal.webp';
import uzumImg from '@/fruits/uzum.webp';
import erikImg from '@/fruits/erik.webp';
import kavunImg from '@/fruits/kavun.webp';
import kiviImg from '@/fruits/kivi.webp';
import limonImg from '@/fruits/limon.webp';
import seftaliImg from '@/fruits/seftali.webp';
import biberImg from '@/vegetables/biber.webp';
import brokoliImg from '@/vegetables/brokoli.webp';
import domatesImg from '@/vegetables/domates.webp';
import havucImg from '@/vegetables/havuc.webp';
import kabakImg from '@/vegetables/kabak.webp';
import mantarImg from '@/vegetables/mantar.webp';
import misirImg from '@/vegetables/misir.webp';
import patatesImg from '@/vegetables/patates.webp';
import patlicanImg from '@/vegetables/patlican.webp';
import salatalikImg from '@/vegetables/salatalik.webp';
import soganImg from '@/vegetables/sogan.webp';
import atletImg from '@/clothes/atlet.webp';
import ayakkabiImg from '@/clothes/ayakkabi.webp';
import corapImg from '@/clothes/corap.webp';
import etekImg from '@/clothes/etek.webp';
import gomlekImg from '@/clothes/gomlek.webp';
import kabanImg from '@/clothes/kaban.webp';
import kazakImg from '@/clothes/kazak.webp';
import pantolonImg from '@/clothes/pantolon.webp';
import sapkaImg from '@/clothes/sapka.webp';
import tshirtImg from '@/clothes/tshirt.webp';
import atkiImg from '@/clothes/atki.webp';
import eldivenImg from '@/clothes/eldiven.webp';
import kemerImg from '@/clothes/kemer.webp';
import pijamaImg from '@/clothes/pijama.webp';
import terlikImg from '@/clothes/terlik.webp';
import beyazImg from '@/colours/beyaz.jpg';
import kirmiziImg from '@/colours/kirmizi.jpg';
import maviImg from '@/colours/mavi.jpg';
import morImg from '@/colours/mor.jpg';
import sariImg from '@/colours/sari.jpg';
import siyahImg from '@/colours/siyah.jpg';
import turuncuImg from '@/colours/turuncu.jpg';
import yesilImg from '@/colours/yesil.jpg';

import cetvelImg from '@/okulmalzemeleri/cetvel.webp';
import derskitabiImg from '@/okulmalzemeleri/kitap.webp';
import kalemImg from '@/okulmalzemeleri/kalem.webp';
import kalemtrasImg from '@/okulmalzemeleri/kalemtras.webp';
import okulcantasiImg from '@/okulmalzemeleri/canta.webp';
import okuldefteriImg from '@/okulmalzemeleri/defter.webp';
import okulkiyafetiImg from '@/okulmalzemeleri/okulkiyafeti.webp';
import panoImg from '@/okulmalzemeleri/pano.webp';
import silgiImg from '@/okulmalzemeleri/silgi.webp';
import sinifsirasiImg from '@/okulmalzemeleri/sinifsirasi.webp';
import siniftahtasiImg from '@/okulmalzemeleri/siniftahtasi.webp';
import suluboyaImg from '@/okulmalzemeleri/suluboya.webp';
import sulukImg from '@/okulmalzemeleri/suluk.webp';

import bankaImg from '@/mekanlar/banka.webp';
import camiImg from '@/mekanlar/cami.webp';
import eczaneImg from '@/mekanlar/eczane.webp';
import evImg from '@/mekanlar/ev.webp';
import firinImg from '@/mekanlar/firin.webp';
import hastaneImg from '@/mekanlar/hastane.webp';
import havalimaniImg from '@/mekanlar/havalimani.webp';
import karakolImg from '@/mekanlar/karakol.webp';
import kasapImg from '@/mekanlar/kasap.webp';
import manavImg from '@/mekanlar/manav.webp';
import marketImg from '@/mekanlar/market.webp';
import okulImg from '@/mekanlar/okul.webp';
import otoparkImg from '@/mekanlar/otopark.webp';
import parkImg from '@/mekanlar/park.webp';

import ayranImg from '@/icecekler/ayran.webp';
import cayImg from '@/icecekler/cay.webp';
import kahvaImg from '@/icecekler/kahva.webp';
import kolaImg from '@/icecekler/kola.webp';
import limonataImg from '@/icecekler/limonata.webp';
import meyvesuyuImg from '@/icecekler/meyvesuyu.webp';
import sodaImg from '@/icecekler/soda.webp';
import suImg from '@/icecekler/su.webp';
import sutImg from '@/icecekler/sut.webp';
import tursusuyuImg from '@/icecekler/tursusuyu.webp';

import balImg from '@/temelgidalar/bal.webp';
import balikImg from '@/temelgidalar/balik.webp';
import corbaImg from '@/temelgidalar/corba.webp';
import ekmekImg from '@/temelgidalar/ekmek.webp';
import etImg from '@/temelgidalar/et.webp';
import kuruyemisImg from '@/temelgidalar/kuruyemis.webp';
import makarnaImg from '@/temelgidalar/makarna.webp';
import peynirImg from '@/temelgidalar/peynir.webp';
import pilavImg from '@/temelgidalar/pilav.webp';
import recelImg from '@/temelgidalar/recel.webp';
import tavukGidaImg from '@/temelgidalar/tavuk.webp';
import yagImg from '@/temelgidalar/yag.webp';
import yogurtImg from '@/temelgidalar/yogurt.webp';
import yumurtaImg from '@/temelgidalar/yumurta.webp';
import zeytinImg from '@/temelgidalar/zeytin.webp';

import buzdolabiImg from '@/evesyalari/buzdolabi.webp';
import camasirmakinesiImg from '@/evesyalari/camasirmakinesi.webp';
import dolapImg from '@/evesyalari/dolap.webp';
import firnImg from '@/evesyalari/fırn.webp';
import haliImg from '@/evesyalari/hali.webp';
import koltukImg from '@/evesyalari/koltuk.webp';
import masaImg from '@/evesyalari/masa.webp';
import perdeImg from '@/evesyalari/perde.webp';
import sandalyeImg from '@/evesyalari/sandalye.webp';
import supurgeImg from '@/evesyalari/supurge.webp';
import televizyonImg from '@/evesyalari/televizyon.webp';
import tostmakinesiImg from '@/evesyalari/tostmakinesi.webp';
import utuImg from '@/evesyalari/utu.webp';
import yatakImg from '@/evesyalari/yatak.webp';

import sayiBirImg from '@/aba/esle/bir.png';
import sayiIkiImg from '@/aba/esle/iki.png';
import sayiUcImg from '@/aba/esle/uc.png';
import sayiDortImg from '@/aba/esle/dort.png';
import sayiBesImg from '@/aba/esle/bes.png';
import sayiAltiImg from '@/aba/esle/alti.png';
import sayiYediImg from '@/aba/esle/yedi.png';
import sayiSekizImg from '@/aba/esle/sekiz.png';
import sayiDokuzImg from '@/aba/esle/dokuz.png';

import besgenImg from '@/shapes/besgen.jpg';
import daireImg from '@/shapes/daire.jpg';
import dikdortgenImg from '@/shapes/dikdortgen.jpg';
import kareImg from '@/shapes/kare.jpg';
import ucgenImg from '@/shapes/ucgen.jpg';

// --- VERİ LİSTELERİ ---
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

const LIMBS_WITH_VIDEO = [ 
  { name: "Ayak", src: ayakVid, audio: ayakMp3 },
  { name: "Burun", src: burunVid, audio: burunMp3 },
  { name: "Dil", src: dilVid, audio: dilMp3 },
  { name: "Diş", src: disVid, audio: disMp3 },
  { name: "Dudak", src: dudakVid, audio: dudakMp3 },
  { name: "El", src: elVid, audio: elMp3 },
  { name: "Göz", src: gozVid, audio: gozMp3 },
  { name: "Kol", src: kolVid, audio: kolMp3 },
  { name: "Kulak", src: kulakVid, audio: kulakMp3 },
  { name: "Parmak", src: parmakVid, audio: parmakMp3 },
  { name: "Saç", src: sacVid, audio: sacMp3 }
];

const FRUITS_WITH_IMAGE = [
  { name: "Ananas", src: ananasImg },
  { name: "Armut", src: armutImg },
  { name: "Çilek", src: cilekImg },
  { name: "Elma", src: elmaImg },
  { name: "Karpuz", src: karpuzImg },
  { name: "Kiraz", src: kirazImg },
  { name: "Muz", src: muzImg },
  { name: "Nar", src: narImg },
  { name: "Portakal", src: portakalImg },
  { name: "Üzüm", src: uzumImg },
  { name: "Erik", src: erikImg },
  { name: "Kavun", src: kavunImg },
  { name: "Kivi", src: kiviImg },
  { name: "Limon", src: limonImg },
  { name: "Şeftali", src: seftaliImg },
];
const VEGETABLES_WITH_IMAGE = [ { name: "Biber", src: biberImg }, { name: "Brokoli", src: brokoliImg }, { name: "Domates", src: domatesImg }, { name: "Havuç", src: havucImg }, { name: "Kabak", src: kabakImg }, { name: "Mantar", src: mantarImg }, { name: "Mısır", src: misirImg }, { name: "Patates", src: patatesImg }, { name: "Patlıcan", src: patlicanImg }, { name: "Salatalık", src: salatalikImg }, { name: "Soğan", src: soganImg } ];
const CLOTHES_WITH_IMAGE = [
  { name: "Atlet", src: atletImg },
  { name: "Ayakkabı", src: ayakkabiImg },
  { name: "Çorap", src: corapImg },
  { name: "Etek", src: etekImg },
  { name: "Gömlek", src: gomlekImg },
  { name: "Kaban", src: kabanImg },
  { name: "Kazak", src: kazakImg },
  { name: "Pantolon", src: pantolonImg },
  { name: "Şapka", src: sapkaImg },
  { name: "Tişört", src: tshirtImg },
  { name: "Atkı", src: atkiImg },
  { name: "Eldiven", src: eldivenImg },
  { name: "Kemer", src: kemerImg },
  { name: "Pijama", src: pijamaImg },
  { name: "Terlik", src: terlikImg },
];
const COLOURS_WITH_IMAGE = [ { name: "Beyaz", src: beyazImg }, { name: "Kırmızı", src: kirmiziImg }, { name: "Mavi", src: maviImg }, { name: "Mor", src: morImg }, { name: "Sarı", src: sariImg }, { name: "Siyah", src: siyahImg }, { name: "Turuncu", src: turuncuImg }, { name: "Yeşil", src: yesilImg } ];
const SCHOOL_WITH_IMAGE = [
  { name: "Cetvel", src: cetvelImg },
  { name: "Ders kitabı", src: derskitabiImg },
  { name: "Kalem", src: kalemImg },
  { name: "Kalemtıraş", src: kalemtrasImg },
  { name: "Okul çantası", src: okulcantasiImg },
  { name: "Okul defteri", src: okuldefteriImg },
  { name: "Okul kıyafeti", src: okulkiyafetiImg },
  { name: "Pano", src: panoImg },
  { name: "Silgi", src: silgiImg },
  { name: "Sınıf sırası", src: sinifsirasiImg },
  { name: "Sınıf tahtası", src: siniftahtasiImg },
  { name: "Sulu boya", src: suluboyaImg },
  { name: "Suluk", src: sulukImg },
];
const PLACES_WITH_IMAGE = [
  { name: "Banka", src: bankaImg },
  { name: "Cami", src: camiImg },
  { name: "Eczane", src: eczaneImg },
  { name: "Ev", src: evImg },
  { name: "Fırın", src: firinImg },
  { name: "Hastane", src: hastaneImg },
  { name: "Havalimanı", src: havalimaniImg },
  { name: "Karakol", src: karakolImg },
  { name: "Kasap", src: kasapImg },
  { name: "Manav", src: manavImg },
  { name: "Market", src: marketImg },
  { name: "Okul", src: okulImg },
  { name: "Otopark", src: otoparkImg },
  { name: "Park", src: parkImg },
];
const DRINKS_WITH_IMAGE = [
  { name: "Ayran", src: ayranImg },
  { name: "Çay", src: cayImg },
  { name: "Kahve", src: kahvaImg },
  { name: "Kola", src: kolaImg },
  { name: "Limonata", src: limonataImg },
  { name: "Meyve suyu", src: meyvesuyuImg },
  { name: "Soda", src: sodaImg },
  { name: "Su", src: suImg },
  { name: "Süt", src: sutImg },
  { name: "Turşu suyu", src: tursusuyuImg },
];
const FOODS_WITH_IMAGE = [
  { name: "Bal", src: balImg },
  { name: "Balık", src: balikImg },
  { name: "Çorba", src: corbaImg },
  { name: "Ekmek", src: ekmekImg },
  { name: "Et", src: etImg },
  { name: "Kuruyemiş", src: kuruyemisImg },
  { name: "Makarna", src: makarnaImg },
  { name: "Peynir", src: peynirImg },
  { name: "Pilav", src: pilavImg },
  { name: "Reçel", src: recelImg },
  { name: "Tavuk", src: tavukGidaImg },
  { name: "Yağ", src: yagImg },
  { name: "Yoğurt", src: yogurtImg },
  { name: "Yumurta", src: yumurtaImg },
  { name: "Zeytin", src: zeytinImg },
];
const HOME_WITH_IMAGE = [
  { name: "Buzdolabı", src: buzdolabiImg },
  { name: "Çamaşır makinesi", src: camasirmakinesiImg },
  { name: "Dolap", src: dolapImg },
  { name: "Fırın", src: firnImg },
  { name: "Halı", src: haliImg },
  { name: "Koltuk", src: koltukImg },
  { name: "Masa", src: masaImg },
  { name: "Perde", src: perdeImg },
  { name: "Sandalye", src: sandalyeImg },
  { name: "Süpürge", src: supurgeImg },
  { name: "Televizyon", src: televizyonImg },
  { name: "Tost makinesi", src: tostmakinesiImg },
  { name: "Ütü", src: utuImg },
  { name: "Yatak", src: yatakImg },
];
const NUMBERS_WITH_IMAGE = [
  { name: "Bir", src: sayiBirImg },
  { name: "İki", src: sayiIkiImg },
  { name: "Üç", src: sayiUcImg },
  { name: "Dört", src: sayiDortImg },
  { name: "Beş", src: sayiBesImg },
  { name: "Altı", src: sayiAltiImg },
  { name: "Yedi", src: sayiYediImg },
  { name: "Sekiz", src: sayiSekizImg },
  { name: "Dokuz", src: sayiDokuzImg },
];
const SHAPES_WITH_IMAGE = [ { name: "Beşgen", src: besgenImg }, { name: "Daire", src: daireImg }, { name: "Dikdörtgen", src: dikdortgenImg }, { name: "Kare", src: kareImg }, { name: "Üçgen", src: ucgenImg } ];

const ANIMAL_DISCRIMINATION_SCENARIOS = [
  { id: 'sec_aslan', targetName: 'Aslan', src: aslanMaymunFilVid, correctPosition: 'left', audioSrc: aslanInstruction },
  { id: 'sec_maymun', targetName: 'Maymun', src: aslanMaymunFilVid, correctPosition: 'center', audioSrc: maymunInstruction },
  { id: 'sec_fil', targetName: 'Fil', src: aslanMaymunFilVid, correctPosition: 'right', audioSrc: filInstruction },
  { id: 'sec_at', targetName: 'At', src: atTavukKopekVid, correctPosition: 'left', audioSrc: atInstruction },
  { id: 'sec_tavuk', targetName: 'Tavuk', src: atTavukKopekVid, correctPosition: 'center', audioSrc: tavukInstruction },
  { id: 'sec_kopek', targetName: 'Köpek', src: atTavukKopekVid, correctPosition: 'right', audioSrc: kopekInstruction },
  { id: 'sec_kaplan', targetName: 'Kaplan', src: kaplanPenguenAyiVid, correctPosition: 'left', audioSrc: kaplanInstruction },
  { id: 'sec_penguen', targetName: 'Penguen', src: kaplanPenguenAyiVid, correctPosition: 'center', audioSrc: penguenInstruction },
  { id: 'sec_ayi', targetName: 'Ayı', src: kaplanPenguenAyiVid, correctPosition: 'right', audioSrc: ayiInstruction },
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

const OPPOSITE_QUESTION_COUNT = 10;

const CATEGORY_MAP = [
  { id: 'animals', title: 'Hayvanlar', icon: <PlayCircle />, data: ANIMALS_WITH_VIDEO, type: 'video' },
  { id: 'jobs', title: 'Meslekler', icon: <Briefcase />, data: JOBS_WITH_VIDEO, type: 'video' },
  { id: 'vehicles', title: 'Taşıtlar', icon: <Car />, data: VEHICLES_WITH_VIDEO, type: 'video' },
  { id: 'limbs', title: 'Vücudumuz', icon: <User />, data: LIMBS_WITH_VIDEO, type: 'video' },
  { id: 'fruits', title: 'Meyveler', icon: <Apple />, data: FRUITS_WITH_IMAGE, type: 'image' },
  { id: 'vegetables', title: 'Sebzeler', icon: <Carrot />, data: VEGETABLES_WITH_IMAGE, type: 'image' },
  { id: 'clothes', title: 'Giysiler', icon: <Shirt />, data: CLOTHES_WITH_IMAGE, type: 'image' },
  { id: 'school', title: 'Sınıf ve Okul Eşyaları', icon: <Briefcase />, data: SCHOOL_WITH_IMAGE, type: 'image' },
  { id: 'places', title: 'Çevremizdeki Mekanlar', icon: <Car />, data: PLACES_WITH_IMAGE, type: 'image' },
  { id: 'drinks', title: 'İçecekler', icon: <Apple />, data: DRINKS_WITH_IMAGE, type: 'image' },
  { id: 'foods', title: 'Temel Gıdalar', icon: <Apple />, data: FOODS_WITH_IMAGE, type: 'image' },
  { id: 'home', title: 'Ev Eşyaları', icon: <Shirt />, data: HOME_WITH_IMAGE, type: 'image' },
  { id: 'numbers', title: 'Sayılar', icon: <Shapes />, data: NUMBERS_WITH_IMAGE, type: 'image' },
  { id: 'colors', title: 'Renkler', icon: <Palette />, data: COLOURS_WITH_IMAGE, type: 'image' },
  { id: 'shapes', title: 'Şekiller', icon: <Shapes />, data: SHAPES_WITH_IMAGE, type: 'image' },
  { id: 'emotions', title: 'Duygular', icon: <Smile />, data: EMOTIONS_WITH_VIDEO, type: 'video' },
  { id: 'Boş-Dolu', title: 'Boş-Dolu', icon: <Scale />, isGame: true },
  { id: 'Az-Çok', title: 'Az-Çok', icon: <Scale />, isGame: true },
  { id: 'Ağır-Hafif', title: 'Ağır-Hafif', icon: <Scale />, isGame: true },
  { id: 'Açık-Kapalı', title: 'Açık-Kapalı', icon: <Unlock />, isGame: true },
  { id: 'Uzun-Kısa', title: 'Uzun-Kısa', icon: <Maximize2 />, isGame: true },
  { id: 'Büyük-Küçük', title: 'Büyük-Küçük', icon: <Layout />, isGame: true },
  { id: 'Sıcak-Soğuk', title: 'Sıcak-Soğuk', icon: <ThermometerSun />, isGame: true },
];

/** Ana başlıklar ve alt kategoriler. contentId → CATEGORY_MAP.id; empty → henüz içerik yok */
const CATEGORY_GROUPS: {
  id: string;
  title: string;
  children: { title: string; contentId?: string; empty?: boolean; gameIds?: string[] }[];
}[] = [
  {
    id: 'nesneler',
    title: 'NESNELER (Eşyalarımız)',
    children: [
      { title: 'Sınıf ve Okul Eşyaları', contentId: 'school' },
      { title: 'Ev Eşyaları', contentId: 'home' },
      { title: 'Giysiler', contentId: 'clothes' },
    ],
  },
  {
    id: 'canlilar',
    title: 'CANLILAR VE ÇEVREMİZ',
    children: [
      { title: 'Vücudumuz', contentId: 'limbs' },
      { title: 'Hayvanlar', contentId: 'animals' },
      { title: 'Taşıtlar', contentId: 'vehicles' },
      { title: 'Meslekler', contentId: 'jobs' },
      { title: 'Çevremizdeki Mekanlar', contentId: 'places' },
    ],
  },
  {
    id: 'yiyecekler',
    title: 'YİYECEKLER VE İÇECEKLER',
    children: [
      { title: 'Meyveler', contentId: 'fruits' },
      { title: 'Sebzeler', contentId: 'vegetables' },
      { title: 'İçecekler', contentId: 'drinks' },
      { title: 'Temel Gıdalar', contentId: 'foods' },
    ],
  },
  {
    id: 'akademik',
    title: 'TEMEL AKADEMİK KAVRAMLAR',
    children: [
      { title: 'Renkler', contentId: 'colors' },
      { title: 'Şekiller', contentId: 'shapes' },
      { title: 'Sayılar', contentId: 'numbers' },
      { title: 'Zaman ve Doğa', empty: true },
    ],
  },
  {
    id: 'eylemler',
    title: 'EYLEMLER VE DURUM KAVRAMLARI',
    children: [
      {
        title: 'Zıt Kavramlar',
        gameIds: ['Boş-Dolu', 'Az-Çok', 'Ağır-Hafif', 'Açık-Kapalı', 'Uzun-Kısa', 'Büyük-Küçük', 'Sıcak-Soğuk'],
      },
      { title: 'Temel Konumlar', empty: true },
      { title: 'Eylemler (Hareketler)', empty: true },
      { title: 'Duygular', contentId: 'emotions' },
    ],
  },
];

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
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Oyun state'leri
  const [activeGame, setActiveGame] = useState<string | null>(null); 
  const [currentGameScenario, setCurrentGameScenario] = useState<any>(null);
  const [targetQuestion, setTargetQuestion] = useState<'full' | 'empty'>('full');
  const [questionCount, setQuestionCount] = useState(0); 
  const [correctCount, setCorrectCount] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [oppositeReady, setOppositeReady] = useState(false);
  const [oppositeReplay, setOppositeReplay] = useState(0);
  const oppositeLockedRef = useRef(true);
  const oppositeTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flashcard
  const [activeEvaluation, setActiveEvaluation] = useState<any | null>(null);
  const [evalIndex, setEvalIndex] = useState(0);

  // Ayırt etme
  const [isDiscriminationMode, setIsDiscriminationMode] = useState(false);
  const [discrimIndex, setDiscrimIndex] = useState(0);
  const [shuffledScenarios, setShuffledScenarios] = useState<ShowingScenario[]>([]);
  const [activeShowingCategoryId, setActiveShowingCategoryId] = useState<string | null>(null);
  const [isShowingInputReady, setIsShowingInputReady] = useState(false);

  // Yeni state'ler
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<'ok' | 'err' | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [completedSectionTitle, setCompletedSectionTitle] = useState<string | null>(null);

  // Dokunma efekti
  const [touchEffect, setTouchEffect] = useState<{x: number, y: number, id: number} | null>(null);

  // Ses referansları
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const flashcardAudioRef = useRef<HTMLAudioElement | null>(null);
  const showingInputLockedRef = useRef(true);
  const questionAudioTimerRef = useRef<number | null>(null);
  const touchConfirmationAudioRef = useRef<HTMLAudioElement | null>(null);

  const student = students.find(s => s.id === studentId);

  // Ekran yönü kilitleme - native bridge öncelikli (MainActivity AndroidOrientation)
  const lockPortrait = async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('portrait');
      } else {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      }
    } catch (e) {
      console.log('Portrait lock hatası:', e);
    }
  };

  const lockLandscape = async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('landscape');
      } else {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      }
    } catch (e) {
      console.log('Landscape lock hatası:', e);
    }
  };

  const unlockOrientation = async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('unlock');
      } else {
        await ScreenOrientation.unlock();
      }
    } catch (e) {
      console.log('Unlock hatası:', e);
    }
  };

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
      setDirty(false);
      setLoading(false);
    };
    loadData();
  }, [studentId]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty]);

  // Sayfadan çıkınca yönü serbest bırak
  useEffect(() => {
    return () => {
      unlockOrientation();
    };
  }, []);

  useEffect(() => {
    if (flashcardAudioRef.current) {
      flashcardAudioRef.current.pause();
      flashcardAudioRef.current.currentTime = 0;
      flashcardAudioRef.current = null;
    }

    if (!activeEvaluation) return;

    const item = activeEvaluation.data[evalIndex];
    if (!item?.audio) return;

    const audio = new Audio(item.audio);
    audio.loop = false;
    flashcardAudioRef.current = audio;
    audio.play().catch(e => console.log("Flashcard ses hatası:", e));

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (flashcardAudioRef.current === audio) {
        flashcardAudioRef.current = null;
      }
    };
  }, [evalIndex, activeEvaluation]);

  useEffect(() => {
    showingInputLockedRef.current = true;
    setIsShowingInputReady(false);

    if (questionAudioTimerRef.current !== null) {
      window.clearTimeout(questionAudioTimerRef.current);
      questionAudioTimerRef.current = null;
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
      questionAudioRef.current = null;
    }

    if (!isDiscriminationMode || shuffledScenarios.length === 0) return;

    const scenario = shuffledScenarios[discrimIndex];
    if (!scenario?.audioSrc) {
      showingInputLockedRef.current = false;
      setIsShowingInputReady(true);
      return;
    }

    const audio = new Audio(scenario.audioSrc);
    questionAudioRef.current = audio;

    const openInput = () => {
      if (questionAudioRef.current !== audio) return;
      showingInputLockedRef.current = false;
      setIsShowingInputReady(true);
    };
    audio.addEventListener('ended', openInput, { once: true });
    audio.addEventListener('error', openInput, { once: true });

    questionAudioTimerRef.current = window.setTimeout(() => {
      questionAudioTimerRef.current = null;
      audio.play().catch((error) => {
        console.log("Ses oynatma hatası:", error);
        openInput();
      });
    }, 500);

    return () => {
      if (questionAudioTimerRef.current !== null) {
        window.clearTimeout(questionAudioTimerRef.current);
        questionAudioTimerRef.current = null;
      }
      audio.removeEventListener('ended', openInput);
      audio.removeEventListener('error', openInput);
      audio.pause();
      audio.currentTime = 0;
      if (questionAudioRef.current === audio) questionAudioRef.current = null;
    };
  }, [isDiscriminationMode, discrimIndex, shuffledScenarios]);

  const replayInstruction = () => {
    if (questionAudioRef.current) {
      showingInputLockedRef.current = true;
      setIsShowingInputReady(false);
      const audio = questionAudioRef.current;
      const openInput = () => {
        if (questionAudioRef.current !== audio) return;
        showingInputLockedRef.current = false;
        setIsShowingInputReady(true);
      };
      audio.addEventListener('ended', openInput, { once: true });
      audio.addEventListener('error', openInput, { once: true });
      questionAudioRef.current.currentTime = 0;
      questionAudioRef.current.play().catch(e => {
        console.log("Tekrar çalma hatası:", e);
        openInput();
      });
      toast.info("Ses tekrar çalınıyor...");
    }
  };

  const handleSave = async (showMessage = true) => {
    setIsSaving(true);
    setSaveBanner(null);
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (!instId || !studentId) throw new Error('Kurum veya öğrenci bilgisi bulunamadı.');
      await setDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "kavram"), formData);
      await associateCurrentTeacherWithStudent(studentId);
      setDirty(false);
      setSaveBanner('ok');
      window.setTimeout(() => setSaveBanner(null), 1500);
      if (showMessage) toast.success("Kavramlar kaydedildi!");
      return true;
    } catch (error) {
      console.error('Kavram değerlendirme kaydetme hatası:', error);
      setSaveBanner('err');
      window.setTimeout(() => setSaveBanner(null), 2500);
      toast.error('Kavram değerlendirmesi kaydedilemedi.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const markUnsaved = () => {
    setDirty(true);
    setSaveBanner(null);
  };

  const requestPageExit = () => {
    if (dirty) setShowLeaveDialog(true);
    else setLocation(`/assessment/${studentId}`);
  };

  useEffect(() => {
    oppositeLockedRef.current = true;
    setOppositeReady(false);
    if (!activeGame) return;
    const keys: Record<string, [string, string]> = {
      'Boş-Dolu': ['dolu', 'bos'], 'Az-Çok': ['cok', 'az'],
      'Ağır-Hafif': ['agir', 'hafif'], 'Açık-Kapalı': ['acik', 'kapali'],
      'Uzun-Kısa': ['uzun', 'kisa'], 'Büyük-Küçük': ['buyuk', 'kucuk'],
      'Sıcak-Soğuk': ['sicak', 'soguk'],
    };
    const pair = keys[activeGame];
    const audio = pair && audioRefs.current[pair[targetQuestion === 'full' ? 0 : 1]];
    let cancelled = false;
    const unlock = () => {
      if (cancelled) return;
      oppositeLockedRef.current = false;
      setOppositeReady(true);
    };
    const reportError = () => {
      if (!cancelled) toast.error('Yönerge sesi çalınamadı. Tekrar dinle düğmesine basın.');
    };
    audio?.addEventListener('ended', unlock);
    audio?.addEventListener('error', reportError);
    const timer = window.setTimeout(() => {
      if (!audio) { reportError(); return; }
      audio.currentTime = 0;
      audio.play().catch(reportError);
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      oppositeLockedRef.current = true;
      if (oppositeTransitionRef.current !== null) {
        clearTimeout(oppositeTransitionRef.current);
        oppositeTransitionRef.current = null;
      }
      audio?.removeEventListener('ended', unlock);
      audio?.removeEventListener('error', reportError);
      if (audio) { audio.pause(); audio.currentTime = 0; }
    };
  }, [activeGame, questionCount, targetQuestion, oppositeReplay]);

  // --- OYUN MOTORU ---
  const initGame = (concept: string) => {
    lockLandscape();
    setQuestionCount(0);
    setCorrectCount(0);
    setActiveGame(concept);
    loadNextQuestion(0, concept);
  };

  const loadNextQuestion = (currentStep: number, gameType: string | null = activeGame) => {
    if (!gameType) return;
    oppositeLockedRef.current = true;
    setOppositeReady(false);
    const pool = SCENARIO_POOLS[gameType];
    const selectedScenario = pool[Math.floor(Math.random() * pool.length)];
    setCurrentGameScenario(selectedScenario);
    const isAskingFull = Math.random() > 0.5;
    setTargetQuestion(isAskingFull ? 'full' : 'empty');
    setQuestionCount(currentStep + 1);
    setIsTransitioning(false);

  };

  const handleGameSelection = (clickedSide: 'left' | 'right', e: any) => {
    if (!currentGameScenario || isTransitioning || oppositeLockedRef.current) return;
    oppositeLockedRef.current = true;
    setOppositeReady(false);
    handleTouchEffect(e);
    setIsTransitioning(true);
    touchConfirmationAudioRef.current?.pause();
    const confirmation = new Audio(dokunmaOnaySes);
    touchConfirmationAudioRef.current = confirmation;
    confirmation.play().catch(error => console.log('Dokunma onay sesi hatası:', error));
    let correctSide = targetQuestion === 'full' ? currentGameScenario.fullSide : (currentGameScenario.fullSide === 'left' ? 'right' : 'left');
    let newCorrect = clickedSide === correctSide ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (questionCount >= OPPOSITE_QUESTION_COUNT) {
      const percentage = Math.round((newCorrect / OPPOSITE_QUESTION_COUNT) * 100);
      oppositeTransitionRef.current = setTimeout(() => {
        setFormData(p => ({ ...p, [activeGame!]: percentage }));
        markUnsaved();
        setCompletedSectionTitle(`${activeGame}: ${newCorrect}/${OPPOSITE_QUESTION_COUNT} doğru — %${percentage}`);
        setActiveGame(null);
        unlockOrientation();
      }, 500);
    } else {
      oppositeTransitionRef.current = setTimeout(() => loadNextQuestion(questionCount), 1000);
    }
  };

  // --- DEĞERLENDİRME MOTORU ---
  const startEvaluation = (category: any) => {
    if (category.isGame) {
      initGame(category.id);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleEvalResponse = (status: boolean) => {
    const currentItem = activeEvaluation.data[evalIndex];
    setFormData(prev => ({ ...prev, [currentItem.name]: status }));
    markUnsaved();
    
    if (evalIndex < activeEvaluation.data.length - 1) {
      setEvalIndex(prev => prev + 1);
    } else {
      setCompletedSectionTitle(`${activeEvaluation.title} · İsimlendirme`);
      setActiveEvaluation(null);
      unlockOrientation();
    }
  };

  // --- AYIRT ETME MOTORU ---
  const getShowingResultKey = (categoryId: string, targetName: string) =>
    categoryId === 'animals'
      ? `${targetName}_Ayirt_Etme`
      : `${categoryId}_${targetName}_Ayirt_Etme`;

  const startShowingEvaluation = (categoryId: string) => {
    const scenarios = categoryId === 'animals'
      ? shuffleArray([...ANIMAL_DISCRIMINATION_SCENARIOS]).map((scenario) => ({
          ...scenario,
          promptText: `“${scenario.targetName}” hangisi?`,
          zoneCount: 3 as const,
          aspectRatio: 16 / 9,
        }))
      : createShowingSession(categoryId);

    if (scenarios.length === 0) {
      setShowComingSoon(true);
      return;
    }

    showingInputLockedRef.current = true;
    setIsShowingInputReady(false);
    setActiveShowingCategoryId(categoryId);
    setShuffledScenarios(scenarios);
    setDiscrimIndex(0);
    setIsDiscriminationMode(true);
    lockLandscape();
  };

  const handleDiscriminationChoice = (selectedSide: ShowingPosition, e: any) => {
    if (showingInputLockedRef.current) return;
    showingInputLockedRef.current = true;
    setIsShowingInputReady(false);
    handleTouchEffect(e);
    const currentScenario = shuffledScenarios[discrimIndex];
    if (!currentScenario || !activeShowingCategoryId) return;
    const isCorrect = selectedSide === currentScenario.correctPosition;

    completeDiscriminationChoice(isCorrect);
  };

  const isPointInsidePolygon = (
    point: readonly [number, number],
    polygon: readonly (readonly [number, number])[],
  ) => {
    const [x, y] = point;
    let inside = false;

    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
      const [currentX, currentY] = polygon[current];
      const [previousX, previousY] = polygon[previous];
      const crossesHorizontalRay = (currentY > y) !== (previousY > y);
      const intersectionX = ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;

      if (crossesHorizontalRay && x < intersectionX) inside = !inside;
    }

    return inside;
  };

  const handleCoordinateChoice = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (showingInputLockedRef.current) return;
    showingInputLockedRef.current = true;
    setIsShowingInputReady(false);
    handleTouchEffect(event);
    const currentScenario = shuffledScenarios[discrimIndex];
    if (!currentScenario?.hitAreas?.length || !activeShowingCategoryId) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const point: readonly [number, number] = [
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    ];
    const isCorrect = currentScenario.hitAreas.some((polygon) =>
      isPointInsidePolygon(point, polygon),
    );

    completeDiscriminationChoice(isCorrect);
  };

  const completeDiscriminationChoice = (isCorrect: boolean) => {
    const currentScenario = shuffledScenarios[discrimIndex];
    if (!currentScenario || !activeShowingCategoryId) return;

    setFormData(prev => ({
      ...prev,
      [getShowingResultKey(activeShowingCategoryId, currentScenario.targetName)]: isCorrect,
    }));
    markUnsaved();

    if (touchConfirmationAudioRef.current) {
      touchConfirmationAudioRef.current.pause();
      touchConfirmationAudioRef.current.currentTime = 0;
    }
    const confirmationAudio = new Audio(dokunmaOnaySes);
    touchConfirmationAudioRef.current = confirmationAudio;
    confirmationAudio.play().catch(error => console.log('Dokunma onay sesi hatası:', error));

    if (isCorrect) {
      toast.success("Süpersin! Doğru bildin. 🎉");
    } else {
      toast.error("Tekrar dene bakalım.");
    }

    if (discrimIndex < shuffledScenarios.length - 1) {
      setTimeout(() => setDiscrimIndex(prev => prev + 1), 600); 
    } else {
      setTimeout(() => {
        const categoryTitle = CATEGORY_MAP.find((item) => item.id === activeShowingCategoryId)?.title ?? 'Kavram';
        setCompletedSectionTitle(`${categoryTitle} · Gösterme`);
        setIsDiscriminationMode(false);
        setActiveShowingCategoryId(null);
        unlockOrientation();
      }, 1000);
    }
  };

  // --- SKOR HESAPLAMA ---
  const calculateNamingScore = (category: any) => {
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

  const calculateShowingScore = (category: any) => {
    const targetNames = category.id === 'animals'
      ? ANIMAL_DISCRIMINATION_SCENARIOS.map((item) => item.targetName)
      : getShowingTargetNames(category.id);
    if (targetNames.length === 0) return null;
    let correct = 0;
    let attempted = 0;
    targetNames.forEach((targetName) => {
      const val = formData[getShowingResultKey(category.id, targetName)];
      if (val !== undefined && val !== null) {
        attempted++;
        if (val === true) correct++;
      }
    });
    if (attempted === 0) return null;
    return Math.round((correct / targetNames.length) * 100);
  };

  const calculateScore = (category: any) => {
    if (category.isGame) {
      const val = formData[category.id];
      if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, Math.min(100, val));
      if (val === true) return 100;
      if (val === false) return 0;
      return null; 
    }
    const naming = calculateNamingScore(category);
    const showing = calculateShowingScore(category);
    if (naming === null && showing === null) return null;
    if (naming === null) return showing;
    if (showing === null) return naming;
    return Math.round((naming + showing) / 2);
  };

  const getCatById = (id: string) => CATEGORY_MAP.find((c) => c.id === id);

  const calculateChildScore = (child: {
    contentId?: string;
    empty?: boolean;
    gameIds?: string[];
  }): number | null => {
    if (child.empty) return null;
    if (child.gameIds && child.gameIds.length) {
      const scores = child.gameIds
        .map((gid) => {
          const cat = getCatById(gid);
          return cat ? calculateScore(cat) : null;
        })
        .filter((s): s is number => s !== null);
      if (!scores.length) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    if (child.contentId) {
      const cat = getCatById(child.contentId);
      return cat ? calculateScore(cat) : null;
    }
    return null;
  };

  const calculateGroupScore = (group: (typeof CATEGORY_GROUPS)[number]): number | null => {
    const scores = group.children
      .map((ch) => calculateChildScore(ch))
      .filter((s): s is number => s !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
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
  // --- RENDER'LAR ---
  const renderGame = () => {
    if (!currentGameScenario) return null;
    const isVideo = currentGameScenario.src && currentGameScenario.src.endsWith('.mp4');
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
        <button onClick={() => { oppositeLockedRef.current = true; setActiveGame(null); unlockOrientation(); }} className="absolute top-8 right-8 z-[110] bg-white/20 text-white p-3 rounded-full hover:bg-white/30 backdrop-blur-md"><X size={32} /></button>
        <button type="button" disabled={isTransitioning} onClick={() => {
          oppositeLockedRef.current = true;
          setOppositeReady(false);
          setOppositeReplay(value => value + 1);
        }} className="absolute top-16 left-4 z-[110] flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs text-white disabled:opacity-40">
          <Volume2 size={16} /> Tekrar dinle
        </button>
        <div className="absolute top-4 left-4 z-[110] bg-black/50 px-4 py-2 rounded-full text-white font-bold text-sm border border-white/20">Soru: {questionCount} / {OPPOSITE_QUESTION_COUNT}</div>
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden animate-in fade-in zoom-in duration-300" key={questionCount}>
          {isVideo ? <video src={currentGameScenario.src} autoPlay loop muted playsInline className="h-full w-auto max-w-none object-contain pointer-events-none select-none" /> : <img src={currentGameScenario.src} className="h-full w-auto max-w-none object-contain pointer-events-none select-none" />}
          <div className="absolute inset-0 z-20 flex">
            <button type="button" aria-label="Sol alan" disabled={!oppositeReady || isTransitioning} onClick={(e) => handleGameSelection('left', e)} className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors disabled:cursor-default" />
            <button type="button" aria-label="Sağ alan" disabled={!oppositeReady || isTransitioning} onClick={(e) => handleGameSelection('right', e)} className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors disabled:cursor-default" />
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluationMode = () => {
    if (!activeEvaluation) return null;
    const item = activeEvaluation.data[evalIndex];
    const isVideo = activeEvaluation.type === 'video';
    const progress = Math.round(((evalIndex) / activeEvaluation.data.length) * 100);

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl flex items-center justify-between mb-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm font-medium">{activeEvaluation.title} - İsimlendirme</span>
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-white/50">{evalIndex + 1} / {activeEvaluation.data.length}</span>
          </div>
          <button onClick={() => { setActiveEvaluation(null); unlockOrientation(); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="relative flex-1 w-full max-w-4xl bg-black rounded-3xl overflow-hidden border border-white/10 mb-6 flex items-center justify-center animate-pop-in" key={evalIndex}>
          {isVideo ? (
            <video src={item.src} autoPlay loop playsInline muted={true} className="w-full h-full object-contain" />
          ) : (
            <img src={item.src} alt={item.name} className="w-full h-full object-contain" />
          )}
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

  const renderDiscriminationGame = () => {
    if (!isDiscriminationMode || shuffledScenarios.length === 0) return null;
    const scenario = shuffledScenarios[discrimIndex];
    const isVideo = scenario.src.endsWith('.mp4');
    const usesCoordinateHitAreas = Boolean(scenario.hitAreas?.length);
    const zonePositions: ShowingPosition[] = scenario.zoneCount === 2
      ? ['left', 'right']
      : ['left', 'center', 'right'];
    const sceneWidth = `min(100vw, ${scenario.aspectRatio * 100}vh)`;
    const sceneHeight = `min(100vh, ${100 / scenario.aspectRatio}vw)`;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <button 
          onClick={() => {
            showingInputLockedRef.current = true;
            setIsShowingInputReady(false);
            setIsDiscriminationMode(false);
            setActiveShowingCategoryId(null);
            unlockOrientation();
          }}
          className="absolute top-8 right-8 z-[120] bg-white/20 p-3 rounded-full text-white hover:bg-white/30"
        >
          <X size={32} />
        </button>

        <div className="absolute bottom-5 right-6 z-[110] rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm font-bold text-white/80 backdrop-blur-md">
          {discrimIndex + 1} / {shuffledScenarios.length}
        </div>

        <div 
          className={`absolute left-2 top-2 z-[110] animate-in slide-in-from-top duration-500 transition-transform ${scenario.audioSrc ? 'cursor-pointer active:scale-95' : ''}`}
          key={scenario.id + 'text'}
          onClick={scenario.audioSrc ? replayInstruction : undefined}
        >
          <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-blue-600/85 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
            {scenario.audioSrc && (
              <div className="rounded-full bg-white/20 p-1">
                <Volume2 size={15} className={!isShowingInputReady ? 'animate-pulse' : ''} />
              </div>
            )}
            <span className="max-w-[42vw] truncate text-sm font-bold tracking-wide text-white">
              {scenario.promptText}
            </span>
          </div>
        </div>

        <div
          className="relative bg-black animate-pop-in"
          key={scenario.id}
          style={{ width: sceneWidth, height: sceneHeight }}
        >
          {isVideo ? (
            <video
              src={scenario.src}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
            />
          ) : (
            <img
              src={scenario.src}
              alt=""
              className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
            />
          )}

          {usesCoordinateHitAreas ? (
            <button
              type="button"
              aria-label={`${scenario.targetName} için görsel üzerinde seçim yap`}
              disabled={!isShowingInputReady}
              onClick={handleCoordinateChoice}
              className="absolute inset-0 z-50 h-full w-full cursor-pointer bg-transparent active:bg-white/[0.02] disabled:cursor-default"
            />
          ) : (
            <div
              className={`absolute inset-0 z-50 grid h-full w-full ${scenario.zoneCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
            >
              {zonePositions.map((position) => (
                <button
                  key={position}
                  type="button"
                  aria-label={`${position} alanı`}
                  disabled={!isShowingInputReady}
                  onClick={(event) => handleDiscriminationChoice(position, event)}
                  className="h-full cursor-pointer border-r border-white/5 bg-transparent transition-colors last:border-r-0 active:bg-white/5 disabled:cursor-default"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- POPUP ---
  const renderCategoryPopup = () => {
    if (!selectedCategory) return null;

    const namingScore = calculateNamingScore(selectedCategory);
    const showingScore = calculateShowingScore(selectedCategory);

    const handleNaming = () => {
      setSelectedCategory(null);
      // Sayıları oturum başında bir kez karıştır; asıl kategori listesini değiştirme.
      setActiveEvaluation(selectedCategory.id === 'numbers'
        ? { ...selectedCategory, data: shuffleArray([...selectedCategory.data]) }
        : selectedCategory);
      setEvalIndex(0);
      lockPortrait();
    };

    const handleShowing = () => {
      setSelectedCategory(null);
      startShowingEvaluation(selectedCategory.id);
    };

    return (
      <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{selectedCategory.title}</h2>
            <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-slate-800 rounded-full">
              <X size={22} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleNaming}
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <div className="text-left">
                <div className="font-bold text-lg">İsimlendirme</div>
                <div className="text-sm text-slate-400 mt-1">“Bu ne?” — adını söyler</div>
              </div>
              <div className="text-2xl font-black">
                {namingScore !== null ? `${namingScore}%` : '—'}
              </div>
            </button>

            <button
              onClick={handleShowing}
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <div className="text-left">
                <div className="font-bold text-lg">Gösterme</div>
                <div className="text-sm text-slate-400 mt-1">“...yi göster” — resmi işaret eder</div>
              </div>
              <div className="text-2xl font-black">
                {showingScore !== null ? `${showingScore}%` : '—'}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- YAKINDA EKLENECEK ---
  const renderComingSoon = () => {
    if (!showComingSoon) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
        <button
          onClick={() => setShowComingSoon(false)}
          className="absolute top-8 right-8 bg-white/20 p-3 rounded-full text-white"
        >
          <X size={28} />
        </button>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold mb-3">Yakında Eklenecek</h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Bu kategori için <strong>Gösterme</strong> değerlendirmesi henüz hazır değil.
            Videolar eklendikten sonra buradan kullanabileceksin.
          </p>
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
      
      <style>{`
        @keyframes popInFromBottomRight {
          0% { transform: translate(20%, 20%) scale(0.8); opacity: 0; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popInFromBottomRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {renderTouchEffect()}
      {renderCategoryPopup()}
      {renderComingSoon()}

      {activeGame && renderGame()}
      {activeEvaluation && !isDiscriminationMode && renderEvaluationMode()}
      {isDiscriminationMode && renderDiscriminationGame()}

      {completedSectionTitle && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Check size={28} />
            </div>
            <h2 className="text-lg font-black text-white">Bölüm tamamlandı</h2>
            <p className="mt-1 text-sm text-slate-300">{completedSectionTitle}</p>
            <p className="mt-3 text-xs leading-relaxed text-amber-300/90">Sonuçlar henüz kaydedilmedi.</p>
            <Button
              className="mt-5 w-full bg-green-600 text-white hover:bg-green-500"
              disabled={isSaving}
              onClick={async () => {
                const saved = await handleSave(false);
                if (saved) {
                  setCompletedSectionTitle(null);
                  toast.success('Sonuç kaydedildi.');
                }
              }}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Kaydediliyor…' : 'Kaydet ve çık'}
            </Button>
            <button
              type="button"
              data-android-back
              disabled={isSaving}
              onClick={() => setCompletedSectionTitle(null)}
              className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Şimdilik burada kal
            </button>
          </div>
        </div>
      )}

      {showLeaveDialog && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Kaydedilmemiş değişiklikler</h3>
            <p className="text-sm leading-relaxed text-slate-300">Yaptığınız değerlendirmeler kaydedilmedi. Çıkarsanız bu sonuçlar kaybolur.</p>
            <div className="flex gap-2 pt-1">
              <Button data-android-back variant="ghost" className="flex-1 text-slate-300 hover:text-white" onClick={() => setShowLeaveDialog(false)}>Hayır, kal</Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-500"
                onClick={() => {
                  setShowLeaveDialog(false);
                  setDirty(false);
                  setLocation(`/assessment/${studentId}`);
                }}
              >
                Evet, çık
              </Button>
            </div>
            <Button
              className="w-full bg-green-600 text-white hover:bg-green-500"
              disabled={isSaving}
              onClick={async () => {
                const saved = await handleSave(false);
                if (saved) {
                  setShowLeaveDialog(false);
                  setLocation(`/assessment/${studentId}`);
                }
              }}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Kaydediliyor…' : 'Kaydet ve çık'}
            </Button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-6 sticky top-0 bg-[#020617]/95 backdrop-blur z-20 py-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={requestPageExit} className="text-slate-400 hover:bg-slate-800"><ArrowLeft /></Button>
          <div>
            <h1 className="text-lg font-bold">Kavram Değerlendirme</h1>
            <p className="text-xs text-slate-400">{student.name}</p>
          </div>
        </div>
        <div className="flex min-w-[7.25rem] flex-col items-end gap-1">
          <Button onClick={() => handleSave()} disabled={isSaving} className="bg-green-600 h-9 px-4 text-xs shadow-lg shadow-green-900/20 disabled:opacity-60">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
          {saveBanner === 'ok' && <span className="text-[11px] font-semibold text-emerald-400">✓ Kaydedildi</span>}
          {saveBanner === 'err' && <span className="text-[11px] font-semibold text-red-400">✕ Kaydedilemedi</span>}
          {dirty && !saveBanner && !isSaving && <span className="text-[10px] font-semibold text-amber-400">Kaydedilmedi</span>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading ? <LogoLoader /> : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
            {/* Ana kategoriler — 2 sütun */}
            <div className="grid grid-cols-2 gap-3">
              {CATEGORY_GROUPS.map((group) => {
                const groupScore = calculateGroupScore(group);
                const colorClass = getScoreColor(groupScore);
                const barColor = getProgressBarColor(groupScore);
                const filled = group.children.filter((c) => !c.empty).length;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setExpandedChild(null);
                    }}
                    className={twMerge(
                      "relative flex flex-col items-start p-3 sm:p-4 rounded-2xl border text-left transition-all active:scale-[0.98] min-h-[112px] overflow-hidden",
                      colorClass,
                    )}
                  >
                    <p className="text-[9px] font-bold tracking-wider uppercase text-white/50 mb-1">
                      {filled}/{group.children.length} alt
                    </p>
                    <h3 className="text-xs sm:text-sm font-black text-white leading-snug mb-auto pr-1">
                      {group.title}
                    </h3>
                    <div className="w-full mt-2">
                      <div className="flex items-end justify-between gap-1 mb-1">
                        <span className="text-[10px] text-white/60">ortalama</span>
                        <span className={twMerge("text-base sm:text-lg font-black tabular-nums", groupScore === null ? "text-white/40" : "text-white")}>
                          {groupScore === null ? "—" : `%${groupScore}`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                        <div
                          className={twMerge("h-full rounded-full transition-all", barColor)}
                          style={{ width: `${groupScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Alt kategoriler — popup */}
            {selectedGroupId && (() => {
              const group = CATEGORY_GROUPS.find((g) => g.id === selectedGroupId);
              if (!group) return null;
              const groupScore = calculateGroupScore(group);
              return (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
                    aria-label="Kapat"
                    onClick={() => {
                      setSelectedGroupId(null);
                      setExpandedChild(null);
                    }}
                  />
                  <div className="relative w-full sm:max-w-md max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-4 sm:p-5 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Alt kategoriler</p>
                        <h3 className="text-base sm:text-lg font-black text-white leading-snug">{group.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ortalama: {groupScore === null ? "—" : `%${groupScore}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setExpandedChild(null);
                        }}
                        className="shrink-0 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {group.children.map((child) => {
                        const childKey = `${group.id}:${child.title}`;
                        const score = calculateChildScore(child);
                        const colorClass = getScoreColor(score);
                        const barColor = getProgressBarColor(score);
                        const isEmpty = !!child.empty;
                        const isGames = !!(child.gameIds && child.gameIds.length);
                        const cat = child.contentId ? getCatById(child.contentId) : null;
                        const expanded = expandedChild === childKey;

                        return (
                          <div key={childKey}>
                            <button
                              type="button"
                              disabled={isEmpty}
                              onClick={() => {
                                if (isEmpty) return;
                                if (isGames) {
                                  setExpandedChild(expanded ? null : childKey);
                                  return;
                                }
                                if (cat) {
                                  setSelectedGroupId(null);
                                  setExpandedChild(null);
                                  startEvaluation(cat);
                                }
                              }}
                              className={twMerge(
                                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                isEmpty
                                  ? "border-slate-800 bg-slate-950/50 opacity-45 cursor-not-allowed"
                                  : colorClass + " active:scale-[0.99]",
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white truncate">{child.title}</span>
                                  {isEmpty && (
                                    <span className="text-[9px] uppercase text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">Boş</span>
                                  )}
                                  {isGames && (
                                    <span className="text-[10px] text-slate-400">{expanded ? "▲" : "▼"}</span>
                                  )}
                                </div>
                                {!isEmpty && score !== null && (
                                  <div className="mt-1.5 h-1.5 w-full max-w-[160px] bg-black/25 rounded-full overflow-hidden">
                                    <div className={twMerge("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
                                  </div>
                                )}
                              </div>
                              <span className={twMerge("text-base font-black tabular-nums shrink-0", score === null ? "text-slate-500" : "text-white")}>
                                {isEmpty || score === null ? "—" : `%${score}`}
                              </span>
                            </button>

                            {isGames && expanded && (
                              <div className="mt-1.5 ml-1 pl-3 border-l-2 border-slate-700 space-y-1.5">
                                {child.gameIds!.map((gid) => {
                                  const gcat = getCatById(gid);
                                  if (!gcat) return null;
                                  const gs = calculateScore(gcat);
                                  const gc = getScoreColor(gs);
                                  return (
                                    <button
                                      key={gid}
                                      type="button"
                                      onClick={() => {
                                        setSelectedGroupId(null);
                                        setExpandedChild(null);
                                        startEvaluation(gcat);
                                      }}
                                      className={twMerge(
                                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left text-sm",
                                        gc,
                                      )}
                                    >
                                      <span className="font-semibold text-white/90">{gcat.title}</span>
                                      <span className="font-bold tabular-nums text-white/80">
                                        {gs === null ? "—" : `%${gs}`}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
