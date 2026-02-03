import React, { useState } from 'react';
import { ArrowLeft, Box, Mic2, Image, Volume2, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameProps {
  mode: 'assessment' | 'instruction'; // Test mi Öğretim mi?
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame14({ mode, onClose, onComplete }: GameProps) {
  // Hangi alt oyunun seçildiğini tutan state (null ise menüdesin)
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);

  // --- OYUN İÇERİK ALANLARI (ŞİMDİLİK BOŞ) ---
  const renderGameContent = () => {
    switch (selectedLevel) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-6">
            <div className="p-8 bg-blue-500/20 rounded-full border-4 border-blue-500">
                <Box size={64} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">1. Kutu Sallama Sesi</h2>
            <p className="text-slate-400">Bu bölümün içeriği (Ses dosyaları ve animasyonlar) daha sonra eklenecek.</p>
            <Button variant="outline" onClick={() => setSelectedLevel(null)}>Menüye Dön</Button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-6">
            <div className="p-8 bg-purple-500/20 rounded-full border-4 border-purple-500">
                <Mic2 size={64} className="text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">2. Yansıma Ses Eşleme</h2>
            <p className="text-slate-400">Bu bölümün içeriği (Yansıma sesleri) daha sonra eklenecek.</p>
            <Button variant="outline" onClick={() => setSelectedLevel(null)}>Menüye Dön</Button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-6">
             <div className="p-8 bg-green-500/20 rounded-full border-4 border-green-500">
                <div className="flex gap-2">
                    <Volume2 size={48} className="text-green-400" />
                    <Image size={48} className="text-green-400" />
                </div>
            </div>
            <h2 className="text-3xl font-bold text-white">3. Ses ile Nesne Eşleme</h2>
            <p className="text-slate-400">Bu bölümün içeriği (Nesne resimleri ve sesleri) daha sonra eklenecek.</p>
            <Button variant="outline" onClick={() => setSelectedLevel(null)}>Menüye Dön</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-lg">
        <button 
            onClick={() => {
                // Eğer bir oyunun içindeysek menüye dön, menüdeysek komple kapat
                if (selectedLevel) setSelectedLevel(null);
                else onClose();
            }} 
            className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 active:scale-95 transition-all border border-slate-700"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-200">
            {selectedLevel ? "Oyun Alanı" : "Ses Eşleme Becerileri"}
        </h2>
        <div className="w-12" /> {/* Denge boşluğu */}
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* --- ANA MENÜ --- */}
        {!selectedLevel && (
            <div className="h-full flex flex-col items-center justify-center p-6 gap-6 animate-in fade-in zoom-in duration-300">
                <h3 className="text-2xl font-bold mb-4 text-center text-blue-100">Lütfen Bir Çalışma Seçin</h3>
                
                {/* SEÇENEK 1 */}
                <button 
                    onClick={() => setSelectedLevel(1)}
                    className="w-full max-w-md bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-700 p-6 rounded-2xl flex items-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:bg-blue-500 transition-colors">
                        <Box size={32} className="text-white" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xl font-bold text-white">Kutu Sallama Sesi</h4>
                        <p className="text-sm text-blue-300">Aynı sesi çıkaran kutuları eşle</p>
                    </div>
                </button>

                {/* SEÇENEK 2 */}
                <button 
                    onClick={() => setSelectedLevel(2)}
                    className="w-full max-w-md bg-gradient-to-r from-purple-900 to-slate-900 border border-purple-700 p-6 rounded-2xl flex items-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg group-hover:bg-purple-500 transition-colors">
                        <Mic2 size={32} className="text-white" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xl font-bold text-white">Yansıma Ses Eşleme</h4>
                        <p className="text-sm text-purple-300">Ses ile sesi eşleştir</p>
                    </div>
                </button>

                {/* SEÇENEK 3 */}
                <button 
                    onClick={() => setSelectedLevel(3)}
                    className="w-full max-w-md bg-gradient-to-r from-green-900 to-slate-900 border border-green-700 p-6 rounded-2xl flex items-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg group-hover:bg-green-500 transition-colors">
                        <div className="flex gap-1">
                             <Volume2 size={20} className="text-white" />
                             <Image size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-left">
                        <h4 className="text-xl font-bold text-white">Ses ile Nesne Eşleme</h4>
                        <p className="text-sm text-green-300">Duyduğun ses hangi nesneye ait?</p>
                    </div>
                </button>
            </div>
        )}

        {/* --- AKTİF OYUN EKRANI --- */}
        {selectedLevel && (
            <div className="h-full w-full animate-in slide-in-from-right duration-300">
                {renderGameContent()}
            </div>
        )}

      </div>
    </div>
  );
            }
                      
