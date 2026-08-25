import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, CheckCircle2, Headphones, RotateCw, Save, Volume2 } from "lucide-react";
import * as THREE from "three";

import agizNerede from "./agiznerede.mp3";
import alinNerede from "./alinnerede.mp3";
import ayakNerede from "./ayaknerede.mp3";
import bacakNerede from "./bacaknerede.mp3";
import belNerede from "./belnerede.mp3";
import boyunNerede from "./boyunnerede.mp3";
import burunNerede from "./burunnerede.mp3";
import ceneNerede from "./cenenerede.mp3";
import degerlendirmeGiris from "./degerlendirmegiris.mp3";
import dizNerede from "./diznerede.mp3";
import elNerede from "./elnerede.mp3";
import enseNerede from "./ensenerede.mp3";
import gogusNerede from "./gogusnerede.mp3";
import gozNerede from "./goznerede.mp3";
import kafaNerede from "./kafanerede.mp3";
import karinNerede from "./karinnerede.mp3";
import kasNerede from "./kasnerede.mp3";
import kolNerede from "./kolnerede.mp3";
import kulakNerede from "./kulaknerede.mp3";
import omuzNerede from "./omuznerede.mp3";
import ozelBolgeNerede from "./ozelbolgenerede.mp3";
import parmakNerede from "./parmaknerede.mp3";
import sacNerede from "./sacnerede.mp3";
import sirtNerede from "./sirtnerede.mp3";
import tirnakNerede from "./tirnaknerede.mp3";
import yanakNerede from "./yanaknerede.mp3";

const PUBLIC_ASSET_BASE = new URL("/assets/public/", window.location.origin).toString();
const MODEL_PATH = new URL("models/human.glb", PUBLIC_ASSET_BASE).toString();
const TRIAL_COUNT = 10;
const PASS_SCORE = 8;

type Phase = "menu" | "intro" | "asking" | "finished";
type FocusArea = "face" | "upper" | "hands" | "lower" | "feet" | "back" | "full";
type QuestionGroup = "face" | "upper" | "lower" | "back";

type Question = {
  key: string;
  label: string;
  audioUrl: string;
  acceptNames: string[];
  focus: FocusArea;
  group: QuestionGroup;
};

const FACE_PARTS = ["kafa", "sac", "alin", "kas", "goz", "burun", "yanak", "kulak", "agiz", "cene"];

const QUESTIONS: Question[] = [
  { key: "sac", label: "Saç", audioUrl: sacNerede, acceptNames: ["sac"], focus: "face", group: "face" },
  { key: "alin", label: "Alın", audioUrl: alinNerede, acceptNames: ["alin"], focus: "face", group: "face" },
  { key: "kas", label: "Kaş", audioUrl: kasNerede, acceptNames: ["kas"], focus: "face", group: "face" },
  { key: "goz", label: "Göz", audioUrl: gozNerede, acceptNames: ["goz"], focus: "face", group: "face" },
  { key: "burun", label: "Burun", audioUrl: burunNerede, acceptNames: ["burun"], focus: "face", group: "face" },
  { key: "yanak", label: "Yanak", audioUrl: yanakNerede, acceptNames: ["yanak"], focus: "face", group: "face" },
  { key: "kulak", label: "Kulak", audioUrl: kulakNerede, acceptNames: ["kulak"], focus: "face", group: "face" },
  { key: "agiz", label: "Ağız", audioUrl: agizNerede, acceptNames: ["agiz"], focus: "face", group: "face" },
  { key: "cene", label: "Çene", audioUrl: ceneNerede, acceptNames: ["cene"], focus: "face", group: "face" },
  { key: "kafa", label: "Kafa", audioUrl: kafaNerede, acceptNames: FACE_PARTS, focus: "face", group: "face" },
  { key: "boyun", label: "Boyun", audioUrl: boyunNerede, acceptNames: ["boyun"], focus: "upper", group: "upper" },
  { key: "omuz", label: "Omuz", audioUrl: omuzNerede, acceptNames: ["omuz"], focus: "upper", group: "upper" },
  { key: "kol", label: "Kol", audioUrl: kolNerede, acceptNames: ["kol"], focus: "upper", group: "upper" },
  { key: "el", label: "El", audioUrl: elNerede, acceptNames: ["el"], focus: "hands", group: "upper" },
  { key: "parmak", label: "Parmak", audioUrl: parmakNerede, acceptNames: ["parmak"], focus: "hands", group: "upper" },
  { key: "gogus", label: "Göğüs", audioUrl: gogusNerede, acceptNames: ["gogus"], focus: "upper", group: "upper" },
  { key: "karin", label: "Karın", audioUrl: karinNerede, acceptNames: ["karin"], focus: "upper", group: "upper" },
  { key: "bel", label: "Bel", audioUrl: belNerede, acceptNames: ["bel"], focus: "upper", group: "upper" },
  { key: "bacak", label: "Bacak", audioUrl: bacakNerede, acceptNames: ["bacak"], focus: "lower", group: "lower" },
  { key: "diz", label: "Diz", audioUrl: dizNerede, acceptNames: ["diz"], focus: "lower", group: "lower" },
  { key: "ayak", label: "Ayak", audioUrl: ayakNerede, acceptNames: ["ayak"], focus: "feet", group: "lower" },
  { key: "tirnak", label: "Tırnak", audioUrl: tirnakNerede, acceptNames: ["tirnak"], focus: "feet", group: "lower" },
  { key: "ozelbolge", label: "Özel Bölge", audioUrl: ozelBolgeNerede, acceptNames: ["ozelbolge"], focus: "lower", group: "lower" },
  { key: "ense", label: "Ense", audioUrl: enseNerede, acceptNames: ["ense"], focus: "back", group: "back" },
  { key: "sirt", label: "Sırt", audioUrl: sirtNerede, acceptNames: ["sirt"], focus: "back", group: "back" },
];

const FOCUS_NAMES: Record<FocusArea, string[]> = {
  face: ["kafa"],
  upper: ["boyun", "omuz", "kol", "gogus", "karin", "bel"],
  hands: ["el"],
  lower: ["bel", "ozelbolge", "bacak", "diz", "ayak"],
  feet: ["ayak"],
  back: ["kafa", "ense", "sirt", "bel"],
  full: [],
};

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function buildBalancedAssessment() {
  const pick = (group: QuestionGroup, count: number) =>
    shuffle(QUESTIONS.filter((question) => question.group === group)).slice(0, count);
  return shuffle([...pick("face", 4), ...pick("upper", 3), ...pick("lower", 2), ...pick("back", 1)]);
}

function useSingleAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }, []);
  const play = useCallback((url: string) => new Promise<void>((resolve) => {
    stop();
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audioRef.current = audio;
    audio.play().catch(() => resolve());
  }), [stop]);
  useEffect(() => stop, [stop]);
  return { play, stop };
}

function Loader() {
  return <Html center><div className="rounded-2xl bg-white/95 px-5 py-4 text-center shadow-xl"><div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="text-sm font-bold text-slate-800">Model hazırlanıyor…</p></div></Html>;
}

function findNamedAncestor(object: THREE.Object3D | null, acceptedNames: Set<string>) {
  let current = object;
  while (current) {
    if (acceptedNames.has(current.name)) return current;
    current = current.parent;
  }
  return null;
}

function collectMeshes(object: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  object.traverse((child) => {
    if (child !== object && (child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
  });
  return meshes;
}

function Model({ onPick, onReady }: { onPick: (object: THREE.Object3D) => void; onReady: (scene: THREE.Object3D) => void }) {
  const gltf = useGLTF(MODEL_PATH) as { scene: THREE.Object3D };
  useEffect(() => onReady(gltf.scene), [gltf.scene, onReady]);
  return <group onPointerUp={(event: any) => {
    event.stopPropagation();
    if (typeof event.delta === "number" && event.delta > 6) return;
    if (event.object) onPick(event.object);
  }}><primitive object={gltf.scene} /></group>;
}

function CameraDirector({ modelScene, focus, controlsRef }: { modelScene: THREE.Object3D | null; focus: FocusArea; controlsRef: React.MutableRefObject<any> }) {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!modelScene || !controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;
    modelScene.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    let found = false;
    const wanted = new Set(FOCUS_NAMES[focus]);
    modelScene.traverse((object) => {
      if (!wanted.has(object.name)) return;
      const partBox = new THREE.Box3().setFromObject(object);
      if (partBox.isEmpty()) return;
      box.union(partBox);
      found = true;
    });
    if (!found || box.isEmpty()) box.setFromObject(modelScene);
    const center = box.getCenter(new THREE.Vector3());
    const dimensions = box.getSize(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(size.width / size.height, 0.1));
    const byHeight = dimensions.y / (2 * Math.tan(verticalFov / 2));
    const byWidth = dimensions.x / (2 * Math.tan(horizontalFov / 2));
    const padding = focus === "face" ? 1.08 : focus === "hands" || focus === "feet" ? 1.18 : 1.28;
    const distance = Math.max(byHeight, byWidth, 0.2) * padding + dimensions.z * 0.55;
    controlsRef.current.target.copy(center);
    camera.position.set(center.x, center.y, center.z + (focus === "back" ? -distance : distance));
    camera.near = Math.max(0.01, distance / 100);
    camera.far = Math.max(100, distance * 30);
    camera.updateProjectionMatrix();
    controlsRef.current.update();
  }, [camera, controlsRef, focus, modelScene, size.height, size.width]);
  return null;
}

class ModelErrorBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function AliciGame15({ onClose, onComplete }: { onClose: () => void; onComplete?: (success: boolean) => void | Promise<void> }) {
  const controlsRef = useRef<any>(null);
  const responseLockedRef = useRef(false);
  const highlightTimersRef = useRef<number[]>([]);
  const materialSnapshotsRef = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const { play, stop } = useSingleAudio();
  const [phase, setPhase] = useState<Phase>("menu");
  const [modelScene, setModelScene] = useState<THREE.Object3D | null>(null);
  const [modelFailed, setModelFailed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [repeatUsed, setRepeatUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentQuestion = questions[questionIndex] ?? null;
  const passed = score >= PASS_SCORE;

  const clearHighlights = useCallback(() => {
    highlightTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    highlightTimersRef.current = [];
    materialSnapshotsRef.current.forEach((material, mesh) => { mesh.material = material; });
    materialSnapshotsRef.current.clear();
  }, []);
  useEffect(() => clearHighlights, [clearHighlights]);

  const highlightSelection = useCallback((object: THREE.Object3D) => {
    clearHighlights();
    collectMeshes(object).forEach((mesh) => {
      const original = mesh.material;
      materialSnapshotsRef.current.set(mesh, original);
      const cloned = Array.isArray(original) ? original.map((material) => material.clone()) : original.clone();
      mesh.material = cloned;
      (Array.isArray(cloned) ? cloned : [cloned]).forEach((material: any) => {
        if (material.emissive) {
          material.emissive.set(0xfacc15);
          material.emissiveIntensity = 0.8;
        }
      });
    });
    highlightTimersRef.current.push(window.setTimeout(clearHighlights, 380));
  }, [clearHighlights]);

  const askQuestion = useCallback(async (question: Question) => {
    setRepeatUsed(false);
    responseLockedRef.current = true;
    await play(question.audioUrl);
    responseLockedRef.current = false;
  }, [play]);

  useEffect(() => {
    if (phase === "asking" && currentQuestion) void askQuestion(currentQuestion);
  }, [askQuestion, currentQuestion, phase]);

  const startAssessment = async () => {
    if (!modelScene) return;
    setQuestions(buildBalancedAssessment());
    setQuestionIndex(0);
    setScore(0);
    setPhase("intro");
    responseLockedRef.current = true;
    await play(degerlendirmeGiris);
    setPhase("asking");
  };

  const allTargetNames = new Set(QUESTIONS.flatMap((question) => question.acceptNames));
  const handlePick = (object: THREE.Object3D) => {
    if (phase !== "asking" || !currentQuestion || responseLockedRef.current) return;
    responseLockedRef.current = true;
    const correctPart = findNamedAncestor(object, new Set(currentQuestion.acceptNames));
    const selectedPart = findNamedAncestor(object, allTargetNames) ?? object;
    highlightSelection(selectedPart);
    if (correctPart) setScore((value) => value + 1);
    window.setTimeout(() => {
      clearHighlights();
      if (questionIndex + 1 >= questions.length) {
        setPhase("finished");
        stop();
      } else setQuestionIndex((value) => value + 1);
    }, 480);
  };

  const repeatQuestion = async () => {
    if (!currentQuestion || repeatUsed || responseLockedRef.current) return;
    setRepeatUsed(true);
    responseLockedRef.current = true;
    await play(currentQuestion.audioUrl);
    responseLockedRef.current = false;
  };

  const saveAndClose = async () => {
    if (saving) return;
    setSaving(true);
    await onComplete?.(passed);
    setSaving(false);
    onClose();
  };

  const leave = () => { stop(); clearHighlights(); onClose(); };
  const focus = phase === "asking" && currentQuestion ? currentQuestion.focus : "full";

  return <div className="fixed inset-0 z-[500] flex flex-col overflow-hidden bg-slate-950">
    <div className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30">
      <button type="button" onClick={leave} aria-label="Geri dön" className="rounded-full border border-white/15 bg-slate-900/80 p-3 text-white shadow-lg backdrop-blur active:scale-95"><ArrowLeft size={23} /></button>
    </div>

    {phase === "menu" && <div className="absolute inset-x-3 bottom-4 z-30 mx-auto max-w-lg rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300"><Headphones size={24} /></div><div><h2 className="text-lg font-bold">Tüm vücut bölümlerini tanıma</h2><p className="mt-1 text-sm leading-relaxed text-slate-300">Yönergeyi dinletin ve öğrencinin ilk dokunduğu bölgeyi değerlendirin. Model yalnızca sağa ve sola çevrilebilir.</p></div></div>
      {modelFailed ? <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">Vücut modeli açılamadı.</p> : <button type="button" disabled={!modelScene} onClick={() => void startAssessment()} className="mt-4 w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-lg disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400">{modelScene ? "Değerlendirmeyi Başlat" : "Model hazırlanıyor…"}</button>}
    </div>}

    {(phase === "intro" || phase === "asking") && <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-2">
      {phase === "asking" && <div className="rounded-full border border-white/15 bg-slate-900/80 px-3 py-2 text-sm font-bold text-white shadow backdrop-blur">{questionIndex + 1}/{TRIAL_COUNT}</div>}
      <button type="button" onClick={() => void repeatQuestion()} disabled={phase !== "asking" || repeatUsed || responseLockedRef.current} className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow backdrop-blur disabled:opacity-35"><Volume2 size={17} /> Yeniden dinle</button>
    </div>}

    {phase === "asking" && <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/65 px-4 py-2 text-xs text-white/80 backdrop-blur"><RotateCw size={15} /> Sağa-sola çevrilebilir</div>}

    <div className="h-full w-full bg-gradient-to-b from-slate-100 to-slate-300"><Canvas camera={{ fov: 42, near: 0.01, far: 1000 }} dpr={[1, 1.6]}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 6]} intensity={0.7} />
      <directionalLight position={[-4, 3, -4]} intensity={0.15} />
      <OrbitControls ref={controlsRef} makeDefault enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} rotateSpeed={0.65} />
      <CameraDirector modelScene={modelScene} focus={focus} controlsRef={controlsRef} />
      <Suspense fallback={<Loader />}><ModelErrorBoundary onError={() => setModelFailed(true)}><Model onPick={handlePick} onReady={setModelScene} /></ModelErrorBoundary></Suspense>
    </Canvas></div>

    {phase === "finished" && <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center text-white shadow-2xl">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}><CheckCircle2 size={34} /></div>
      <h2 className="mt-4 text-2xl font-bold">Değerlendirme tamamlandı</h2><p className="mt-2 text-slate-300">10 denemenin {score} tanesinde doğru bölgeye dokundu.</p>
      <div className={`mx-auto mt-4 w-fit rounded-full px-4 py-2 text-sm font-bold ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{passed ? "Kazanım başarılı" : "Kazanım henüz başarılı değil"}</div>
      <button type="button" disabled={saving} onClick={() => void saveAndClose()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-60"><Save size={19} /> {saving ? "Kaydediliyor…" : "Kaydet ve çık"}</button>
    </div></div>}
  </div>;
}

useGLTF.preload(MODEL_PATH);
