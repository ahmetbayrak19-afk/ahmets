import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { CalendarDays, Loader2, NotebookPen, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatStudentName } from '@/lib/studentName';
import LogoLoader from '@/components/LogoLoader';

const NOTE_MAX_LENGTH = 1000;
// Match the Firestore TTL policy: notes / createdAt / expiration offset 365 days.
// TTL is enabled once in Cloud Console; this filter hides expired notes while deletion is pending.
const NOTE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

type StudentSummary = { id: string; name: string };
type StudentNote = {
  id: string;
  text: string;
  teacherName: string;
  createdAt?: { toDate?: () => Date } | Date | string | null;
};

const formatNoteDate = (value: StudentNote['createdAt']) => {
  if (!value) return 'Şimdi';
  const date = typeof value === 'object' && 'toDate' in value && value.toDate
    ? value.toDate()
    : value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) return 'Tarih yükleniyor';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const isCurrentNote = (note: StudentNote, now: number) => {
  const value = note.createdAt;
  if (!value) return true; // Pending server timestamp: do not hide a newly submitted note.
  const date = typeof value === 'object' && 'toDate' in value && value.toDate
    ? value.toDate()
    : value instanceof Date ? value : new Date(value as string);
  return !Number.isNaN(date.getTime()) && date.getTime() + NOTE_RETENTION_MS > now;
};

export default function StudentNotesDialog({ student, teacherName, onClose }: {
  student: StudentSummary | null;
  teacherName: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(Date.now());
  const saveLock = useRef(false);

  useEffect(() => {
    if (!student) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [student?.id]);

  useEffect(() => {
    setNotes([]);
    setText('');
    setLoadError('');
    setIsLoading(false);
    if (!student) return;
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    if (!institutionId) {
      setLoadError('Kurum oturumu bulunamadı.');
      toast.error('Kurum oturumu bulunamadı.');
      return;
    }
    setIsLoading(true);
    let active = true;
    const notesRef = collection(db, 'institutions', institutionId, 'students', student.id, 'notes');
    const unsubscribe = onSnapshot(query(notesRef, orderBy('createdAt', 'desc')), snapshot => {
      if (!active) return;
      setNotes(snapshot.docs.map(note => ({ id: note.id, ...note.data() } as StudentNote)));
      setNow(Date.now());
      setIsLoading(false);
    }, error => {
      if (!active) return;
      console.error('Öğrenci notları yüklenemedi:', error);
      setIsLoading(false);
      setLoadError('Notlar yüklenemedi. Pencereyi kapatıp tekrar açın.');
      toast.error('Notlar yüklenemedi.');
    });
    return () => { active = false; unsubscribe(); };
  }, [student?.id]);

  const saveNote = async () => {
    const cleanText = text.trim();
    if (!student || !cleanText || saveLock.current) return;
    if (cleanText.length > NOTE_MAX_LENGTH) {
      toast.error(`Bir not en fazla ${NOTE_MAX_LENGTH} karakter olabilir.`);
      return;
    }
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    if (!institutionId || !teacherName) {
      toast.error('Öğretmen veya kurum oturumu bulunamadı.');
      return;
    }
    saveLock.current = true;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'institutions', institutionId, 'students', student.id, 'notes'), {
        text: cleanText, teacherName, createdAt: serverTimestamp(),
      });
      setText('');
      toast.success('Not kaydedildi.');
    } catch (error) {
      console.error('Öğrenci notu kaydedilemedi:', error);
      toast.error('Not kaydedilemedi. Bağlantınızı kontrol edin.');
    } finally {
      saveLock.current = false;
      setIsSaving(false);
    }
  };

  const visibleNotes = notes.filter(note => isCurrentNote(note, now));

  return (
    <Dialog open={Boolean(student)} onOpenChange={open => { if (!open && !saveLock.current) onClose(); }}>
      <DialogContent className="flex max-h-[88vh] max-w-xl flex-col border-slate-700 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><NotebookPen className="h-5 w-5 text-amber-400" /> Öğrenci Notları</DialogTitle>
          <DialogDescription className="text-slate-400">{formatStudentName(student?.name || '')} hakkında öğretmen notları · Son 365 gün</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <UserRound className="h-4 w-4 text-blue-400" />
            <span>Notu yazan: <strong className="text-slate-200">{teacherName}</strong></span>
            <span className="ml-auto">Tarih otomatik eklenir</span>
          </div>
          <textarea
            aria-label="Öğrenci notu"
            value={text}
            maxLength={NOTE_MAX_LENGTH}
            rows={4}
            disabled={isSaving}
            onChange={event => setText(event.target.value)}
            placeholder="Öğrenciyle ilgili güncel bilgiyi veya gözleminizi yazın…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-500">{text.length}/{NOTE_MAX_LENGTH}</span>
            <Button type="button" size="sm" disabled={!text.trim() || text.length > NOTE_MAX_LENGTH || isSaving} onClick={saveNote} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSaving ? 'Kaydediliyor…' : 'Notu Kaydet'}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading && <LogoLoader />}
          {loadError && <p role="alert" className="py-4 text-sm text-red-300">{loadError}</p>}
          {!isLoading && !loadError && visibleNotes.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 py-10 text-center text-sm text-slate-500">Son 365 gün içinde kaydedilmiş not yok.</div>}
          {!isLoading && !loadError && visibleNotes.map(note => (
            <article key={note.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-blue-300"><UserRound className="h-3.5 w-3.5" />{note.teacherName || 'Öğretmen'}</span>
                <span className="flex items-center gap-1.5 text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{formatNoteDate(note.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{note.text}</p>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
