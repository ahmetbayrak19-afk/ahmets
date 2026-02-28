import { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase'; // Firebase bağlantıları
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRoute, useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 YAPAY ZEKA KÜTÜPHANELERİ 🔥
// Bu kütüphaneler cihaz üzerinde (on-device) çalışır, ücretsizdir ve internet gerektirmez.
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // Performans için WebGL backend'i
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

// --- VARLIKLAR (ASSETS) ---
// Dikkat: Bu dosyayı AliciGame7.tsx ile aynı klasöre koymalısın.
// Görsel şeffaf (PNG) olmalı ve boyun/kafa kısmı boş olmalıdır.
import dedektifKostumImg from './dedektif_kostum.png'; 

export default function AliciGame7() {
  const [match, params] = useRoute('/alici-game-7/:studentId');
  const [_, setLocation] = useLocation();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- YAPAY ZEKA VE GÖRSEL DURUMLARI ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [segmenter, setSegmenter] = useState<bodySegmentation.BodySegmenter | null>(null);

  const originalImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- ADIM 1: ÖĞRENCİ VERİSİNİ ÇEK ---
  useEffect(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!params?.studentId || !instId) {
        toast.error("Hatalı erişim!");
        setLocation('/home');
        return;
    }

    const fetchStudent = async () => {
      try {
        const studentRef = doc(db, "institutions", instId, "students", params.studentId);
        const docSnap = await getDoc(studentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudent({ id: docSnap.id, ...data });
          
          if (!data.photoUrl) {
              setAiError("Öğrencinin fotoğrafı yok, dedektif yapılamaz.");
          }
        } else {
          toast.error("Öğrenci bulunamadı!");
          setLocation('/home');
        }
      } catch (error) {
        console.error("Hata:", error);
        toast.error("Bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [params?.studentId]);

  // --- ADIM 2: YAPAY ZEKA MODELİNİ YÜKLE (Cihaz Üzerinde) ---
  useEffect(() => {
    const loadAIModel = async () => {
        try {
            setIsProcessing(true);
            // TensorFlow backend'ini hazırla
            await tf.ready();
            // Selfie Segmentation modelini yükle (En hızlı ve ücretsiz model)
            const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
            const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig = {
                runtime: 'mediapipe', // Veya 'tfjs' ama mediapipe daha hızlıdır
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
                modelType: 'general', // 'landscape' daha az güçlü ama hızlıdır
            };
            const loadedSegmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
            setSegmenter(loadedSegmenter);
            console.log("Yapay zeka modeli yüklendi.");
        } catch (error) {
            console.error("Model yükleme hatası:", error);
            setAiError("Yapay zeka motoru başlatılamadı.");
        } finally {
            setIsProcessing(false);
        }
    };

    loadAIModel();
  }, []);

  // --- ADIM 3: GÖRSELİ İŞLE VE DEDEKTİF YAP ---
  const processAndMakeDetective = async () => {
    if (!segmenter || !student?.photoUrl || !originalImageRef.current || !canvasRef.current) {
        toast.error("İşlem için gerekli veriler eksik.");
        return;
    }

    try {
        setIsProcessing(true);
        setAiError(null);
        setProcessedImage(null);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = originalImageRef.current;
        
        if (!ctx) return;

        // 1. Canvas boyutlarını 512x512 yap (Optimizasyon için kilitliyoruz)
        const TARGET_SIZE = 512;
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // 2. Orijinal kedi fotoğrafını canvas'a çiz (merkeze alarak kare kırp)
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - minDim) / 2;
        const startY = (img.naturalHeight - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

        // 3. 🔥 YAPAY ZEKA İLE ARKAPLANI SİL 🔥
        // Canvas'taki kedi fotoğrafını analiz et
        const segmentation = await segmenter.segmentPeople(canvas);
        
        if (segmentation && segmentation.length > 0) {
            // Arkaplanı şeffaf (transparent) yapan maskeyi oluştur
            const foregroundColor = { r: 0, g: 0, b: 0, a: 0 }; // İnsan (kedi) yeri şeffaf
            const backgroundColor = { r: 0, g: 0, b: 0, a: 255 }; // Arkaplan siyah (silinecek)
            
            const backgroundMask = await bodySegmentation.toBinaryMask(
                segmentation, foregroundColor, backgroundColor
            );

            // Canvas'ın piksellerini al
            const imageData = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
            const data = imageData.data;

            // Maskeyi kullanarak arkaplan piksellerini şeffaf yap
            for (let i = 0; i < data.length; i += 4) {
                // Eğer maske bu pikselin arkaplan (255) olduğunu söylüyorsa
                if (backgroundMask.data[i / 4] === 255) {
                    data[i + 3] = 0; // Alpha (saydamlık) değerini 0 yap (sil)
                }
            }
            
            // Temizlenmiş kediyi canvas'a geri yaz
            ctx.putImageData(imageData, 0, 0);

            // 4. 🔥 DEDEKTİF KOSTÜMÜNÜ GİYDİR 🔥
            const kostumImg = new Image();
            kostumImg.src = dedektifKostumImg;
            
            await new Promise((resolve, reject) => {
                kostumImg.onload = resolve;
                kostumImg.onerror = reject;
            });

            // Temizlenmiş kedinin ÜZERİNE dedektif kostümünü çiz
            // (Hizalamayı görseline göre TARGET_SIZE içinde ayarlamalısın)
            ctx.drawImage(kostumImg, 0, 0, TARGET_SIZE, TARGET_SIZE);

            // 5. Final görseli Base64 olarak state'e kaydet
            const finalDataUrl = canvas.toDataURL('image/png', 0.9);
            setProcessedImage(finalDataUrl);
            toast.success("Öğrenci dedektif oldu!");

        } else {
            setAiError("Fotoğrafta öğrenci algılanamadı.");
        }

    } catch (error) {
        console.error("Görsel işleme hatası:", error);
        setAiError("Görsel işlenirken bir hata oluştu.");
        toast.error("İşlem başarısız.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-6">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <span className="italic text-slate-400">Öğrenci dosyası açılıyor...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 pb-12">
      {/* ÜST BAR */}
      <header className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6 sticky top-0 bg-[#020617] z-10">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft />
        </Button>
        <div>
            <h1 className="text-xl font-bold">{student?.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-500"/> Dedektif Eğitimi</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        {/* Orijinal Fotoğraf (Gizli) */}
        {student?.photoUrl && (
            <img 
                ref={originalImageRef}
                src={student.photoUrl}
                alt="Orijinal"
                crossOrigin="anonymous" // 🔥 Kritik: Firebase'den veri çekmek için şart
                className="hidden" // Ekranda gösterme
            />
        )}
        
        {/* İşlem Canvas'ı (Gizli) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ANA GÖRÜNTÜLEME ALANI */}
        <div className="relative aspect-square w-full max-w-sm mx-auto bg-slate-950 rounded-3xl border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-950/20">
            <AnimatePresence mode="wait">
                {isProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-10 p-6 text-center">
                        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                        <p className="text-blue-400 font-bold text-lg animate-pulse">Yapay Zeka Çalışıyor...</p>
                        <p className="text-slate-500 text-xs mt-2">Arkaplan siliniyor ve kostüm giydiriliyor (Bu işlem cihazınıza göre 5-10 saniye sürebilir).</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {aiError ? (
                <div className="text-center p-8 bg-red-950/20 rounded-2xl border border-red-900/50">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 font-bold">{aiError}</p>
                </div>
            ) : processedImage ? (
                <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    src={processedImage} 
                    alt="Dedektif Öğrenci" 
                    className="w-full h-full object-cover" 
                />
            ) : student?.photoUrl ? (
                <img src={student.photoUrl} alt="Orijinal" className="w-full h-full object-cover opacity-30 blur-sm" />
            ) : (
                <User size={64} className="text-slate-800" />
            )}
        </div>

        {/* EYLEM BUTONU */}
        <div className="text-center">
            <Button 
                onClick={processAndMakeDetective}
                disabled={isProcessing || !!aiError || !segmenter}
                className="w-full max-w-sm h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-600/20 disabled:bg-slate-800 disabled:text-slate-600"
            >
                {isProcessing ? "İşleniyor..." : `🕵️‍♂️ ${student?.name}'i Dedektif Yap!`}
            </Button>
            {!segmenter && !aiError && <p className="text-xs text-slate-500 mt-2 animate-pulse">Yapay zeka motoru yükleniyor, lütfen bekleyin...</p>}
        </div>

      </main>
    </div>
  );
    }
      
