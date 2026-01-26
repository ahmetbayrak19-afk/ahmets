import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Mic, ChevronRight } from 'lucide-react';

export default function Seviye1() {
  const [match, params] = useRoute('/okuyaz/seviye1/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();

  const handleBack = () => {
    setLocation(`/okuma-yazma-assessment/${studentId}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 font-sans flex flex-col">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto w-full mb-8 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="text-slate-400 hover:bg-slate-800">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">1. Seviye</h1>
            <p className="text-sm text-blue-400">Sesli Harfler ve Temel Heceler</p>
          </div>
        </div>
      </div>

      {/* İÇERİK MENÜSÜ */}
      <div className="max-w-3xl mx-auto w-full grid gap-4">
        
        {/* KART 1: SESLİ HARFLER */}
        <div 
          onClick={() => console.log("Sesli Harflere Git")} // İlerde buraya link vereceğiz
          className="group relative p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Mic size={100} className="text-blue-500" />
          </div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/30">
              A
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">Sesli Harfler</h3>
              <p className="text-sm text-slate-400">A, E, I, İ, O, Ö, U, Ü seslerini tanıma ve yazma.</p>
            </div>
            <ChevronRight className="text-slate-600 group-hover:text-white" />
          </div>
        </div>

        {/* KART 2: HECE SETİ 1 */}
        <div 
          onClick={() => console.log("Hecelere Git")} // İlerde buraya link vereceğiz
          className="group relative p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={100} className="text-pink-500" />
          </div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-2xl font-bold border border-pink-500/30">
              Ba
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-300 transition-colors">1. Grup Heceler</h3>
              <p className="text-sm text-slate-400">Ba, Sa, Ra, Ma, Ka heceleri ile okuma çalışmaları.</p>
            </div>
            <ChevronRight className="text-slate-600 group-hover:text-white" />
          </div>
        </div>

      </div>
    </div>
  );
          }

