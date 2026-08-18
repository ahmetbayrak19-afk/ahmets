import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  GraduationCap,
  Heart,
  Loader2,
  Settings,
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
import { associateCurrentTeacherWithStudent } from '@/lib/studentTeacherAssociation';

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
  const [view, setView] = useState<'menu' | 'edit'>('menu');
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
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
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
      await associateCurrentTeacherWithStudent(studentId);

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
      await associateCurrentTeacherWithStudent(studentId);
      toast.success('Kişi silindi.');
    } catch (error) {
      console.error('Kişi silinemedi:', error);
      toast.error('Kişi silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleProfiles = profiles.filter((profile) => profile.category === selectedCategory);
  const selectedCategoryInfo = KNOWN_PERSON_CATEGORIES.find(
    (category) => category.id === selectedCategory,
  );

  const resetEditor = () => {
    stopCamera();
    setPersonName('');
    setPreviewImage(null);
  };

  const openCategory = (category: KnownPersonCategory) => {
    resetEditor();
    setSelectedCategory(category);
    setView('edit');
  };

  const handleBack = () => {
    if (view === 'edit') {
      resetEditor();
      setView('menu');
      return;
    }
    onBack?.();
  };

  const showInternalHeader = showBackButton || Boolean(title);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      {showInternalHeader && (
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 p-3">
          {(showBackButton || view === 'edit') && (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full bg-slate-800 p-2 text-slate-300 active:scale-95"
              aria-label="Geri dön"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg font-bold">{view === 'menu' ? 'İnsan Tanıma' : 'Kişi Ekle'}</h1>
        </div>
      )}

      {view === 'menu' && (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-2 content-start gap-4">
            {KNOWN_PERSON_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const count = profiles.filter((profile) => profile.category === category.id).length;
              return (
                <div
                  key={category.id}
                  className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-slate-900/60 p-4 shadow-lg ${category.color}`}
                >
                  <div className={`rounded-full border border-slate-800 bg-slate-900 p-3 ${category.iconColor}`}>
                    <Icon size={32} />
                  </div>
                  <div className="text-center">
                    <span className="block text-3xl font-black text-white">{count}/10</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{category.label}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openCategory(category.id)}
                    className="mt-2 h-8 rounded-full border border-slate-700 bg-slate-800 px-4 text-xs hover:bg-slate-700"
                  >
                    <Settings size={14} className="mr-1" /> DÜZENLE
                  </Button>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-400" /></div>
          )}

          {returnLabel && onReturn && profiles.length > 0 && (
            <Button type="button" onClick={onReturn} className="mx-auto mt-4 w-full max-w-md bg-blue-600 py-6 font-bold hover:bg-blue-500">
              {returnLabel}
            </Button>
          )}
        </div>
      )}

      {view === 'edit' && (
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4">
          <div className="mx-auto mb-4 max-w-md rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Seçilen bölüm</p>
            <p className={`mt-1 font-black ${selectedCategoryInfo?.iconColor}`}>{selectedCategoryInfo?.label}</p>
          </div>

          <div className="mx-auto grid max-w-md grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-3">
            <div className="flex min-h-[180px] flex-col gap-2 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900 p-2">
              {cameraActive ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                  <video ref={videoRef} autoPlay playsInline className="h-full w-full scale-x-[-1] object-cover" />
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white p-2"
                    aria-label="Fotoğraf çek"
                  >
                    <span className="block h-6 w-6 rounded-full border-2 border-white bg-red-600" />
                  </button>
                </div>
              ) : previewImage ? (
                <div className="relative aspect-square w-full">
                  <img src={previewImage} alt="Yeni kişi önizlemesi" className="h-full w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Fotoğrafı kaldır"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative flex flex-1 flex-col justify-center gap-2">
                  <Button type="button" onClick={startCamera} variant="outline" disabled={saving} className="h-10 bg-slate-800 text-slate-300">
                    <Camera size={16} className="mr-2" /> Kamera
                  </Button>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" disabled={saving} className="h-10 bg-slate-800 text-slate-300">
                    <Upload size={16} className="mr-2" /> Yükle
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {!cameraActive ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={personName}
                    onChange={(event) => setPersonName(event.target.value)}
                    disabled={saving}
                    placeholder="İsim"
                    className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-center disabled:opacity-50"
                  />
                  <Button type="button" onClick={savePerson} disabled={saving} size="sm" className="bg-green-600 font-bold disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : 'KAYDET'}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={stopCamera} className="text-xs text-red-400">İptal</Button>
              )}
            </div>

            {visibleProfiles.map((profile) => (
              <div key={profile.id} className="relative rounded-xl border border-slate-800 bg-slate-900 p-2">
                <img src={profile.imageUrl} alt={profile.name} className="aspect-square w-full rounded-lg object-cover" />
                <p className="mt-1 truncate text-center text-xs font-bold">{profile.name}</p>
                <button
                  type="button"
                  disabled={deletingId === profile.id}
                  onClick={() => removePerson(profile)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1.5 text-white disabled:opacity-50"
                  aria-label={`${profile.name} kişisini sil`}
                >
                  {deletingId === profile.id ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
