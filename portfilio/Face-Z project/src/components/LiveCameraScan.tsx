import { useEffect, useRef, useState } from "react";

type Props = {
  onFrame?: (base64Jpeg: string, dataUrl: string) => void;
  intervalMs?: number;
};

export function LiveCameraScan({ onFrame, intervalMs = 6000 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "live" | "error">("idle");
  const [error, setError] = useState<string>("");

  const start = async () => {
    setStatus("requesting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("live");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
      setStatus("error");
    }
  };

  useEffect(() => {
    start();
    return () => {
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Frame capture loop
  useEffect(() => {
    if (status !== "live" || !onFrame) return;
    let cancelled = false;

    const capture = () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const w = 640;
      const h = Math.round((v.videoHeight / v.videoWidth) * w) || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = dataUrl.split(",")[1];
      if (base64 && !cancelled) onFrame(base64, dataUrl);
    };

    const first = setTimeout(capture, 1500);
    const id = setInterval(capture, intervalMs);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(id);
    };
  }, [status, onFrame, intervalMs]);

  return (
    <div className="relative size-full">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="size-full object-cover bg-black"
      />

      {status !== "live" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-center p-6">
          <div className="size-3 bg-hud-cyan rounded-full shadow-[0_0_10px_#22d3ee] flicker" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-white">
            {status === "requesting" && "Requesting camera uplink…"}
            {status === "error" && "Camera access denied"}
            {status === "idle" && "Awaiting input"}
          </p>
          {status === "error" && (
            <>
              <p className="text-[10px] text-hud-pink max-w-xs leading-relaxed">
                {error}. Allow camera access in your browser, then retry.
              </p>
              <button
                onClick={start}
                className="px-4 py-2 border border-hud-cyan text-hud-cyan text-[10px] uppercase tracking-widest hover:bg-hud-cyan hover:text-hud-bg transition-colors"
              >
                Retry uplink
              </button>
            </>
          )}
        </div>
      )}

      {status === "live" && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/60 border border-hud-cyan/40">
          <div className="size-1.5 bg-hud-pink rounded-full flicker" />
          <span className="text-[9px] uppercase tracking-widest text-white">LIVE FEED</span>
        </div>
      )}
    </div>
  );
}
