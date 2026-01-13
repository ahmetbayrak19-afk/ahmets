import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, LogOut, Building2, Lock, Unlock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const [_, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // 1. SÜPER ADMİN GİRİŞİ (Basit Güvenlik - Ahmet Bayrak Özel)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name === "admin" && password === "ahmet123") { // Buraya kendi şifreni koyabilirsin
      setIsLoggedIn(true);
      toast.success("Hoş geldin Ahmet Bayrak!");
    } else {
      toast.error("Yetkisiz Giriş!");
    }
  };

  // 2. TÜM KURUMLARI FİREBASE'DEN CANLI ÇEK
  useEffect(() => {
    if (!isLoggedIn) return;

    const q = collection(db, "institutions");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstitutions(docs);
      setListLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // 3. KURUMU DONDUR / AÇ (Kilidi Asan Kısım)
  const toggleFreeze = async (instId: string, currentStatus: boolean) => {
    try {
      const instRef = doc(db, "institutions", instId);
      await updateDoc(instRef, {
        isLoginFrozen: !currentStatus
      });
      toast.success(!currentStatus ? "Kurum Donduruldu" : "Kurum Aktif Edildi");
    } catch (error) {
      toast.error("İşlem başarısız!");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-800 w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-purple-500 mx-auto mb-2" />
            <CardTitle className="text-white">Süper Yönetici Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input placeholder="Yönetici Adı" value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-950" />
              <Input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-950" />
              <Button type="submit" className="w-full bg-purple-600">Giriş Yap</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Shield className="text-purple-500 w-8 h-8" />
            <h1 className="text-2xl font-bold">Süper Yönetici Paneli</h1>
          </div>
          <Button variant="ghost" onClick={() => setIsLoggedIn(false)}><LogOut className="mr-2 w-4 h-4" /> Çıkış</Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle>Kayıtlı Kurumlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {listLoading ? <Loader2 className="animate-spin mx-auto" /> : institutions.map(inst => (
              <div key={inst.id} className={`flex items-center justify-between p-4 rounded-lg border ${inst.isLoginFrozen ? 'bg-red-900/10 border-red-900/50' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <Building2 className={inst.isLoginFrozen ? 'text-red-500' : 'text-green-500'} />
                  <div>
                    <p className="font-bold">{inst.name}</p>
                    <p className="text-xs text-slate-400">{inst.isLoginFrozen ? 'Donduruldu' : 'Aktif'}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={inst.isLoginFrozen ? "default" : "destructive"}
                  onClick={() => toggleFreeze(inst.id, !!inst.isLoginFrozen)}
                >
                  {inst.isLoginFrozen ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  {inst.isLoginFrozen ? 'Aç' : 'Dondur'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
    }
                                                                                      
