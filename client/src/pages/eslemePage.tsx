// ... Diğer importlar aynı ...
import NesneEslemeGame, { GameType } from '@/aba/esle/NesneEslemeGame';

// ... (component başı aynı) ...

  // --- 🔥 YENİ OYUN TÜRÜ EŞLEŞTİRME (Tam Liste) 🔥 ---
  const getGameTypeForItem = (itemString: string): GameType | null => {
    
    // --- 1. AYNI OLAN (BİREBİR) ---
    if (itemString.includes("EB.1.1")) return 'nesne-nesne-ayni';
    if (itemString.includes("EB.1.2")) return 'nesne-resim-ayni';
    if (itemString.includes("EB.1.3")) return 'eylem-ayni';
    if (itemString.includes("EB.1.4")) return 'sekil-kutu'; // Şekil Kutusu

    // --- 2. FARKLI OLAN (GENELLEME) ---
    if (itemString.includes("EB.2.1")) return 'nesne-nesne-farkli';
    if (itemString.includes("EB.2.2")) return 'nesne-resim-farkli';
    if (itemString.includes("EB.2.3")) return 'eylem-farkli';
    if (itemString.includes("EB.2.4")) return 'resim-nesne';

    // --- 3. DİĞERLERİ ---
    if (itemString.includes("EB.3.2")) return 'sayi';
    if (itemString.includes("EB.3.4")) return 'golge';
    
    // EB.3.1 Şekil Eşleme (Kutudan bağımsız) için henüz özel bir modumuz yok,
    // ama istersen onu da 'sekil-kutu'ya yönlendirebiliriz veya basit bir eşleme yapabiliriz.
    // Şimdilik listende olan EB.1.4 için 'sekil-kutu' tam oturuyor.
    
    return null;
  };

// ... (kalan kısım aynı) ...
