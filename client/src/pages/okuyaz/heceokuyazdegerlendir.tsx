import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, ClipboardList } from 'lucide-react';

export default function HeceOkuyazDegerlendir() {
  const [match, params] = useRoute('/okuyaz/degerlendirme/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full space-y-6 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 p-8">
        <div className="mx-auto w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20">
            <ClipboardList className="w-8 h-8 text-pink-400" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">Değerlendirme Modülü</h2>
            <p className="text-slate-400 text-sm mt-2">Bu bölüm öğrencinin seviyesini belirlemek için hazırlanmaktadır.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation(`/okuma-yazma-assessment/${studentId}`)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    </div>
  );
      }
