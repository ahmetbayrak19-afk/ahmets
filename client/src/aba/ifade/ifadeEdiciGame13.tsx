// client/src/aba/NesneEslemeGame13.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase"; // yolunu projene göre düzelt
import { ArrowLeft, Mic, Square, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CalibrationItem = {
  id?: string;
  promptKey: string; // örn "elma_yiyor"
  promptText: string; // örn "elma yiyor"
  recognizedText: string; // motor ne duyduysa
  source: "final" | "interim" | "none" | "error";
  createdAt?: any;
};

type Props = {
  onBack: () => void;
  studentId: string;
};

/** ===============================
 *  WEB SPEECH (interim fallback)
 *  =============================== */
function createLooseRecognizer(lang = "tr-TR") {
  const SR: any =
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

  if (!SR) return null;

  const rec = new SR();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 5;

  return rec as any;
}

function normalizeLooseText(s: string) {
  // Burada "anlamlı kelime" filtresi YOK.
  // Sadece trim + çoklu boşluk düzeltmesi.
  return (s || "").replace(/\s+/g, " ").trim();
}

/** ===============================
 *  SAYFA
 *  =============================== */
export default function NesneEslemeGame13({ onBack, studentId }: Props) {
  const instId = useMemo(
    () => localStorage.getItem("kazanim-takip-institution-id") || "",
    []
  );

  const [items] = useState<{ key: string; text: string }[]>([
    { key: "elma_yiyor", text: "elma yiyor" },
    { key: "su_iciyor", text: "su içiyor" },
    { key: "top_atiyor", text: "top atıyor" },
    { key: "kapi_ac", text: "kapı aç" },
    // burayı kendi kalibrasyon cümlelerinle çoğalt
  ]);

  const [selectedKey, setSelectedKey] = useState(items[0]?.key || "");
  const selected = useMemo(
    () => items.find((x) => x.key === selectedKey) || items[0],
    [items, selectedKey]
  );

  // realtime kayıtlar
  const [records, setRecords] = useState<CalibrationItem[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // recording state
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState(""); // ekranda canlı göster
  const [bestCandidate, setBestCandidate] = useState(""); // interim/final “ne geldiyse”
  const [finalText, setFinalText] = useState(""); // final transcript
  const [lastSource, setLastSource] = useState<
    "final" | "interim" | "none" | "error"
  >("none");

  const recognizerRef = useRef<any>(null);
  const stopTimerRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  /** Realtime kayıtları çek */
  useEffect(() => {
    if (!studentId || !instId) return;

    const colRef = collection(
      db,
      "institutions",
      instId,
      "students",
      studentId,
      "calibration_nesne_esleme"
    );
    const qRef = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as CalibrationItem[];
        setRecords(data);
        setIsLoadingRecords(false);
      },
      (err) => {
        console.error(err);
        toast.error("Kayıtlar çekilemedi.");
        setIsLoadingRecords(false);
      }
    );

    return () => unsub();
  }, [studentId, instId]);

  /** Recognizer kur */
  useEffect(() => {
    recognizerRef.current = createLooseRecognizer("tr-TR");
  }, []);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const hardStop = () => {
    try {
      recognizerRef.current?.stop?.();
    } catch {}
  };

  const resetSession = () => {
    endedRef.current = false;
    setIsListening(false);
    setLiveText("");
    setBestCandidate("");
    setFinalText("");
    setLastSource("none");
    clearStopTimer();
  };

  const saveToFirebase = async (payload: CalibrationItem) => {
    if (!studentId || !instId) {
      toast.error("Kurum veya öğrenci oturumu yok.");
      return;
    }

    const colRef = collection(
      db,
      "institutions",
      instId,
      "students",
      studentId,
      "calibration_nesne_esleme"
    );

    await addDoc(colRef, {
      promptKey: payload.promptKey,
      promptText: payload.promptText,
      recognizedText: payload.recognizedText,
      source: payload.source,
      createdAt: serverTimestamp(),
    });
  };

  const finalizeAndSave = async () => {
    if (endedRef.current) return;
    endedRef.current = true;

    const f = normalizeLooseText(finalText);
    const b = normalizeLooseText(bestCandidate);

    let recognized = "";
    let source: CalibrationItem["source"] = "none";

    if (f) {
      recognized = f;
      source = "final";
    } else if (b) {
      recognized = b;
      source = "interim";
    } else {
      recognized = "NO_RESULT";
      source = "none";
    }

    setLastSource(source);

    try {
      await saveToFirebase({
        promptKey: selected.key,
        promptText: selected.text,
        recognizedText: recognized,
        source,
      });
      toast.success("Kaydedildi.");
    } catch (e: any) {
      console.error(e);
      toast.error("Firebase kayıt hatası: " + (e?.message || "unknown"));
    } finally {
      setIsListening(false);
      clearStopTimer();
      // canlı metni ekranda kalsın diye sıfırlamıyorum
    }
  };

  const startListening = async () => {
    if (!recognizerRef.current) {
      toast.error("SpeechRecognition yok (WebView desteklemiyor olabilir).");
      return;
    }
    if (!instId || !studentId) {
      toast.error("Kurum/Öğrenci ID yok.");
      return;
    }

    // Session reset
    resetSession();
    setIsListening(true);

    const rec = recognizerRef.current;

    // Eventleri her start’ta yeniden bağla (en stabil yöntem)
    rec.onresult = (e: any) => {
      // final + interim yakala
      let gotAnything = false;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        for (let a = 0; a < r.length; a++) {
          const t = normalizeLooseText(r[a]?.transcript ?? "");
          if (t) {
            gotAnything = true;
            // “en son gelen” en iyi aday olarak tutulur (filtre yok)
            setBestCandidate(t);
            setLiveText(t);
          }
        }

        if (r.isFinal) {
          const ft = normalizeLooseText(r[0]?.transcript ?? "");
          if (ft) {
            gotAnything = true;
            setFinalText(ft);
            setLiveText(ft);
          }
        }
      }

      // Bazı cihazlarda sessizlikte takılıyor → her sonuçta timeout’u tazele
      if (gotAnything) {
        clearStopTimer();
        stopTimerRef.current = window.setTimeout(() => {
          hardStop();
        }, 1800); // 1.8sn sessizlik → stop
      }
    };

    rec.onerror = (err: any) => {
      console.warn("rec.onerror", err);
      setLastSource("error");
      // hata olsa bile elimizde ne varsa kaydet
      hardStop();
    };

    rec.onspeechend = () => {
      // konuşma biter bitmez stop
      hardStop();
    };

    rec.onend = () => {
      // stop sonrası burada finalize
      finalizeAndSave();
    };

    try {
      // Bazı Android WebView’da start iki kere çağrılırsa bozulur → try/catch
      rec.start();

      // Global güvenlik: 6sn sonra stop (takılma olmasın)
      stopTimerRef.current = window.setTimeout(() => {
        hardStop();
      }, 6000);
    } catch (e: any) {
      console.error(e);
      toast.error("Dinleme başlatılamadı: " + (e?.message || "unknown"));
      setIsListening(false);
    }
  };

  const stopListening = () => {
    hardStop();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800"
        >
          <ArrowLeft />
        </button>

        <div className="text-right">
          <div className="text-xs text-slate-500 font-black uppercase tracking-widest">
            NesneEşlemeGame13
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            inst={instId || "?"} · student={studentId || "?"}
          </div>
        </div>
      </header>

      {/* Üst panel */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-5 shadow-2xl">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Kalibrasyon Cümlesi Seç
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setSelectedKey(it.key)}
              className={`px-3 py-3 rounded-2xl border text-left transition ${
                selectedKey === it.key
                  ? "bg-blue-600 border-blue-500"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              <div className="text-xs font-black">{it.text}</div>
              <div className="text-[10px] opacity-60 font-mono">{it.key}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {!isListening ? (
            <button
              onClick={startListening}
              className="flex-1 h-14 rounded-2xl bg-green-600 font-black flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Mic /> DİNLE
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex-1 h-14 rounded-2xl bg-red-600 font-black flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Square /> DURDUR
            </button>
          )}

          <div className="w-[140px] h-14 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-center px-3">
            <div className="text-[10px] text-slate-500 font-black uppercase">
              kaynak
            </div>
            <div className="text-xs font-mono">
              {isListening ? "listening…" : lastSource}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Canlı / Son Çıktı
          </div>

          <div className="text-lg font-black break-words">
            {liveText || (
              <span className="text-slate-700">
                (Dinle’ye bas → konuş → ne duyarsa yazacak)
              </span>
            )}
          </div>

          <div className="mt-2 text-[11px] text-slate-600 font-mono break-words">
            bestCandidate: {bestCandidate || "-"} <br />
            finalText: {finalText || "-"}
          </div>
        </div>
      </div>

      {/* Kayıt listesi */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Firebase Kayıtları
          </div>
          {isLoadingRecords && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="animate-spin" size={16} /> yükleniyor
            </div>
          )}
        </div>

        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black break-words">
                    {r.promptText}
                    <span className="ml-2 text-[11px] font-mono text-slate-500">
                      ({r.promptKey})
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-black break-words">
                    {r.recognizedText}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono">
                    source={r.source}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 cursor-not-allowed"
                    title="Silme istersen eklerim (şimdilik yok)"
                    disabled
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoadingRecords && records.length === 0 && (
            <div className="text-center text-slate-600 text-sm font-bold py-10">
              Henüz kayıt yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
