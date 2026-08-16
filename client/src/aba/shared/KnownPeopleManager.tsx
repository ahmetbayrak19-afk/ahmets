import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  GraduationCap,
  Heart,
  Loader2,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { db, storage } from '@/firebase';

export type KnownPersonCategory = 'ogretmen' | 'aile' | 'tanidik' | 'arkadas';

export interface KnownPersonProfile {
  id: string;
  name: string;
  category: KnownPersonCategory;
  imageUrl: string;
  storagePath?: string;
  isDummy?: boolean;
}

export const KNOWN_PERSON_CATEGORIES: Array<{
  id: KnownPersonCategory;
  label: string;
  icon: typeof User;
  color: string;
  iconColor: string;
}> = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'border-blue-900 bg-blue-950/20', iconColor: 'text-blue-400' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'border-red-900 bg-red-950/20', iconColor: 'text-red-400' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'border-green-900 bg-green-950/20', iconColor: 'text-green-400' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'border-orange-900 bg-orange-950/20', iconColor: 'text-orange-400' },
];

const isKnownCategory = (value: unknown): value is KnownPersonCategory =>
  KNOWN_PERSON_CATEGORIES.some((category) => category.id === value);

export function useKnownPeople(studentId: string) {
  const [profiles, setProfiles] = useState<KnownPersonProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    if (!institutionId || !studentId) {
      setLoading(false);
      return;
    }

    const peopleCollection = collection(
      db,
      'institutions',
      institutionId,
      'students',
      studentId,
      'knownPeople',
    );

    return onSnapshot(
      peopleCollection,
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((personDocument) => {
            const data = personDocument.data();
            return {
              id: personDocument.id,
              name: String(data.name || ''),
              category: data.category,
              imageUrl: String(data.imageUrl || ''),
              storagePath: data.storagePath ? String(data.storagePath) : undefined,
              isDummy: false,
            };
          })
          .filter(
            (profile): profile is KnownPersonProfile =>
              Boolean(profile.name) &&
              Boolean(profile.imageUrl) &&
              isKnownCategory(profile.category),
          )
          .sort((first, second) =>
            first.category.localeCompare(second.category, 'tr-TR') ||
            first.name.localeCompare(second.name, 'tr-TR'),
          );

        setProfiles(nextProfiles);
        setLoading(false);
      },
      (error) => {
        console.error('Kişiler yüklenemedi:', error);
        setLoading(false);
        toast.error('Kişi kayıtları yüklenemedi.');
      },
    );
  }, [studentId]);

  return { profiles, loading };
}

interface KnownPeopleManagerProps {
  studentId: string;
  profiles: KnownPersonProfile[];
  loading?: boolean;
  initialCategory?: KnownPersonCategory;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  returnLabel?: string;
  onReturn?: () => void;
}

const resizeImage = (source: HTMLImageElement | HTMLVideoElement) => {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return '';

  const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!sourceWidth || !sourceHeight) return '';

  const ratio = Math.max(size / sourceWidth, size / sourceHeight);
  const width = sourceWidth * ratio;
  const height = sourceHeight * ratio;
  context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL('image/jpeg', 0.8);
};

export default function KnownPeopleManager({
  studentId,
  profiles,
  loading = false,
  initialCategory = 'ogretmen',
  title = 'Kişi Ekleme',
  showBackButton = false,
  onBack,
  returnLabel,
  onReturn,
}: KnownPeopleManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<KnownPersonCategory>(initialCategory);
  const [personName, setPersonName] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setSelectedCategory(initialCategory), [initialCategory]);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Bu cihazda kamera açılamadı. Galeriden fotoğraf seçebilirsiniz.');
      return;
    }

    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (error) {
      console.error('Kamera açılamadı:', error);
      setCameraActive(false);
      toast.error('Kamera açılamadı. Kamera iznini kontrol edin.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const resized = resizeImage(videoRef.current);
    if (!resized) {
      toast.error('Fotoğraf hazırlanamadı. Tekrar deneyin.');
      return;
    }
    setPreviewImage(resized);
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const resized = resizeImage(image);
        if (!resized) {
          toast.error('Fotoğraf hazırlanamadı.');
          return;
        }
        stopCamera();
        setPreviewImage(resized);
      };
      image.onerror = () => toast.error('Fotoğraf açılamadı.');
      image.src = String(reader.result || '');
    };
    reader.onerror = () => toast.error('Fotoğraf okunamadı.');
    reader.readAsDataURL(file);
  };

  const savePerson = async () => {
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    const cleanName = personName.trim();
    const categoryProfiles = profiles.filter((profile) => profile.category === selectedCategory);

    if (!institutionId || !studentId) {
      toast.error('Öğrenci veya kurum bilgisi bulunamadı.');
      return;
    }
    if (categoryProfiles.length >= 10) {
      toast.error('Bu bölümde en fazla 10 kişi olabilir.');
      return;
    }
    if (!cleanName || !previewImage) {
      toast.warning('İsim yazın ve fotoğraf ekleyin.');
      return;
    }
    if (categoryProfiles.some((profile) =>
      profile.name.trim().toLocaleLowerCase('tr-TR') === cleanName.toLocaleLowerCase('tr-TR')
    )) {
      toast.info('Bu kişi ilgili bölümde zaten kayıtlı.');
      return;
    }

    setSaving(true);
    const personId = crypto.randomUUID();
    const photoPath = `institutions/${institutionId}/students/${studentId}/knownPeople/${personId}.jpg`;
    const photoReference = storageRef(storage, photoPath);

    try {
      const response = await fetch(previewImage);
      const photoBlob = await response.blob();
      await uploadBytes(photoReference, photoBlob, {
        contentType: 'image/jpeg',
        customMetadata: { institutionId, studentId },
      });
      const imageUrl = await getDownloadURL(photoReference);

      await setDoc(doc(
        db,
        'institutions',
        institutionId,
        'students',
        studentId,
        'knownPeople',
        personId,
      ), {
        name: cleanName,
        category: selectedCategory,
        imageUrl,
        storagePath: photoPath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setPersonName('');
      setPreviewImage(null);
      toast.success(`${cleanName} kaydedildi.`);
    } catch (error) {
      console.error('Kişi kaydedilemedi:', error);
      await deleteObject(photoReference).catch(() => {});
      toast.error('Kişi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const removePerson = async (profile: KnownPersonProfile) => {
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    if (!institutionId || !studentId) {
      toast.error('Öğrenci veya kurum bilgisi bulunamadı.');
      return;
    }

    setDeletingId(profile.id);
    try {
      await deleteDoc(doc(
        db,
        'institutions',
        institutionId,
        'students',
        studentId,
        'knownPeople',
        profile.id,
      ));
      if (profile.storagePath) {
        await deleteObject(storageRef(storage, profile.storagePath)).catch((error) => {
          console.error('Kişi fotoğrafı silinemedi:', error);
        });
      }
      toast.success('Kişi silindi.');
    } catch (error) {
      console.error('Kişi silinemedi:', error);
      toast.error('Kişi silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleProfiles = profiles.filter((profile) => profile.category === selectedCategory);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      {(showBackButton || title) && (
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 p-3">
          {showBackButton && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-slate-800 p-2 text-slate-300 active:scale-95"
              aria-label="Geri dön"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs text-slate-400">Eklenen kişiler iki kazanımda da kullanılır.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KNOWN_PERSON_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const count = profiles.filter((profile) => profile.category === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
                    selectedCategory === category.id
                      ? `${category.color} ring-1 ring-white/20`
                      : 'border-slate-800 bg-slate-900/70'
                  }`}
                >
                  <Icon size={20} className={category.iconColor} />
                  <p className="mt-2 text-xs font-bold text-slate-200">{category.label}</p>
                  <p className="text-[11px] text-slate-500">{count}/10 kişi</p>
                </button>
              );
            })}
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <h2 className="mb-3 text-sm font-bold text-slate-200">Yeni kişi</h2>
            <div className="grid grid-cols-[112px_1fr] gap-3">
              <div className="aspect-square overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-950">
                {cameraActive ? (
                  <div className="relative h-full w-full">
                    <video ref={videoRef} autoPlay playsInline className="h-full w-full scale-x-[-1] object-cover" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white p-2"
                      aria-label="Fotoğraf çek"
                    >
                      <span className="block h-5 w-5 rounded-full border-2 border-white bg-red-600" />
                    </button>
                  </div>
                ) : previewImage ? (
                  <div className="relative h-full w-full">
                    <img src={previewImage} alt="Yeni kişi önizlemesi" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                      aria-label="Fotoğrafı kaldır"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <User size={34} />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <input
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  disabled={saving}
                  placeholder="Kişinin adı"
                  className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={startCamera} disabled={saving} className="border-slate-700 bg-slate-800 text-slate-200">
                    <Camera size={16} className="mr-1.5" /> Kamera
                  </Button>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving} className="border-slate-700 bg-slate-800 text-slate-200">
                    <Upload size={16} className="mr-1.5" /> Galeri
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {cameraActive ? (
                  <Button type="button" variant="ghost" onClick={stopCamera} className="h-9 text-red-400">Kamerayı kapat</Button>
                ) : (
                  <Button type="button" onClick={savePerson} disabled={saving} className="h-10 bg-emerald-600 font-bold hover:bg-emerald-500">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : 'KİŞİYİ KAYDET'}
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300">
                {KNOWN_PERSON_CATEGORIES.find((category) => category.id === selectedCategory)?.label}
              </h2>
              <span className="text-xs text-slate-500">{visibleProfiles.length} kişi</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-400" /></div>
            ) : visibleProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
                Bu bölüme henüz kişi eklenmedi.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleProfiles.map((profile) => (
                  <div key={profile.id} className="relative rounded-xl border border-slate-800 bg-slate-900 p-2">
                    <img src={profile.imageUrl} alt={profile.name} className="aspect-square w-full rounded-lg object-cover" />
                    <p className="mt-2 truncate text-center text-xs font-bold">{profile.name}</p>
                    <button
                      type="button"
                      disabled={deletingId === profile.id}
                      onClick={() => removePerson(profile)}
                      className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1.5 text-white disabled:opacity-50"
                      aria-label={`${profile.name} kişisini sil`}
                    >
                      {deletingId === profile.id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {returnLabel && onReturn && profiles.length > 0 && (
            <Button type="button" onClick={onReturn} className="w-full bg-blue-600 py-6 font-bold hover:bg-blue-500">
              {returnLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
