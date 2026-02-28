import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; // 🔥 Hata veren yol düzeltildi (../../firebase)
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 YAPAY ZEKA KÜTÜPHANELERİ 🔥
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

// --- VARLIKLAR (ASSETS) ---
// Bu görsel AliciGame7.tsx ile aynı klasörde olmalı (boynu boş şeffaf PNG)
import dedektifKostumImg from './dedektif_kostum.png'; 

interface AliciGame7Props {
  studentId: string;
  onClose: () => void;
}

export default function AliciGame7({ studentId, onClose }: AliciGame7Props) {
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
    
    if (!studentId || !instId) {
        toast.error("Hatalı erişim!");
        onClose();
        return;
    }

    const fetchStudent = async () => {
      try {
        const studentRef = doc(db, "institutions", instId, "students", studentId);
        const docSnap = await getDoc(studentRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudent({ id: docSnap.id, ...data });
          
          if (!data.photoUrl) {
              setAiError("Öğrencinin fotoğrafı yok, dedektif yapılamaz.");
          }
        } else {
          toast.error("Öğrenci bulunamadı!");
          onClose();
        }
      } catch (error) {
        console.error("Hata:", error);
        toast.error("Bir hata oluştu.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, onClose]);

  // --- ADIM 2: YAPAY ZEKA MODELİNİ YÜKLE ---
  useEffect(() => {
    const loadAIModel = async () => {
        try {
            setIsProcessing(true);
            await tf.ready();
            
            const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
            const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig = {
                runtime: 'mediapipe', 
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
                modelType: 'general',
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

        // 1. Canvas boyutlarını sabitle
        const TARGET_SIZE = 512;
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // 2. Orijinal fotoğrafı çiz
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - minDim) / 2;
        const startY = (img.naturalHeight - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

        // 3. Arkaplanı Sil
        const segmentation = await segmenter.segmentPeople(canvas);
        
        if (segmentation && segmentation.length > 0) {
            const foregroundColor = { r: 0, g: 0, b: 0, a: 0 }; 
            const backgroundColor = { r: 0, g: 0, b: 0, a: 255 }; 
            
            const backgroundMask = await bodySegmentation.toBinaryMask(
                segmentation, foregroundColor, backgroundColor
            );

            const imageData = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (backgroundMask.data[i / 4] === 255) {
                    data[i + 3] = 0; 
                }
            }
            
            ctx.putImageData(imageData, 0, 0);

            // 4. Kostümü Giydir
            const kostumImg = new Image();
            kostumImg.src = dedektifKostumImg;
            
            await new Promise((resolve, reject) => {
                kostumImg.onload = resolve;
                kostumImg.onerror = reject;
            });

            ctx.drawImage(kostumImg, 0, 0, TARGET_SIZE, TARGET_SIZE);

            // 5. Finali Kaydet
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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-6 absolute inset-0 z-50">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <span className="italic text-slate-400">Öğrenci dosyası açılıyor...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 pb-12 absolute inset-0 z-50 overflow-y-auto">
      
      {/* ÜST BAR */}
      <header className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6 sticky top-0 bg-[#020617] z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-800">
          <ArrowLeft />
        </Button>
        <div>
            <h1 className="text-xl font-bold">{student?.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-500"/> Dedektif Eğitimi
            </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        {/* Orijinal Fotoğraf (Gizli) */}
        {student?.photoUrl && (
            <img 
                ref={originalImageRef}
                src={student.photoUrl}
                alt="Orijinal"
                crossOrigin="anonymous" 
                className="hidden" 
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
                        <p className="text-slate-500 text-xs mt-2">Arkaplan siliniyor ve kostüm giydiriliyor (Cihazınıza göre 5-10 saniye sürebilir).</p>
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
          
