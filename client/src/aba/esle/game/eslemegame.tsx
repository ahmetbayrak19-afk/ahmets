import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";

/**
 * Amaç:
 * - Console yokken bile hatayı ekrana basmak (ama normalde panel kapalı)
 * - Draco decoder'ı APK içinden yüklemek:
 *   https://appassets.androidplatform.net/assets/public/draco/*
 * - GLB'yi APK içinden yüklemek:
 *   https://appassets.androidplatform.net/assets/public/models/balik.glb
 *   https://appassets.androidplatform.net/assets/public/models/deniz.glb
 * - Panel: sadece HATA olunca otomatik açılır (veya manuel açılır)
 */

type LogItem = { t: number; msg: string; level: "info" | "warn" | "error" };

function useScreenLogger() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const lastMsgRef = useRef<string>("");

  const push = useCallback((msg: string, level: LogItem["level"] = "info") => {
    // Aynı mesaj arka arkaya geliyorsa yazma (spam kes)
    const key = `${level}:${msg}`;
    if (lastMsgRef.current === key) return;
    lastMsgRef.current = key;

    setLogs((prev) => {
      const next = [...prev, { t: Date.now(), msg, level }];
      return next.length > 40 ? next.slice(-40) : next; // OOM engel
    });
  }, []);

  const clear = useCallback(() => {
    lastMsgRef.current = "";
    setLogs([]);
  }, []);

  return { logs, push, clear };
}

function LogOverlay({
  title,
  logs,
  onClear,
  onClose,
}: {
  title: string;
  logs: LogItem[];
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        maxWidth: 760,
        zIndex: 999999,
        background: "rgba(0,0,0,0.88)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e5e7eb",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div>

        <button
          onClick={onClear}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Temizle
        </button>

        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Gizle
        </button>
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {logs.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Log yok.</div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              style={{
                color:
                  l.level === "error"
                    ? "#ff4d4d"
                    : l.level === "warn"
                      ? "#fbbf24"
                      : "#a7f3d0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {"> "}
              {l.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 999999,
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "white",
          background: "rgba(0,0,0,0.6)",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          fontFamily: "monospace",
        }}
      >
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

class ScreenErrorBoundary extends React.Component<
  { onError: (msg: string) => void; fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    const msg = error?.message || String(error);
    this.props.onError(`REACT BOUNDARY HATA: ${msg}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Html center>
            <div
              style={{
                color: "#ff4d4d",
                background: "rgba(0,0,0,0.75)",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                fontFamily: "monospace",
                maxWidth: 320,
                textAlign: "center",
              }}
            >
              HATA: 3D sahne çöktü (React ErrorBoundary)
            </div>
          </Html>
        )
      );
    }
    return this.props.children as any;
  }
}

function SceneMultiGLB({
  fishUrl,
  seaUrl,
  dracoBase,
  report,
}: {
  fishUrl: string;
  seaUrl: string;
  dracoBase: string;
  report: (msg: string, level?: "info" | "warn" | "error") => void;
}) {
  // Decoder path'i sadece değiştiğinde set et
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const fish = useGLTF(fishUrl);
  const sea = useGLTF(seaUrl);

  // Loglar sadece 1 kere
  const loggedRef = useRef(false);
  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    report("BAŞARILI: balik.glb + deniz.glb yüklendi ve sahneye eklendi.", "info");
  }, [report]);

  return (
    <>
      {/* Deniz (arka plan / sahne) */}
      <primitive
        object={sea.scene}
        // Deniz modelinin ölçeği cihazına göre büyük/küçük olabilir:
        scale={1}
        position={[0, -1.2, -1.5]}
        rotation={[0, 0, 0]}
      />

      {/* Balık (ön plan) */}
      <primitive
        object={fish.scene}
        scale={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </>
  );
}

export default function EslemeGame() {
  const { logs, push, clear } = useScreenLogger();

  const [showPanel, setShowPanel] = useState(false);
  const [fishUrl, setFishUrl] = useState("");
  const [seaUrl, setSeaUrl] = useState("");
  const [dracoBase, setDracoBase] = useState("");
  const [glReady, setGlReady] = useState(false);

  // ✅ report stabil + hata gelince paneli otomatik aç
  const report = useCallback(
    (msg: string, level: "info" | "warn" | "error" = "info") => {
      push(msg, level);
      if (level === "error") setShowPanel(true);
    },
    [push]
  );

  // Global hata yakala
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const where = event.filename ? ` @ ${event.filename}:${event.lineno}:${event.colno}` : "";
      report(`window.onerror: ${event.message}${where}`, "error");
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || JSON.stringify(event.reason);
      report(`unhandledrejection: ${reason}`, "error");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [report]);

  // INIT: sadece 1 kere
  const initOnceRef = useRef(false);
  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    const origin = window.location.origin;
    const base = new URL("/assets/public/", origin).toString();

    const fish = new URL("models/balik.glb", base).toString();
    const sea = new URL("models/deniz.glb", base).toString();
    const draco = new URL("draco/", base).toString();

    setFishUrl(fish);
    setSeaUrl(sea);
    setDracoBase(draco);

    // info logları sadece panel açıksa gösterelim (normalde sessiz)
    // ama ilk kurulumda yine de 2-3 satır yazalım (çok kısa)
    push(`origin: ${origin}`, "info");
    push(`BASE: ${base}`, "info");

    const testFetch = async (path: string, label: string) => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (res.ok) push(`${label} OK (HTTP ${res.status})`, "info");
        else {
          push(`${label} HATA (HTTP ${res.status})`, "error");
          setShowPanel(true);
        }
      } catch (e: any) {
        push(`${label} FAILED: ${e?.message || String(e)}`, "error");
        setShowPanel(true);
      }
    };

    testFetch(fish, "balik.glb");
    testFetch(sea, "deniz.glb");
    testFetch(new URL("draco_decoder.wasm", draco).toString(), "draco_decoder.wasm");
  }, [push]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {/* Panel normalde kapalı; hata olunca açılır; istersen manuel aç */}
      {!showPanel ? (
        <MiniButton
          onClick={() => setShowPanel(true)}
          label="Rapor"
        />
      ) : (
        <LogOverlay
          title="NATIVE / 3D RAPOR (Console Yok)"
          logs={logs}
          onClear={clear}
          onClose={() => setShowPanel(false)}
        />
      )}

      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          setGlReady(true);
          // hata olursa panel açılacak zaten; burayı info olarak basmayalım
          const canvas = gl.domElement;

          const onLost = (e: Event) => {
            e.preventDefault();
            report("WEBGL CONTEXT LOST (siyah ekran sebebi olabilir).", "error");
          };
          const onRestored = () => report("WEBGL CONTEXT RESTORED", "warn");

          canvas.addEventListener("webglcontextlost", onLost as any, false);
          canvas.addEventListener("webglcontextrestored", onRestored as any, false);
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -3, 2]} intensity={0.4} />

        <ScreenErrorBoundary
          onError={(m) => report(m, "error")}
          fallback={
            <Html center>
              <div
                style={{
                  color: "#ff4d4d",
                  background: "rgba(0,0,0,0.75)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                  maxWidth: 340,
                  textAlign: "center",
                }}
              >
                HATA: 3D sahne çöktü (Boundary)
              </div>
            </Html>
          }
        >
          <Suspense fallback={<Loader3D />}>
            {fishUrl && seaUrl && dracoBase ? (
              <SceneMultiGLB
                fishUrl={fishUrl}
                seaUrl={seaUrl}
                dracoBase={dracoBase}
                report={report}
              />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>
                  Model URL bekleniyor...
                </div>
              </Html>
            )}
          </Suspense>
        </ScreenErrorBoundary>

        <OrbitControls enablePan enableRotate enableZoom />
      </Canvas>

      {!glReady && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 999999,
            color: "#fbbf24",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: 10,
          }}
        >
          UYARI: WebGL henüz hazır değil. Cihaz WebGL’i engelliyor olabilir.
        </div>
      )}
    </div>
  );
              }
