import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function Seviye3() {
  const [match, params] = useRoute('/okuyaz/seviye3/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full space-y-6 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 p-8">
        <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">3. Seviye</h2>
            <p className="text-slate-400 text-sm mt-2">Kelime, cümle ve metin çalışmaları hazırlanıyor.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation(`/okuma-yazma-assessment/${studentId}`)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </div>
    </div>
  );
}

