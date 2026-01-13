import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

// 🔥 ÖNEMLİ: Resmi buradan içeri alıyoruz.
// Eğer resim src klasöründeyse bu çalışır.
// Dosya adının 'logo.png' olduğundan ve küçük harfle yazıldığından emin ol.
import logoImg from '../logo.png'; 

export default function WelcomeScreen() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // 2 saniye bekle ve Login ekranına yönlendir
    const timer = setTimeout(() => {
      setLocation('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
      
      {/* ARKA PLAN EFEKTLERİ */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="z-10 flex flex-col items-center space-y-6">
        
        {/* LOGO ALANI */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative group"
        >
          {/* Logo Arkasındaki Hafif Parlama */}
          <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl transform scale-125 group-hover:bg-white/10 transition-colors" />
          
          <img 
            src={logoImg}  /* 👈 DÜZELTME BURADA: Artık import ettiğimiz değişkeni kullanıyoruz */
            alt="Kazanım Takip Logosu" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative drop-shadow-2xl"
          />
        </motion.div>

        {/* YAZILAR */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            ÖZEL EĞİTİM
          </h1>
          
          <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
          
          <p className="text-slate-400 text-sm md:text-base tracking-widest uppercase font-medium pt-2">
            Kazanım Takip Sistemi
          </p>
        </motion.div>

      </div>
    </div>
  );
}
