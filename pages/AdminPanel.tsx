import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Loader2, DatabaseZap, Sparkles, GripVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { ABA_MODULES } from '../../../shared/abaData';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Achievement {
  id: string;
  name: string;
  order: number;
}

interface Module {
  id: string;
  name: string;
  order: number;
  achievements: Achievement[];
}

export default function AdminPanel() {
  const [_, setLocation] = useLocation();
  const { currentTeacher } = useStudentData();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  
  const [newModuleName, setNewModuleName] = useState('');
  const [newAchievementName, setNewAchievementName] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = localStorage.getItem("kazanim-takip-institution-id");
    if (id) setInstitutionId(id);
  }, []);

  const isAdmin = currentTeacher?.name?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!institutionId || !isAdmin) return;

    const modulesRef = collection(db, "institutions", institutionId, "modules");
    const q = query(modulesRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const moduleData = await Promise.all(snapshot.docs.map(async (modDoc) => {
        const achRef = collection(db, "institutions", institutionId, "modules", modDoc.id, "achievements");
        const achSnap = await getDocs(query(achRef, orderBy("order", "asc")));
        
        return {
          id: modDoc.id,
          ...modDoc.data(),
          achievements: achSnap.docs.map(a => ({ id: a.id, ...a.data() } as Achievement))
        } as Module;
      }));
      setModules(moduleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [institutionId, isAdmin]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const moduleId = source.droppableId;
    const updatedModules = [...modules];
    const modIndex = updatedModules.findIndex(m => m.id === moduleId);
    if (modIndex === -1) return;
    const newAchievements = Array.from(updatedModules[modIndex].achievements);
    const [movedItem] = newAchievements.splice(source.index, 1);
    newAchievements.splice(destination.index, 0, movedItem);
    const reordered = newAchievements.map((item, index) => ({ ...item, order: index }));
    updatedModules[modIndex].achievements = reordered;
    setModules(updatedModules);
    try {
      const batch = writeBatch(db);
      reordered.forEach(ach => {
        const ref = doc(db, "institutions", institutionId!, "modules", moduleId, "achievements", ach.id);
        batch.update(ref, { order: ach.order });
      });
      await batch.commit();
    } catch (error) { toast.error("Sıralama kaydedilemedi"); }
  };

  const handleAddModule = async () => {
    if (!newModuleName.trim() || !institutionId) return;
    try {
      await addDoc(collection(db, "institutions", institutionId, "modules"), {
        name: newModuleName.trim(),
        order: modules.length,
        createdAt: new Date().toISOString()
      });
      setNewModuleName('');
      toast.success("Modül eklendi");
    } catch (e) { toast.error("Hata"); }
  };

  const handleAddAchievement = async (moduleId: string) => {
    const achName = newAchievementName[moduleId];
    if (!achName?.trim() || !institutionId) return;
    const tempId = "temp-" + Date.now();
    const targetModuleIndex = modules.findIndex(m => m.id === moduleId);
    if (targetModuleIndex === -1) return;
    const currentOrder = modules[targetModuleIndex].achievements.length;
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return { ...m, achievements: [...m.achievements, { id: tempId, name: achName.trim(), order: currentOrder }] };
      }
      return m;
    }));
    setNewAchievementName(prev => ({ ...prev, [moduleId]: '' }));
    try {
      const docRef = await addDoc(collection(db, "institutions", institutionId, "modules", moduleId, "achievements"), {
        name: achName.trim(),
        order: currentOrder,
        createdAt: new Date().toISOString()
      });
      setModules(prev => prev.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            achievements: m.achievements.map(ach => 
              ach.id === tempId ? { ...ach, id: docRef.id } : ach
            )
          };
        }
        return m;
      }));
      toast.success("Kazanım eklendi");
    } catch (e) { toast.error("Hata"); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!institutionId) return;
    setModules(prev => prev.filter(m => m.id !== moduleId));
    try {
      await deleteDoc(doc(db, "institutions", institutionId, "modules", moduleId));
      toast.success("Modül silindi");
    } catch (e) { toast.error("Hata"); }
  };

  const handleDeleteAchievement = async (moduleId: string, achievementId: string) => {
    if (!institutionId) return;
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return { ...m, achievements: m.achievements.filter(a => a.id !== achievementId) };
      }
      return m;
    }));
    try {
      await deleteDoc(doc(db, "institutions", institutionId, "modules", moduleId, "achievements", achievementId));
      toast.success("Kazanım silindi");
    } catch (e) { toast.error("Hata"); }
  };

  const handleAutoLoadABA = async () => {
    if (!institutionId) return;
    setProcessing(true);
    const toastId = toast.loading("Müfredat yükleniyor...");
    try {
      const batch = writeBatch(db);
      for (const mod of modules) {
        for (const ach of mod.achievements) {
          batch.delete(doc(db, "institutions", institutionId, "modules", mod.id, "achievements", ach.id));
        }
        batch.delete(doc(db, "institutions", institutionId, "modules", mod.id));
      }
      ABA_MODULES.forEach((abaMod, modIdx) => {
        const newModRef = doc(collection(db, "institutions", institutionId, "modules"));
        batch.set(newModRef, { name: abaMod.name, order: modIdx, createdAt: new Date().toISOString() });
        abaMod.achievements.forEach((achName, achIdx) => {
          const newAchRef = doc(collection(db, "institutions", institutionId, "modules", newModRef.id, "achievements"));
          batch.set(newAchRef, { name: achName, order: achIdx, createdAt: new Date().toISOString() });
        });
      });
      await batch.commit();
      toast.success("Yüklendi", { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) { toast.error(e.message, { id: toastId }); } finally { setProcessing(false); }
  };

  if (!isAdmin) return <div className="p-10 text-center text-white">Admin yetkisi gerekli.</div>;
  if (loading) return <div className="flex h-screen items-center justify-center bg-[#020617] text-blue-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      <header className="border-b border-white/10 p-4 flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-bold">Müfredat Yönetimi</h1>
        </div>
        <div className="text-xs text-green-400 font-mono border border-green-900/50 bg-green-900/10 px-2 py-1 rounded">ADMIN</div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-blue-400 mb-1"><DatabaseZap size={16} /> <span className="text-[10px] font-bold uppercase">Şablonlar</span></div>
              <CardTitle className="text-sm font-bold">ABA Müfredatı Yükle</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={processing} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 h-9 text-xs">
                    {processing ? <Loader2 className="animate-spin mr-2 w-3 h-3" /> : <Sparkles className="mr-2 w-3 h-3" />}
                    Sıfırla ve Yükle
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                  <AlertDialogHeader><AlertDialogTitle>Onaylıyor musunuz?</AlertDialogTitle><AlertDialogDescription>Tüm veriler silinip ABA yüklenecek.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 text-white border-none">İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAutoLoadABA} className="bg-blue-600">Onayla</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 border-t-4 border-t-blue-600">
            <CardHeader className="pb-3"><CardTitle className="text-base text-blue-400 uppercase tracking-wider">Yeni Modül</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Modül Adı" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} className="bg-slate-950 border-slate-800 h-9 text-sm" />
              <Button onClick={handleAddModule} className="bg-blue-600 hover:bg-blue-700 h-9">Ekle</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DragDropContext onDragEnd={onDragEnd}>
            {modules.map((mod) => (
              <Card key={mod.id} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                <div className="bg-slate-800/50 p-4 flex justify-between items-center border-b border-white/5">
                  <h3 className="font-bold text-blue-400 uppercase tracking-tight">{mod.name}</h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><button className="p-2 text-red-500 hover:bg-red-950 rounded"><Trash2 size={18} /></button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                      <AlertDialogHeader><AlertDialogTitle>Modülü Sil?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white border-none">İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteModule(mod.id)} className="bg-red-600">Sil</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <CardContent className="p-4 space-y-4">
                  <Droppable droppableId={mod.id}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {mod.achievements?.map((ach, index) => (
                          <Draggable key={ach.id} draggableId={ach.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: snapshot.isDragging ? '#1e293b' : 'rgba(2, 6, 23, 0.4)',
                                  boxShadow: snapshot.isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : 'none',
                                  borderColor: snapshot.isDragging ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                                }}
                                className="flex justify-between items-center p-3 rounded border transition-all select-none group"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="p-1 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={16} className={snapshot.isDragging ? "text-blue-500" : "text-slate-700 group-hover:text-blue-500"} />
                                  </div>
                                  <span className={`text-sm ${snapshot.isDragging ? 'text-white font-medium' : 'text-slate-300'}`}>
                                    {ach.name}
                                  </span>
                                </div>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><button className="p-2 text-slate-600 hover:text-red-500 ml-2"><Trash2 size={16} /></button></AlertDialogTrigger>
                                  <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                                    <AlertDialogHeader><AlertDialogTitle>Sil?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-slate-800 text-white border-none">İptal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteAchievement(mod.id, ach.id)} className="bg-red-600">Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="flex gap-2 pt-2 border-t border-white/5 mt-4">
                    <Input 
                      placeholder="Yeni kazanım..." 
                      value={newAchievementName[mod.id] || ''} 
                      onChange={(e) => setNewAchievementName(prev => ({ ...prev, [mod.id]: e.target.value }))}
                      className="h-9 bg-slate-950 border-slate-800 text-sm"
                      onKeyDown={(e) => { if(e.key === 'Enter') handleAddAchievement(mod.id); }}
                    />
                    <Button size="sm" onClick={() => handleAddAchievement(mod.id)} className="bg-slate-800 hover:bg-slate-700 h-9"><Plus size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </DragDropContext>
        </div>
      </main>
    </div>
  );
    }
            
