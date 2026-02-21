import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";

type LogItem = { t: number; msg: string; level: "info" | "warn" | "error" };

function useScreenLogger() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const push = (msg: string, level: LogItem["level"] = "info") => {
    setLogs((prev) => [...prev.slice(-40), { t: Date.now(), msg, level }]);
  };
  const clear = () => setLogs([]);
  return { logs, push, clear };
}

function LogOverlay({
  title,
  logs,
  onClear,
}: {
  title: string;
  logs: LogItem[];
  onClear: () => void;
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

function Model3D({
  url,
  dracoBase,
  report,
}: {
  url: string;
  dracoBase: string;
  report: (msg: string, level?: "info" | "warn" | "error") => void;
}) {
  // Decoder path'i sadece değiştiğinde set et
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const { scene } = useGLTF(url);

  // ✅ spam'i kes: sadece ilk başarılı yüklemede log bas
  const loggedRef = useRef(false);
  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    report("BAŞARILI: GLB yüklendi ve sahneye eklendi.", "info");
  }, [report]);

  return <primitive object={scene} />;
}

export default function EslemeGame() {
  const { logs, push, clear } = useScreenLogger();
  const [modelUrl, setModelUrl] = useState<string>("");
  const [dracoBase, setDracoBase] = useState<string>("");
  const [glReady, setGlReady] = useState<boolean>(false);

  // ✅ report referansı sabit
  const report = useCallback(
    (msg: string, level: "info" | "warn" | "error" = "info") => push(msg, level),
    [push]
  );

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

  useEffect(() => {
    report(`href: ${window.location.href}`, "info");
    report(`origin: ${window.location.origin}`, "info");

    const base = new URL("/assets/public/", window.location.origin).toString();
    const glb = new URL("models/balik.glb", base).toString();
    const draco = new URL("draco/", base).toString();

    setModelUrl(glb);
    setDracoBase(draco);

    report(`BASE: ${base}`, "info");
    report(`GLB URL: ${glb}`, "info");
    report(`DRACO BASE: ${draco}`, "info");

    // preload (doğru path)
    try {
      useGLTF.preload(glb);
    } catch {
      // preload bazı ortamlarda erken çağrılınca patlayabilir, umursama
    }

    const testFetch = async (path: string, label: string) => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (res.ok) report(`${label} OK (HTTP ${res.status})`, "info");
        else report(`${label} HATA (HTTP ${res.status})`, "error");
      } catch (e: any) {
        report(`${label} FAILED: ${e?.message || String(e)}`, "error");
      }
    };

    testFetch(glb, "GLB fetch");
    testFetch(new URL("draco_wasm_wrapper.js", draco).toString(), "DRACO wrapper");
    testFetch(new URL("draco_decoder.wasm", draco).toString(), "DRACO wasm");
    testFetch(new URL("draco_decoder.js", draco).toString(), "DRACO decoder.js");
  }, [report]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <LogOverlay title="NATIVE / 3D RAPOR (Console Yok)" logs={logs} onClear={clear} />

      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          try {
            setGlReady(true);
            report("WebGL hazır (onCreated).", "info");

            const canvas = gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              report("WEBGL CONTEXT LOST (siyah ekran sebebi olabilir).", "error");
            };
            const onRestored = () => report("WEBGL CONTEXT RESTORED", "warn");

            canvas.addEventListener("webglcontextlost", onLost as any, false);
            canvas.addEventListener("webglcontextrestored", onRestored as any, false);
          } catch (e: any) {
            report(`WebGL init hatası: ${e?.message || String(e)}`, "error");
          }
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
            {modelUrl && dracoBase ? (
              <Model3D url={modelUrl} dracoBase={dracoBase} report={report} />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>Model URL bekleniyor...</div>
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
