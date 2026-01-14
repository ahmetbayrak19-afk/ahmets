  // --- 1. SİSTEMİ AKTİF ET (GÜNCELLENMİŞ VERSİYON) ---
  const handleActivateSystem = async () => {
    setIsChecking(true);
    
    try {
      // 1. ADIM: HTTPS KONTROLÜ
      // Web NFC ve Mikrofon sadece HTTPS veya localhost üzerinde çalışır.
      // APK içinde dosya sisteminden (file://) çalışıyorsa bu API'ler devre dışı kalır.
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        throw new Error("Güvenlik Hatası: Uygulama HTTPS üzerinden sunulmalıdır.");
      }

      // 2. ADIM: MİKROFON İZNİ
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tarayıcı/WebView mikrofon API'sini desteklemiyor.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // İzin alındı, şimdi stream'i durdurup kaynağı serbest bırakalım
      stream.getTracks().forEach(t => t.stop());
      toast.success("Mikrofon Erişimi Onaylandı.");

      // 3. ADIM: NFC İZNİ (Hata olsa bile devam etsin mi?)
      if ('NDEFReader' in window) {
        try {
          const ndef = new (window as any).NDEFReader();
          await ndef.scan();
          toast.success("NFC Erişimi Onaylandı.");
        } catch (nfcError: any) {
          console.warn("NFC Hatası:", nfcError);
          // NFC hayati önem taşıyorsa throw ile durdurabilirsin, 
          // ama test için sadece uyarı verip geçiyoruz:
          toast.warning("NFC başlatılamadı (Cihaz desteklemiyor olabilir).");
        }
      } else {
        toast.warning("Bu cihazda Web NFC desteği bulunamadı.");
        // Not: APK içinde standart WebView genellikle WebNFC desteklemez.
      }

      // Her şey (veya en azından mikrofon) tamamsa panele geç
      setTimeout(() => {
        setView('setup');
        setIsChecking(false);
      }, 500);

    } catch (err: any) {
      setIsChecking(false);
      console.error("Kritik Hata:", err);
      toast.error(err.message || "İzinler alınamadı.");
      // Hatanın detayını görmek için geçici olarak alert açabilirsin:
      alert("Hata: " + err.message);
    }
  };
