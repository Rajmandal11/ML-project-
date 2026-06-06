import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { LiveCameraScan } from "@/components/LiveCameraScan";
import { analyzeFrame, type ScanAnalysis } from "@/lib/analyze.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AEGIS-7 — Neural Fashion Intelligence" },
      {
        name: "description",
        content:
          "Cyberpunk AI vision system. Full-body fashion recognition, biometric analysis, and holographic intelligence dashboard.",
      },
      { property: "og:title", content: "AEGIS-7 — Neural Fashion Intelligence" },
      {
        property: "og:description",
        content:
          "Scan, identify, and analyze human appearance from face to footwear with a real-time holographic HUD.",
      },
    ],
  }),
  component: Index,
});

const FALLBACK: ScanAnalysis = {
  subject: { id: "—", class: "—", threat: "—", affiliation: "—" },
  physical: { heightEstimateCm: 0, bodyIndex: "—", skinTone: "—", hair: "—", neuralLoadPct: 0 },
  face: { mood: "—", ageRange: "—", shape: "—", eyes: "—", idScorePct: 0 },
  torso: { item: "Awaiting subject…", description: "—", confidence: 0 },
  accessories: { harness: "—", gloves: "—", watch: "—" },
  footwear: { model: "—", serial: "—", material: "—" },
  style: {
    score: 0,
    occasion: { label: "—", pct: 0 },
    trend: { label: "—", pct: 0 },
    color: { label: "—", pct: 0 },
  },
  recommendations: [],
  logs: ["AWAITING_SUBJECT…"],
};

function Index() {
  const callAnalyze = useServerFn(analyzeFrame);
  const [data, setData] = useState<ScanAnalysis>(FALLBACK);
  const [scanning, setScanning] = useState(false);
  const [mugshot, setMugshot] = useState<string | null>(null);
  const inflight = useRef(false);

  const handleFrame = useCallback(
    async (imageBase64: string, dataUrl: string) => {
      if (inflight.current) return;
      inflight.current = true;
      setScanning(true);
      setMugshot(dataUrl);
      try {
        const ts = new Date().toLocaleTimeString("en-GB");
        setData((prev) => ({
          ...prev,
          logs: [`[${ts}] FRAME_CAPTURED → AEGIS_CORE`, ...prev.logs].slice(0, 8),
        }));
        const result = await callAnalyze({ data: { imageBase64 } });
        setData(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "scan failed";
        setData((prev) => ({
          ...prev,
          logs: [`[ERR] ${msg.slice(0, 60)}`, ...prev.logs].slice(0, 8),
        }));
      } finally {
        inflight.current = false;
        setScanning(false);
      }
    },
    [callAnalyze],
  );

  const d = data;
  const breakdown = [
    ["Occasion Suitability", d.style.occasion.label, d.style.occasion.pct],
    ["Trend Alignment", d.style.trend.label, d.style.trend.pct],
    ["Color Harmony", d.style.color.label, d.style.color.pct],
  ] as const;




  return (
    <div className="min-h-screen bg-hud-bg text-hud-cyan font-hud overflow-hidden selection:bg-hud-cyan/30">
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex justify-between items-center border-b border-hud-cyan/10 bg-hud-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="size-3 bg-hud-cyan rounded-full shadow-[0_0_10px_#22d3ee] flicker" />
          <span className="text-xs tracking-[0.3em] font-bold uppercase text-white">
            Aegis-7 Intelligence Node
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] tracking-widest">
          <span className="opacity-50">LAT: 35.6895° N</span>
          <span className="opacity-50">LNG: 139.6917° E</span>
          <span className={scanning ? "text-hud-cyan flicker" : "text-hud-pink"}>
            {scanning ? "SCANNING…" : "SYSTEM STATUS: OPTIMAL"}
          </span>
        </div>
      </nav>

      <main className="relative w-full min-h-screen grid grid-cols-12">
        {/* Left Sidebar */}
        <aside className="col-span-12 lg:col-span-3 p-8 pt-24 flex flex-col gap-6 border-r border-hud-cyan/10 bg-slate-950/40">
          <div className="space-y-1">
            <h2 className="text-[10px] uppercase tracking-tighter opacity-50">
              Subject Identification
            </h2>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              ID: {d.subject.id || "—"}
            </h1>
          </div>

          <div className="p-4 border border-hud-cyan/20 bg-hud-cyan/5 rounded-sm relative">
            <div className="absolute -top-px -left-px size-2 border-t border-l border-hud-cyan" />
            <div className="absolute -bottom-px -right-px size-2 border-b border-r border-hud-cyan" />
            <div className="flex gap-4">
              {mugshot ? (
                <img
                  src={mugshot}
                  alt="Subject live capture"
                  width={80}
                  height={80}
                  className="size-20 object-cover outline-1 -outline-offset-1 outline-hud-cyan/40"
                />
              ) : (
                <div className="size-20 flex items-center justify-center bg-slate-900 outline-1 -outline-offset-1 outline-white/10 text-[8px] uppercase opacity-50 text-center px-1">
                  No Capture
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="h-1 w-full bg-hud-cyan/10 overflow-hidden">
                  <div
                    className="h-full bg-hud-cyan transition-all duration-700"
                    style={{ width: `${d.face.idScorePct}%` }}
                  />
                </div>
                <p className="text-[10px] leading-relaxed uppercase">
                  <span className="text-hud-pink">Threat:</span> {d.subject.threat}<br />
                  <span className="text-hud-pink">Class:</span> {d.subject.class}<br />
                  <span className="text-hud-pink">Affiliation:</span> {d.subject.affiliation}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              ["Height Est.", d.physical.heightEstimateCm ? `${d.physical.heightEstimateCm} cm` : "—"],
              ["Body Index", d.physical.bodyIndex],
              ["Skin Tone", d.physical.skinTone],
              ["Hair", d.physical.hair],
              ["Neural Load", `${d.physical.neuralLoadPct}%`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-end border-b border-hud-cyan/10 pb-2 gap-3"
              >
                <span className="text-[10px] uppercase opacity-70 shrink-0">{k}</span>
                <span className="text-sm text-white text-right truncate">{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Scan View */}
        <section className="col-span-12 lg:col-span-6 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#111827_0%,_#020617_70%)] min-h-[80vh]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div className="w-full h-px bg-hud-cyan/60 shadow-[0_0_15px_#22d3ee] scan-line-anim" />
          </div>

          <div className="relative z-0 h-[80vh] flex items-center justify-center pt-20">
            <div className="relative h-full aspect-[9/16] outline-1 outline-hud-cyan/20">
              <LiveCameraScan onFrame={handleFrame} intervalMs={15000} />

              <div className="absolute top-[7%] left-[40%] size-12 border border-hud-pink/70 hud-pulse" />
              <div className="absolute top-[22%] left-[22%] w-[56%] h-[30%] border border-hud-cyan/60 hud-pulse" />
              <div className="absolute top-[60%] left-[32%] w-[36%] h-[28%] border border-hud-cyan/40 hud-pulse" />
              <div className="absolute bottom-[2%] left-[28%] w-[44%] h-[8%] border border-hud-cyan/60 hud-pulse" />

              {/* Face Panel */}
              <div className="absolute top-[2%] -right-56 w-52 p-3 border border-hud-pink/40 bg-black/50 backdrop-blur-sm float-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 bg-hud-pink rounded-full" />
                  <span className="text-[9px] uppercase font-bold text-hud-pink">
                    Facial Metrics
                  </span>
                </div>
                <ul className="text-[10px] space-y-1 text-slate-300">
                  <li className="flex justify-between gap-2"><span>Mood</span><span className="text-white truncate">{d.face.mood}</span></li>
                  <li className="flex justify-between gap-2"><span>Age</span><span className="text-white truncate">{d.face.ageRange}</span></li>
                  <li className="flex justify-between gap-2"><span>Face Shape</span><span className="text-white truncate">{d.face.shape}</span></li>
                  <li className="flex justify-between gap-2"><span>Eyes</span><span className="text-white truncate">{d.face.eyes}</span></li>
                  <li className="flex justify-between gap-2"><span>ID Score</span><span className="text-white">{d.face.idScorePct}%</span></li>
                </ul>
                <div className="absolute top-1/2 -left-20 w-20 h-px bg-hud-pink/50" />
                <div className="absolute top-1/2 -left-[5.5rem] size-1.5 -translate-y-1/2 bg-hud-pink rounded-full shadow-[0_0_8px_#f472b6]" />
              </div>

              {/* Torso Panel */}
              <div className="absolute top-[28%] -left-64 w-60 p-4 border border-hud-cyan/40 bg-black/50 backdrop-blur-sm float-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 bg-hud-cyan rounded-full" />
                  <span className="text-[9px] uppercase font-bold text-white">Torso Armor</span>
                </div>
                <div className="text-[11px] font-bold text-white mb-1 uppercase tracking-tight line-clamp-1">
                  {d.torso.item}
                </div>
                <p className="text-[9px] leading-relaxed text-slate-400 mb-3 line-clamp-3">
                  {d.torso.description}
                </p>
                <div className="h-1 bg-hud-cyan/20 overflow-hidden">
                  <div
                    className="h-full bg-hud-cyan transition-all duration-700"
                    style={{ width: `${Math.round((d.torso.confidence ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="text-[8px] mt-2 opacity-60">CONFIDENCE {(d.torso.confidence ?? 0).toFixed(3)}</p>
                <div className="absolute top-1/2 -right-16 w-16 h-px bg-hud-cyan/50" />
                <div className="absolute top-1/2 -right-[4.5rem] size-1.5 -translate-y-1/2 bg-hud-cyan rounded-full shadow-[0_0_8px_#22d3ee]" />
              </div>

              {/* Accessories Panel */}
              <div className="absolute top-[55%] -right-56 w-48 p-3 border border-hud-cyan/40 bg-black/50 backdrop-blur-sm float-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 bg-hud-cyan rounded-full" />
                  <span className="text-[9px] uppercase font-bold text-white">Accessories</span>
                </div>
                <ul className="text-[10px] space-y-1 text-slate-300">
                  <li className="flex justify-between gap-2"><span>Harness</span><span className="text-white truncate">{d.accessories.harness}</span></li>
                  <li className="flex justify-between gap-2"><span>Gloves</span><span className="text-white truncate">{d.accessories.gloves}</span></li>
                  <li className="flex justify-between gap-2"><span>Watch</span><span className="text-white truncate">{d.accessories.watch}</span></li>
                </ul>
                <div className="absolute top-1/2 -left-20 w-20 h-px bg-hud-cyan/50" />
                <div className="absolute top-1/2 -left-[5.5rem] size-1.5 -translate-y-1/2 bg-hud-cyan rounded-full shadow-[0_0_8px_#22d3ee]" />
              </div>

              {/* Footwear Panel */}
              <div className="absolute bottom-2 -left-56 w-52 p-3 border border-hud-cyan/40 bg-black/50 backdrop-blur-sm float-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 bg-hud-cyan rounded-full" />
                  <span className="text-[9px] uppercase font-bold text-white">Footwear Trace</span>
                </div>
                <div className="text-[10px] text-white uppercase truncate">{d.footwear.model}</div>
                <div className="text-[8px] opacity-60 mt-1 truncate">Serial: {d.footwear.serial}</div>
                <div className="text-[8px] opacity-60 truncate">Material: {d.footwear.material}</div>
                <div className="absolute top-1/2 -right-20 w-20 h-px bg-hud-cyan/50" />
                <div className="absolute top-1/2 -right-[5.5rem] size-1.5 -translate-y-1/2 bg-hud-cyan rounded-full shadow-[0_0_8px_#22d3ee]" />
              </div>
            </div>
          </div>
        </section>

        {/* Right Dashboard */}
        <aside className="col-span-12 lg:col-span-3 p-8 pt-24 border-l border-hud-cyan/10 bg-slate-950/40 flex flex-col gap-8">
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-hud-pink">
              Style Convergence
            </h3>
            <div className="relative h-32 w-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-hud-cyan/10" />
              <div className="absolute inset-0 rounded-full border-4 border-hud-cyan border-t-transparent border-l-transparent -rotate-45 shadow-[0_0_20px_rgba(34,211,238,0.25)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white font-display tabular-nums">
                  {d.style.score || 0}
                </span>
                <span className="text-[8px] opacity-50 uppercase">Rating</span>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            {breakdown.map(([label, val, pct]) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase gap-2">
                  <span>{label}</span>
                  <span className="text-hud-cyan truncate">{val}</span>
                </div>
                <div className="h-1.5 bg-hud-cyan/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-hud-cyan to-hud-pink transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-[10px] uppercase tracking-widest mb-4 opacity-50">
              Neural Link Stream
            </h3>
            <div className="flex-1 font-mono text-[9px] space-y-2 opacity-80 overflow-hidden">
              {(d.logs ?? []).slice(0, 8).map((line, i) => (
                <div key={`${i}-${line}`} className="flex gap-2">
                  <span className={line.startsWith("[ERR") ? "text-hud-pink" : "text-hud-cyan"}>
                    {line.startsWith("[") ? "" : "›"}
                  </span>
                  <span className={line.includes("WARNING") || line.startsWith("[ERR") ? "text-hud-pink" : ""}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t border-hud-cyan/10">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `aegis-profile-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full py-3 border border-hud-cyan text-[10px] uppercase tracking-widest text-hud-cyan hover:bg-hud-cyan hover:text-hud-bg transition-colors"
            >
              Initiate Full Profile Export
            </button>
          </div>
        </aside>
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-12 px-12 py-3 border border-hud-cyan/20 bg-hud-bg/90 backdrop-blur-xl">
        <div className="flex flex-col items-center">
          <span className="text-[8px] opacity-40 uppercase">Sync Status</span>
          <span className="text-xs text-white">{scanning ? "ANALYZING" : "ENCRYPTED"}</span>
        </div>
        <div className="w-px h-6 bg-hud-cyan/20" />
        <div className="flex flex-col items-center">
          <span className="text-[8px] opacity-40 uppercase">ID Score</span>
          <span className="text-xs text-white tabular-nums">{d.face.idScorePct}%</span>
        </div>
        <div className="w-px h-6 bg-hud-cyan/20" />
        <div className="flex flex-col items-center">
          <span className="text-[8px] opacity-40 uppercase">AI Core</span>
          <span className="text-xs text-white">AEGIS v9.1</span>
        </div>
      </div>
    </div>
  );
}
