import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  RotateCw, 
  Tv, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Database,
  Lock,
  Link2,
  Download,
  FileImage,
  Copy,
  Check
} from "lucide-react";

interface VideoPreviewSimulatorProps {
  url?: string;
  title?: string;
  thumbnailUrl?: string;
  channel?: string;
  views?: string;
  duration?: string;
  videoFilter?: string;
  aspectRatio?: string;
  watermarkText?: string;
  aiPhotoEffect?: string;
}

export default function VideoPreviewSimulator({
  url = "",
  title = "",
  thumbnailUrl = "",
  channel = "",
  views = "",
  duration = "",
  videoFilter = "",
  aspectRatio = "16:9",
  watermarkText = "",
  aiPhotoEffect = ""
}: VideoPreviewSimulatorProps) {
  const isDormant = !url.trim();

  const [simulationState, setSimulationState] = useState<"idle" | "connecting" | "processing" | "syncing" | "complete">("idle");
  const [resolution, setResolution] = useState<"1080p" | "720p" | "4K">("1080p");
  const [fps, setFps] = useState(0);
  const [bitrate, setBitrate] = useState(0);
  const [audioFreqs, setAudioFreqs] = useState<number[]>([20, 40, 15, 60, 45, 30, 75, 50, 10, 25, 40, 20]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"simulated" | "live">("simulated");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!url.trim()) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  // Detect live players
  const getYouTubeId = (urlStr: string) => {
    try {
      const trimmed = urlStr.trim();
      // Robust YouTube, YouTube Shorts, and YouTube Live parser
      const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
      const match = trimmed.match(regExp);
      if (match && match[1] && match[1].trim().length === 11) {
        return match[1].trim();
      }
      
      // Fallback
      if (trimmed.toLowerCase().includes("youtube.com") || trimmed.toLowerCase().includes("youtu.be")) {
        // Handle protocol parsing safely by ensuring a protocol is present before URL construction
        let parseable = trimmed;
        if (!/^https?:\/\//i.test(parseable)) {
          parseable = "https://" + parseable;
        }
        const urlObj = new URL(parseable);
        const v = urlObj.searchParams.get("v");
        if (v && v.length === 11) return v;
        const paths = urlObj.pathname.split("/");
        
        const shortsIdx = paths.indexOf("shorts");
        if (shortsIdx !== -1 && paths[shortsIdx + 1] && paths[shortsIdx + 1].length === 11) {
          return paths[shortsIdx + 1];
        }

        const liveIdx = paths.indexOf("live");
        if (liveIdx !== -1 && paths[liveIdx + 1] && paths[liveIdx + 1].length === 11) {
          return paths[liveIdx + 1];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const getVimeoId = (urlStr: string) => {
    try {
      const match = urlStr.trim().match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const getInstagramShortcode = (urlStr: string) => {
    try {
      const trimmed = urlStr.trim();
      const lower = trimmed.toLowerCase();
      if (!lower.includes("instagram.com") && !lower.includes("instagr.am")) {
        return null;
      }
      // Matches /p/SHORTCODE, /reel/SHORTCODE, /reels/SHORTCODE, /tv/SHORTCODE, /stories/SHORTCODE, /share/SHORTCODE anywhere (with or without username)
      const match = trimmed.match(/\/(?:p|reel|reels|tv|stories|share)\/([A-Za-z0-9-_]+)/i);
      if (match) return match[1];

      // Safe fallback if story URL has specific username prefix /stories/username/shortcode
      const storiesMatch = trimmed.match(/\/stories\/[A-Za-z0-9_.]+\/([A-Za-z0-9-_]+)/i);
      if (storiesMatch) return storiesMatch[1];

      return null;
    } catch (e) {
      return null;
    }
  };

  const isFacebookVideo = (urlStr: string) => {
    const lower = urlStr.trim().toLowerCase();
    return lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com");
  };

  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const instCode = getInstagramShortcode(url);
  const isFb = isFacebookVideo(url);
  const isDirectImage = url.trim().match(/\.(jpeg|jpg|gif|png|webp|svg)(?:\?.*)?$/i) || url.toLowerCase().includes("images.unsplash.com");
  const hasLivePlayer = !!(ytId || vimeoId || instCode || isFb || isDirectImage || thumbnailUrl);

  // Reset simulation and viewMode when URL changes
  useEffect(() => {
    setSimulationState("idle");
    setLogLines([]);
    setViewMode(hasLivePlayer ? "live" : "simulated");
  }, [url]);

  // Dynamic log updates during simulation
  const addLog = (line: string) => {
    setLogLines((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  // Simulate video frame rendering, bitrates, and audio frequencies
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulationState !== "idle" && !isDormant) {
      interval = setInterval(() => {
        // Fluctuating FPS and bitrate
        if (simulationState === "processing") {
          setFps(Math.floor(Math.random() * 5) + 58); // ~60fps
          setBitrate(Math.floor(Math.random() * 800) + 4200); // 4200-5000 kbps
        } else if (simulationState === "syncing" || simulationState === "complete") {
          setFps(60);
          setBitrate(resolution === "4K" ? 12400 : resolution === "1080p" ? 4800 : 2600);
        }

        // Animate audio waveform mock bars
        setAudioFreqs((prev) =>
          prev.map(() => Math.floor(Math.random() * 85) + 15)
        );

        // Frame number ticker
        setActiveFrameIndex((prev) => (prev + 1) % 100);
      }, 150);
    } else {
      setFps(0);
      setBitrate(0);
      setAudioFreqs([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => clearInterval(interval);
  }, [simulationState, resolution, isDormant]);

  const startSimulation = () => {
    if (isDormant) return;
    setSimulationState("connecting");
    setLogLines([]);
    addLog(`INIT: Connection handshakes on stream container.`);
    
    setTimeout(() => {
      setSimulationState("processing");
      addLog(`DECRYPT: Container opened for: "${title.slice(0, 30)}..."`);
      addLog(`UPSCALING: Processing ${resolution} layout nodes.`);
    }, 1200);

    setTimeout(() => {
      setSimulationState("syncing");
      addLog(`SYNC: Linking 48kHz linear PCM audio master channel.`);
    }, 2800);

    setTimeout(() => {
      setSimulationState("complete");
      addLog(`SUCCESS: Pristine media envelope sealed.`);
    }, 4500);
  };

  const resetSimulation = () => {
    setSimulationState("idle");
    setLogLines([]);
  };

  // Default elegant stock placeholder for dormant view
  const displayImage = thumbnailUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="w-full max-w-5xl bg-[#e4eaf0] border border-primary p-6 md:p-8 shadow-[6px_6px_0px_#1b222c] space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/20 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-secondary text-[11px] font-sans font-bold tracking-[0.2em] uppercase">
            <Activity className="w-4 h-4 animate-pulse text-secondary" />
            <span>STREAM PREVIEW PANEL</span>
          </div>
          <h3 className="font-serif font-semibold text-xl text-on-surface">
            {isDormant ? "Stream Preview Pipeline (Dormant)" : "Fidelity Preview Pipeline"}
          </h3>
        </div>

        {/* Mode & Quality controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {hasLivePlayer && !isDormant && (
            <div className="flex items-center gap-1 bg-[#dcd7cb] border border-primary/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode("simulated")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  viewMode === "simulated"
                    ? "bg-primary text-on-primary border border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                HUD Sim
              </button>
              <button
                type="button"
                onClick={() => setViewMode("live")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  viewMode === "live"
                    ? "bg-primary text-on-primary border border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Live Preview
              </button>
            </div>
          )}

          {/* Quality select switcher */}
          <div className="flex items-center gap-1.5 bg-background border border-primary/40 p-1">
            {(["720p", "1080p", "4K"] as const).map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setResolution(q)}
                disabled={simulationState !== "idle" || isDormant || viewMode === "live"}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  resolution === q
                    ? "bg-primary text-on-primary border border-primary"
                    : "text-on-surface-variant hover:text-primary hover:bg-background/80"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Copy Share Link Button */}
          {!isDormant && (
            <button
              type="button"
              id="copy-extraction-link-btn"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 border border-primary/40 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer ${
                copied 
                  ? "bg-[#4f5e7c] text-white border-[#4f5e7c] shadow-[2px_2px_0px_#1b222c]" 
                  : "bg-background hover:bg-primary hover:text-on-primary text-on-surface hover:shadow-[3px_3px_0px_#1b222c]"
              }`}
              title="Copy shareable extraction URL to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 animate-bounce" />
                  <span>COPIED LINK!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY SHARE LINK</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Video Stage Screen Mockup */}
        <div className="lg:col-span-7 aspect-video bg-neutral-950 border border-primary overflow-hidden relative flex flex-col justify-between p-4 group">
          
          {/* Real Live Player Overlay */}
          {viewMode === "live" && !isDormant && (
            <div className="absolute inset-0 z-20 bg-neutral-950 flex flex-col justify-between">
              {ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&modestbranding=1&rel=0`}
                  className="w-full h-full border-none absolute inset-0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title="YouTube live stream"
                />
              ) : vimeoId ? (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&badge=0&byline=0&portrait=0`}
                  className="w-full h-full border-none absolute inset-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo live stream"
                />
              ) : instCode ? (
                <iframe
                  src={`https://www.instagram.com/p/${instCode}/embed`}
                  className="w-full h-full border-none absolute inset-0 bg-white"
                  allowtransparency="true"
                  allowFullScreen
                  title="Instagram live post embed"
                />
              ) : isFb ? (
                <iframe
                  src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&mute=1&autoplay=1`}
                  className="w-full h-full border-none absolute inset-0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  title="Facebook live video embed"
                />
              ) : (
                <div className="relative w-full h-full bg-neutral-900">
                  <img
                    src={displayImage}
                    alt="Pristine Media Source"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {/* Local Photo Download helper inside live player */}
                  <div className="absolute bottom-3 right-3 z-30">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await fetch(displayImage);
                          const blob = await response.blob();
                          const urlBlob = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = urlBlob;
                          a.download = `extractile-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "photo"}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(urlBlob);
                        } catch (err) {
                          const a = document.createElement('a');
                          a.href = displayImage;
                          a.target = "_blank";
                          a.download = `extractile-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "photo"}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                      className="px-3 py-1.5 bg-secondary text-white hover:bg-primary font-mono text-[9px] font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer rounded-none flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download HD Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scanning Sweeper Line */}
          {(simulationState === "processing" || simulationState === "syncing") && (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: "100%" }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2.2,
                ease: "easeInOut",
              }}
              className="absolute left-0 right-0 h-0.5 bg-secondary/80 shadow-[0_0_8px_#4f5e7c] z-20 pointer-events-none"
              style={{ top: 0 }}
            />
          )}

          {/* Video Placeholder Content */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950">
            <div className={`transition-all duration-500 relative ${
              aspectRatio === "9:16" ? "aspect-[9/16] h-full mx-auto border-x border-dashed border-primary/40" :
              aspectRatio === "1:1" ? "aspect-square h-full mx-auto border-x border-dashed border-primary/40" :
              aspectRatio === "4:3" ? "aspect-[4/3] h-full mx-auto border-x border-dashed border-primary/40" :
              "w-full h-full"
            }`}>
              <img 
                src={displayImage} 
                alt="Simulation target frame"
                style={{ filter: `${videoFilter} ${aiPhotoEffect}`.trim() || undefined }}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isDormant ? "grayscale opacity-10 blur-[2px]" :
                  simulationState === "idle" ? "grayscale opacity-40" :
                  simulationState === "connecting" ? "grayscale opacity-50 blur-[1px]" :
                  simulationState === "processing" ? "grayscale-0 contrast-115 opacity-75" :
                  "grayscale-0 contrast-100 opacity-90"
                }`}
                referrerPolicy="no-referrer"
              />
              {/* Dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50 pointer-events-none" />
            </div>
          </div>

          {/* Watermark Overlay */}
          {watermarkText && !isDormant && (
            <div className="absolute inset-x-0 bottom-16 flex justify-center z-10 pointer-events-none">
              <span className="px-3 py-1 bg-black/75 border border-primary/30 text-[9px] font-mono text-secondary uppercase tracking-[0.25em] shadow-md animate-pulse">
                {watermarkText}
              </span>
            </div>
          )}

          {/* Top Info overlay */}
          <div className="z-10 flex justify-between items-start font-mono text-[9px] uppercase tracking-wider text-neutral-300">
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-700 px-2 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isDormant ? "bg-red-500" :
                simulationState === "idle" ? "bg-neutral-500" :
                simulationState === "complete" ? "bg-[#4f5e7c] animate-pulse" : "bg-secondary animate-ping"
              }`} />
              <span>{isDormant ? "WAITING FOR URL" : simulationState}</span>
            </div>
            
            <div className="bg-neutral-900/80 border border-neutral-700 px-2 py-1">
              {isDormant ? "FRAME: 000" : `FRAME: #${activeFrameIndex.toString().padStart(3, "0")}`}
            </div>
          </div>

          {/* Locked / Dormant Message overlay */}
          {isDormant && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 bg-black/60 text-center space-y-3">
              <div className="p-3 bg-neutral-900/90 border border-neutral-700 text-secondary rounded-full">
                <Lock className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="text-white text-xs font-serif font-bold">Interactive Preview Locked</p>
                <p className="text-[10px] font-mono text-neutral-400 max-w-xs leading-normal">
                  Please enter a valid video stream link in the extractor form above to unlock the real-time high fidelity preview pipeline.
                </p>
              </div>
            </div>
          )}

          {/* Large Center Play Icon when Idle and not dormant */}
          <AnimatePresence>
            {simulationState === "idle" && !isDormant && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <button
                  onClick={startSimulation}
                  className="w-14 h-14 bg-[#e4eaf0] border-2 border-primary hover:bg-[#4f5e7c] hover:text-white text-primary rounded-full flex items-center justify-center cursor-pointer shadow-[4px_4px_0px_#1b222c] hover:shadow-[2px_2px_0px_#1b222c] transition-all hover:scale-105"
                  aria-label="Launch processing simulation"
                >
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom telemetry HUD overlay */}
          <div className="z-10 bg-neutral-950/85 border border-neutral-800 p-2.5 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-neutral-400">
              <div className="border-r border-neutral-800 space-y-0.5">
                <span className="block text-[8px] text-neutral-500">RESOLUTION</span>
                <span className="font-bold text-white tracking-widest">
                  {simulationState === "idle" || isDormant ? "---" : resolution === "4K" ? "3840×2160" : resolution === "1080p" ? "1920×1080" : "1280×720"}
                </span>
              </div>
              <div className="border-r border-neutral-800 space-y-0.5">
                <span className="block text-[8px] text-neutral-500">FRAMERATE</span>
                <span className="font-bold text-white tracking-widest">
                  {simulationState === "idle" || isDormant ? "0 fps" : `${fps} FPS`}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] text-neutral-500">BITRATE CAP</span>
                <span className="font-bold text-secondary tracking-widest">
                  {simulationState === "idle" || isDormant ? "0 Kbps" : `${(bitrate / 1000).toFixed(1)} Mbps`}
                </span>
              </div>
            </div>

            {/* Audio Waveform mock graph */}
            <div className="pt-1.5 flex items-end justify-between h-6 px-1 gap-[3px] border-t border-neutral-900">
              {audioFreqs.map((height, i) => (
                <div
                  key={i}
                  className="w-full bg-secondary/80 transition-all duration-150"
                  style={{ height: isDormant ? "2px" : `${height}%`, minHeight: "2px" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Technical diagnostics logs & Control panel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="bg-background border border-primary/30 p-4 flex flex-col justify-between flex-grow min-h-[180px]">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-primary/10 pb-2">
                <Database className="w-3.5 h-3.5 text-secondary" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-primary">NODE TELEMETRY LOG</span>
              </div>
              
              {/* Dynamic scroll of console line items */}
              <div className="space-y-1.5 min-h-[110px] flex flex-col justify-end">
                {isDormant ? (
                  <div className="text-[10px] font-mono text-on-surface-variant/40 italic">
                    Pipeline locked. Input an active URL link above to establish a telemetry session.
                  </div>
                ) : logLines.length === 0 ? (
                  <div className="text-[10px] font-mono text-on-surface-variant/50 italic">
                    Connection verified. Ready to ingest stream packet from: {url.slice(0, 32)}... Click PLAY to run high-fidelity preview simulation.
                  </div>
                ) : (
                  logLines.map((line, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-mono text-on-surface leading-tight"
                    >
                      {line}
                    </motion.p>
                  ))
                )}
              </div>
            </div>

            {/* Ingestion results panel */}
            <AnimatePresence mode="wait">
              {simulationState === "complete" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-3 bg-[#4f5e7c]/10 border border-[#4f5e7c]/30 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#4f5e7c] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-[#4f5e7c] block">Fidelity Verified</span>
                    <span className="text-[10px] font-mono text-on-surface-variant leading-normal block">
                      Envelopes sealed successfully for raw container stream. Verified channel: <span className="font-bold">{channel}</span>.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Simulation Interaction Controls */}
          <div className="flex flex-col gap-2">
            {isDormant ? (
              <button
                disabled
                className="w-full py-3.5 bg-primary/20 text-on-surface-variant/40 font-sans font-bold text-[10px] tracking-[0.18em] uppercase rounded-none transition-all flex items-center justify-center gap-1.5 cursor-not-allowed border border-primary/10"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Locked — Add Link Above</span>
              </button>
            ) : simulationState === "idle" ? (
              <button
                onClick={startSimulation}
                className="w-full py-3.5 bg-primary hover:bg-secondary text-on-primary font-sans font-bold text-[10px] tracking-[0.18em] uppercase cursor-pointer rounded-none active:scale-95 transition-all shadow-[3px_3px_0px_#4f5e7c] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Ingestion Preview</span>
              </button>
            ) : (
              <button
                onClick={resetSimulation}
                className="w-full py-3.5 border border-primary hover:bg-primary hover:text-on-primary font-sans font-bold text-[10px] tracking-[0.18em] uppercase cursor-pointer rounded-none active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>RESET STAGE ENGINE</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-1 text-[9px] font-mono text-on-surface-variant">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              <span className="uppercase">Secure RAM sandbox simulation nodes.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
