import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { ABA_MODULES } from "@/shared/abaData";
import OrtakDikkat1 from "@/aba/ortakdikkat/ortakdikkat1";

interface OrtakDikkatPageProps {
  studentId: string;
  onBack: () => void;
}

export default function OrtakDikkatPage({
  studentId,
  onBack,
}: OrtakDikkatPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<"ok" | "err" | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // --- MODÜL SEÇİMİ (GARANTİLİ YÖNTEM) ---
  // "ORTAK DİKKAT" kelimesi geçen modülü bulur
  const moduleData = ABA_MODULES.find((m) => m.name.includes("ORTAK DİKKAT"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        const docSnap = await getDoc(
          doc(
            db,
            "institutions",
            instId!,
            "students",
            studentId,
            "assessments",
            "aba",
          ),
        );
        if (docSnap.exists()) {
          setFormData(docSnap.data());
          setDirty(false);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        toast.error("Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleSave = async (newData?: Record<string, any>) => {
    setIsSaving(true);
    setSaveBanner(null);
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (!instId) throw new Error("Kurum bilgisi bulunamadı");
      const dataToSave = newData || formData;
      await setDoc(
        doc(
          db,
          "institutions",
          instId,
          "students",
          studentId,
          "assessments",
          "aba",
        ),
        dataToSave,
        { merge: true },
      );
      setDirty(false);
      setSaveBanner("ok");
      window.setTimeout(() => setSaveBanner(null), 1500);
      if (!newData) toast.success("Ortak Dikkat becerileri kaydedildi!");
      return true;
    } catch (error) {
      console.error(error);
      setDirty(true);
      setSaveBanner("err");
      window.setTimeout(() => setSaveBanner(null), 2500);
      toast.error("Kaydetme hatası oluştu.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [itemCode]: prev[itemCode] === status ? null : status,
    }));
    setDirty(true);
  };

  const handleSessionSave = async (success: boolean) => {
    if (activeItem) {
      const updatedData = { ...formData, [activeItem]: success };
      setFormData(updatedData);
      setDirty(true);
      const saved = await handleSave(updatedData);
      if (saved) {
        if (success) {
          toast.success(
            "Tebrikler! Ortak dikkat değerlendirmesi başarıyla tamamlandı. 🎉",
          );
        } else {
          toast.info("Değerlendirme kaydedildi. Henüz bağımsız düzeyde değil.");
        }
      }
    }
    setActiveItem(null);
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(
      (item) => formData[item] === true,
    ).length;
    return Math.round((completedCount / items.length) * 100);
  };

  const progress = calculateProgress();

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );

  if (activeItem) {
    const firstSpaceIndex = activeItem.indexOf(" ");
    const code = activeItem.substring(0, firstSpaceIndex);
    const text = activeItem.substring(firstSpaceIndex + 1);

    if (activeItem.includes("1.1")) {
      return (
        <OrtakDikkat1
          itemCode={code}
          itemText={text}
          onClose={() => setActiveItem(null)}
          onComplete={handleSessionSave}
        />
      );
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (dirty) setShowLeaveDialog(true);
              else onBack();
            }}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-white">
              Ortak Dikkat Becerileri
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span>%{progress} Tamamlandı</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 min-w-[7.5rem]">
          <Button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 h-8 text-xs shadow-lg shadow-green-900/20 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-2 h-3.5 w-3.5" />
            )}
            {isSaving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          {saveBanner === "ok" && (
            <span className="text-[11px] font-semibold text-emerald-400">
              ✓ Kaydedildi
            </span>
          )}
          {saveBanner === "err" && (
            <span className="text-[11px] font-semibold text-red-400">
              ✕ Kaydedilemedi
            </span>
          )}
          {dirty && !saveBanner && !isSaving && (
            <span className="text-[10px] text-amber-400/90">Kaydedilmedi</span>
          )}
        </div>
      </div>

      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Kaydedilmemiş değişiklikler
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Yaptığınız değişiklikler kaydedilmedi. Çıkarsanız bu işaretlemeler
              kaybolur.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                className="flex-1 text-slate-300 hover:text-white"
                onClick={() => setShowLeaveDialog(false)}
              >
                Hayır, kal
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                onClick={() => {
                  setShowLeaveDialog(false);
                  setDirty(false);
                  onBack();
                }}
              >
                Evet, çık
              </Button>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-500 text-white"
              disabled={isSaving}
              onClick={async () => {
                const ok = await handleSave();
                if (ok) {
                  setShowLeaveDialog(false);
                  onBack();
                }
              }}
            >
              Kaydet ve çık
            </Button>
          </div>
        </div>
      )}

      {/* LISTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
          const status = formData[item];

          // Kod ve Metin Ayırma
          const firstSpaceIndex = item.indexOf(" ");
          const code = item.substring(0, firstSpaceIndex);
          const text = item.substring(firstSpaceIndex + 1);

          const isPassed = status === true;
          const isFailed = status === false;
          const hasTest = item.includes("1.1");

          return (
            <div
              key={item}
              className={twMerge(
                "group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                isPassed &&
                  "bg-green-950/15 border-green-500/15 opacity-45 hover:opacity-80",
                isFailed &&
                  "bg-red-950/30 border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.15)] hover:border-red-400/70 hover:bg-red-950/40",
                !isPassed &&
                  !isFailed &&
                  "bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700",
              )}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={twMerge(
                    "min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border mt-0.5 px-1 text-center shrink-0",
                    isPassed &&
                      "bg-green-500/15 border-green-500/40 text-green-400/80",
                    isFailed && "bg-red-500/25 border-red-500 text-red-300",
                    !isPassed &&
                      !isFailed &&
                      "bg-slate-950 border-slate-700 text-slate-500",
                  )}
                >
                  {isPassed ? (
                    <Trophy size={18} />
                  ) : isFailed ? (
                    <XCircle size={18} />
                  ) : (
                    code
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={twMerge(
                      "font-medium text-sm leading-relaxed",
                      isPassed && "text-green-100/70",
                      isFailed && "text-red-100",
                      !isPassed && !isFailed && "text-slate-200",
                    )}
                  >
                    {text}
                  </p>
                  {isPassed && (
                    <span className="text-[10px] text-green-500/60 font-semibold uppercase tracking-wider">
                      Geçti · tekrar değerlendirilebilir
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-[10px] text-red-400/90 font-semibold uppercase tracking-wider">
                      Geçemedi · öncelikli
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {hasTest && (
                  <button
                    onClick={() => setActiveItem(item)}
                    className={twMerge(
                      "h-9 px-3 mr-2 rounded-lg text-white text-[10px] font-bold flex items-center gap-1.5 border shadow-sm transition-all active:scale-95",
                      isPassed &&
                        "bg-blue-600/50 border-blue-400/40 hover:bg-blue-600/80",
                      isFailed &&
                        "bg-blue-600 border-blue-400 hover:bg-blue-500 ring-1 ring-blue-400/30",
                      !isPassed &&
                        !isFailed &&
                        "bg-blue-600/90 border-blue-400 hover:bg-blue-500",
                    )}
                  >
                    <ClipboardCheck size={16} />
                    <span className="hidden sm:inline">DEĞERLENDİR</span>
                  </button>
                )}
                <button
                  onClick={() => setStatus(item, false)}
                  className={twMerge(
                    "flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95",
                    status === false
                      ? "bg-red-500/25 border-red-500 text-red-400"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-red-400",
                  )}
                  title="Yapamıyor"
                >
                  <XCircle size={18} />
                </button>

                <button
                  onClick={() => setStatus(item, true)}
                  className={twMerge(
                    "flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95",
                    status === true
                      ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-green-400 hover:border-green-500/50",
                  )}
                  title="Bağımsız Yapıyor"
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
