import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Download, 
  Cpu, 
  Layers, 
  Activity, 
  Clock, 
  Terminal, 
  Network, 
  Sparkles,
  Database,
  ArrowRight,
  Sliders,
  Settings,
  RefreshCw,
  FileVideo,
  Music,
  Check
} from "lucide-react";

import CircularProgressBar from "./CircularProgressBar";

interface ExtractionProgressBarProps {
  progress: number;
  videoFormat: "MP4" | "WEBM" | "MKV" | "MOV" | "MP3";
  selectedVideo: string;
  selectedAudio: string;
  videoFilter: string;
  aspectRatio: string;
  watermarkText: string;
  title: string;
  enableTrim?: boolean;
  trimStart?: string;
  trimEnd?: string;
  onFormatChange?: (newFormat: "MP4" | "WEBM" | "MKV" | "MOV" | "MP3") => void;
}

interface LogEntry {
  timestamp: string;
  tag: "CONN" | "DOWN" | "CODEC" | "SYS" | "WARN";
  message: string;
}

export default function ExtractionProgressBar({
  progress,
  videoFormat,
  selectedVideo,
  selectedAudio,
  videoFilter,
  aspectRatio,
  watermarkText,
  title,
  enableTrim,
  trimStart,
  trimEnd,
  onFormatChange
}: ExtractionProgressBarProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Real-time Conversion Settings state during stream processing
  const [currentFormat, setCurrentFormat] = useState<"MP4" | "WEBM" | "MKV" | "MOV" | "MP3">(videoFormat);
  const [transcodePreset, setTranscodePreset] = useState<"fast" | "balanced" | "archival">("balanced");
  const [audioBitrate, setAudioBitrate] = useState<"320kbps" | "256kbps" | "192kbps">("320kbps");
  const [isFormatSwitching, setIsFormatSwitching] = useState<boolean>(false);

  // Keep local format synced with prop
  useEffect(() => {
    setCurrentFormat(videoFormat);
  }, [videoFormat]);

  const handleSelectFormat = (fmt: "MP4" | "WEBM" | "MKV" | "MOV" | "MP3") => {
    if (fmt === currentFormat) return;
    setCurrentFormat(fmt);
    setIsFormatSwitching(true);
    setTimeout(() => setIsFormatSwitching(false), 600);

    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [
      ...prev,
      {
        timestamp,
        tag: "CODEC",
        message: `REAL-TIME CONVERT SWITCH: Target container set to ${fmt} during stream phase (${progress}%). Re-routing muxer pipeline...`
      }
    ]);

    if (onFormatChange) {
      onFormatChange(fmt);
    }
  };

  // Derive logical stages
  // Stage 1: Download & Buffering (Progress 0 - 50)
  // Stage 2: Transcoding & Video Filtering (Progress 51 - 90)
  // Stage 3: Packaging & Sealing (Progress 91 - 100)
  const isDownloading = progress <= 50;
  const isTranscoding = progress > 50 && progress <= 90;
  const isPackaging = progress > 90;

  // Calculate estimates
  // We estimate about 100ms per 2-3% progress, so remaining seconds is mapped to progress
  const estRemaining = Math.max(0, ((100 - progress) * 0.08)).toFixed(1);
  
  // Custom speeds
  const [dlSpeed, setDlSpeed] = useState("45.2 MB/s");
  const [transcodeSpeed, setTranscodeSpeed] = useState("58.4 FPS");

  useEffect(() => {
    if (isDownloading) {
      const jitter = (40 + Math.random() * 15).toFixed(1);
      setDlSpeed(`${jitter} MB/s`);
    } else {
      const jitter = (50 + Math.random() * 18).toFixed(1);
      setTranscodeSpeed(`${jitter} FPS`);
    }
  }, [progress, isDownloading]);

  // Generate logs on progress milestone steps
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newLogs: LogEntry[] = [];

    if (progress === 0 && logs.length === 0) {
      newLogs.push({
        timestamp,
        tag: "CONN",
        message: `CONNECTING: Initializing multi-lane socket pipeline targeting Stream Node EP-804...`
      });
    }
    if (progress > 5 && !logs.some(l => l.message.includes("SSL HANDSHAKE"))) {
      newLogs.push({
        timestamp,
        tag: "CONN",
        message: `SSL HANDSHAKE: Cipher sequence agreed. Bypassing CDN protocol throttles.`
      });
    }
    if (progress > 15 && !logs.some(l => l.message.includes("DOWNLOADING VIDEO SECTOR"))) {
      newLogs.push({
        timestamp,
        tag: "DOWN",
        message: `DOWNLOADING VIDEO SECTOR: Fetching H.264 frame blocks for selected level (${selectedVideo})...`
      });
      if (enableTrim) {
        newLogs.push({
          timestamp,
          tag: "CODEC",
          message: `TRIM SEGMENT INITIALIZED: Constraining stream capture to timeline subset [${trimStart} -> ${trimEnd}].`
        });
      }
    }
    if (progress > 35 && !logs.some(l => l.message.includes("DOWNLOADING AUDIO STREAM"))) {
      newLogs.push({
        timestamp,
        tag: "DOWN",
        message: `DOWNLOADING AUDIO STREAM: Extracting master stream blocks for precision audio (${selectedAudio})...`
      });
    }
    if (progress > 50 && !logs.some(l => l.message.includes("INTEGRITY CHECK SUCCESS"))) {
      newLogs.push({
        timestamp,
        tag: "SYS",
        message: `INTEGRITY CHECK SUCCESS: Received all frame packets cleanly. Combined raw size: ~450 MB.`
      });
      newLogs.push({
        timestamp,
        tag: "CODEC",
        message: `TRANSCODER START: Merging and remuxing raw stream buffers into ${videoFormat} container...`
      });
    }
    if (progress > 65 && videoFilter && !logs.some(l => l.message.includes("APPLYING VIDEO FILTER"))) {
      newLogs.push({
        timestamp,
        tag: "CODEC",
        message: `APPLYING VIDEO FILTER: Rendering active canvas shader '${videoFilter}' onto frame nodes...`
      });
    } else if (progress > 65 && !videoFilter && !logs.some(l => l.message.includes("RAW STREAM bypass"))) {
      newLogs.push({
        timestamp,
        tag: "CODEC",
        message: `RAW STREAM bypass: No filter requested. Rendering pristine native colors...`
      });
    }
    if (progress > 75 && !logs.some(l => l.message.includes("ASPECT RATIO TRANSFORM"))) {
      newLogs.push({
        timestamp,
        tag: "CODEC",
        message: `ASPECT RATIO TRANSFORM: Conforming frames to selected canvas ratio [${aspectRatio}].`
      });
    }
    if (progress > 85 && watermarkText && !logs.some(l => l.message.includes("WATERMARK INJECTION"))) {
      newLogs.push({
        timestamp,
        tag: "SYS",
        message: `WATERMARK INJECTION: Rasterizing string reference '${watermarkText}' onto active frame layers.`
      });
    }
    if (progress > 90 && !logs.some(l => l.message.includes("MUTIPLEXING SUB-CHANNELS"))) {
      newLogs.push({
        timestamp,
        tag: "SYS",
        message: `MUTIPLEXING SUB-CHANNELS: Compiling metadata headers and appending offline audit hash...`
      });
    }
    if (progress >= 100 && !logs.some(l => l.message.includes("SEALING BYTE CONTAINER"))) {
      newLogs.push({
        timestamp,
        tag: "SYS",
        message: `SEALING BYTE CONTAINER: Archival extraction sealed successfully. Initiating local download trigger.`
      });
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs]);
    }
  }, [progress, videoFormat, selectedVideo, selectedAudio, videoFilter, aspectRatio, watermarkText, enableTrim, trimStart, trimEnd]);

  // Scroll to bottom of logs on update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Derive sub-progress bars
  const downloadBarProgress = Math.min(100, progress * 2);
  const transcodeBarProgress = Math.max(0, Math.min(100, (progress - 50) * 2));

  return (
    <div 
      id="extraction-progress-container"
      className="bg-[#ded9cf] border-2 border-primary p-6 space-y-6 shadow-[6px_6px_0px_rgba(26,26,26,1)] transition-all duration-300"
    >
      {/* Top Header Row */}
      <div id="extraction-progress-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse shrink-0" />
            <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span>ACTIVE PROCESSING ENGINE</span>
              <span className="text-[10px] font-mono font-bold bg-[#4f5e7c]/15 text-[#4f5e7c] px-1.5 py-0.5 border border-[#4f5e7c]/30">
                1080P_HD
              </span>
            </h4>
          </div>
          <p className="font-serif italic text-[13px] text-on-surface-variant line-clamp-1 max-w-xl">
            {title || "Target URL Stream Source"}
          </p>
        </div>

        {/* Real-time estimated statistics */}
        <div id="extraction-countdown-estimates" className="flex items-center gap-4 bg-background border border-primary/30 px-3 py-2 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Clock className="w-3.5 h-3.5 text-secondary animate-spin-slow" />
            <span className="text-on-surface-variant font-medium">EST. TIME REMAINING:</span>
            <span className="text-primary font-black uppercase text-xs">{estRemaining}s</span>
          </div>
          <div className="h-4 w-[1px] bg-primary/20" />
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Activity className="w-3.5 h-3.5 text-[#4f5e7c] animate-pulse" />
            <span className="text-on-surface-variant font-medium">PIPELINE RATE:</span>
            <span className="text-[#4f5e7c] font-black uppercase text-xs">
              {isDownloading ? dlSpeed : transcodeSpeed}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Mega Progress Bar Block with Circular Percentage Dial */}
      <div id="extraction-mega-progress-bar-wrapper" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-background p-4 border-2 border-primary shadow-[2px_2px_0px_#1b222c]">
          {/* Main Circular Progress Ring */}
          <div className="shrink-0 flex flex-col items-center">
            <CircularProgressBar
              progress={progress}
              size={110}
              strokeWidth={9}
              variant={isPackaging ? "emerald" : isTranscoding ? "sky" : "primary"}
              label="Extraction"
              sublabel={isDownloading ? "Buffering" : isTranscoding ? "Transcoding" : "Packaging"}
            />
          </div>

          {/* Linear Bar & Active Phase Highlights */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-mono font-bold text-[#4f5e7c] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
                {isDownloading && "STAGE 1: HIGH-SPEED SEGMENT BUFFERING"}
                {isTranscoding && "STAGE 2: HARDWARE-ACCELERATED TRANSCODING"}
                {isPackaging && "STAGE 3: ASSEMBLY & PACKAGING REPORT"}
              </span>
              <span className="text-sm font-mono font-black text-primary bg-surface-container px-2 py-0.5 border border-primary/20">
                {progress}% COMPLETE
              </span>
            </div>

            {/* Beautiful Swiss Brutalist Grid Progress Bar with Wave Animation */}
            <div className="relative h-7 w-full bg-surface-container border-2 border-primary overflow-hidden">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes waveFlow1 {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                @keyframes waveFlow2 {
                  0% { transform: translateX(-50%); }
                  100% { transform: translateX(0); }
                }
                @keyframes waveSway {
                  0%, 100% { transform: translateY(0) scaleY(1); }
                  50% { transform: translateY(-1.5px) scaleY(1.08); }
                }
                @keyframes pulseLeadingWave {
                  0%, 100% { opacity: 0.75; transform: scaleX(1); }
                  50% { opacity: 1; transform: scaleX(1.3); }
                }
              `}} />

              {/* Running progress fill */}
              <motion.div 
                id="extraction-mega-progress-fill"
                className="h-full bg-primary relative overflow-hidden flex items-center"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                {/* Striped overlay for elegant style */}
                <div 
                  className="absolute inset-0 opacity-10 z-10"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #e4eaf0 25%, transparent 25%, transparent 50%, #e4eaf0 50%, #e4eaf0 75%, transparent 75%, transparent)`,
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* SMOOTH WAVE ANIMATION LAYERS */}
                {progress < 100 && (
                  <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    {/* Wave Layer 1: Gold / Secondary Stream Packet Wave */}
                    <div className="absolute inset-0 w-[200%] h-full animate-[waveFlow1_8s_linear_infinite] opacity-35">
                      <svg className="w-full h-full" viewBox="0 0 1000 32" preserveAspectRatio="none" style={{ animation: "waveSway 3s ease-in-out infinite" }}>
                        <path 
                          d="M 0 14 Q 125 6, 250 14 T 500 14 T 750 14 T 1000 14 V 32 H 0 Z" 
                          fill="currentColor" 
                          className="text-secondary" 
                        />
                      </svg>
                    </div>

                    {/* Wave Layer 2: Forest Sage Decrypted Tunnel Wave */}
                    <div className="absolute inset-0 w-[200%] h-full animate-[waveFlow2_5s_linear_infinite] opacity-45">
                      <svg className="w-full h-full" viewBox="0 0 1000 32" preserveAspectRatio="none" style={{ animation: "waveSway 2.2s ease-in-out infinite alternate" }}>
                        <path 
                          d="M 0 16 Q 125 24, 250 16 T 500 16 T 750 16 T 1000 16 V 32 H 0 Z" 
                          fill="currentColor" 
                          className="text-[#4f5e7c]" 
                        />
                      </svg>
                    </div>

                    {/* Wave Layer 3: Soft highlight fine ripple */}
                    <div className="absolute inset-0 w-[200%] h-full animate-[waveFlow1_12s_linear_infinite] opacity-20">
                      <svg className="w-full h-full" viewBox="0 0 1000 32" preserveAspectRatio="none">
                        <path 
                          d="M 0 11 Q 125 15, 250 11 T 500 11 T 750 11 T 1000 11 V 32 H 0 Z" 
                          fill="white" 
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Glowing Active Crest Leading Wave Indicator */}
                {progress > 0 && progress < 100 && (
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-3 bg-secondary/80 blur-[1px] z-20 animate-[pulseLeadingWave_1.5s_ease-in-out_infinite]"
                    style={{
                      clipPath: 'polygon(100% 0, 100% 100%, 0 50%)'
                    }}
                  />
                )}
              </motion.div>

              {/* Subtle percentage guidelines overlayed above fill */}
              <div className="absolute inset-0 flex justify-between px-3 text-[8px] font-mono font-bold text-on-surface/50 z-20 pointer-events-none items-center uppercase select-none">
                <span className="bg-background/80 px-1 py-0.5 border border-primary/15">START</span>
                <span className="bg-background/80 px-1 py-0.5 border border-primary/15">25% INGEST</span>
                <span className="bg-background/80 px-1 py-0.5 border border-primary/15">50% PACKETS</span>
                <span className="bg-background/80 px-1 py-0.5 border border-primary/15">75% TRANSCODE</span>
                <span className="bg-background/80 px-1 py-0.5 border border-primary/15">SEALED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Format Conversion & Target Container Selector during Stream Ingest */}
      <div id="realtime-format-conversion-panel" className="bg-background border-2 border-primary p-4 shadow-[4px_4px_0px_#1b222c] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-secondary animate-pulse" />
            <div>
              <h5 className="font-mono text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span>REAL-TIME STREAM FORMAT CONVERSION</span>
                <span className="text-[9px] bg-secondary text-on-secondary px-1.5 py-0.2 font-mono font-black uppercase">
                  LIVE STREAM REMUX
                </span>
              </h5>
              <p className="text-[10px] font-mono text-on-surface-variant/80">
                Switch target container or bitrate on the fly while stream buffer is actively downloading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] font-mono text-primary font-bold bg-surface-container px-2.5 py-1 border border-primary/30">
            <RefreshCw className={`w-3 h-3 text-secondary ${isFormatSwitching ? "animate-spin" : ""}`} />
            <span>ACTIVE CONTAINER: .{currentFormat.toLowerCase()}</span>
          </div>
        </div>

        {/* Format Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(["MP4", "MKV", "MOV", "WEBM", "MP3"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleSelectFormat(fmt)}
              className={`p-2.5 border text-left font-mono transition-all duration-200 cursor-pointer relative ${
                currentFormat === fmt
                  ? "bg-primary text-on-primary border-primary shadow-[2px_2px_0px_#c5c0b5]"
                  : "bg-surface-container/50 hover:bg-background border-outline-variant text-on-surface hover:border-primary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase flex items-center gap-1">
                  {fmt === "MP3" ? <Music className="w-3 h-3 text-secondary" /> : <FileVideo className="w-3 h-3" />}
                  <span>.{fmt.toLowerCase()}</span>
                </span>
                {currentFormat === fmt && (
                  <Check className="w-3 h-3 text-secondary animate-scale-in" />
                )}
              </div>
              <div className={`text-[8px] uppercase tracking-tight leading-tight ${currentFormat === fmt ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                {fmt === "MP4" && "Universal H.264"}
                {fmt === "MKV" && "Matroska Remux"}
                {fmt === "MOV" && "QuickTime Apple"}
                {fmt === "WEBM" && "Open Web VP9"}
                {fmt === "MP3" && "320kbps Audio"}
              </div>
            </button>
          ))}
        </div>

        {/* Sub-settings: Transcode Quality Preset & Audio Bitrate Sampling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-primary/10">
          <div>
            <label className="text-[9px] font-mono font-bold uppercase text-on-surface-variant block mb-1">
              Transcoding Pipeline Strategy
            </label>
            <div className="flex border border-outline-variant bg-surface-container/40">
              <button
                type="button"
                onClick={() => setTranscodePreset("fast")}
                className={`flex-1 py-1 px-2 text-[9px] font-mono font-bold uppercase transition-all ${
                  transcodePreset === "fast" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Fast Stream
              </button>
              <button
                type="button"
                onClick={() => setTranscodePreset("balanced")}
                className={`flex-1 py-1 px-2 text-[9px] font-mono font-bold uppercase transition-all ${
                  transcodePreset === "balanced" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setTranscodePreset("archival")}
                className={`flex-1 py-1 px-2 text-[9px] font-mono font-bold uppercase transition-all ${
                  transcodePreset === "archival" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Lossless 4K
              </button>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold uppercase text-on-surface-variant block mb-1">
              Audio Bitrate Stream Demux
            </label>
            <div className="flex border border-outline-variant bg-surface-container/40">
              {(["320kbps", "256kbps", "192kbps"] as const).map((bit) => (
                <button
                  key={bit}
                  type="button"
                  onClick={() => setAudioBitrate(bit)}
                  className={`flex-1 py-1 px-2 text-[9px] font-mono font-bold uppercase transition-all ${
                    audioBitrate === bit ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {bit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Parallel Tracks: Download Pipeline vs. Transcode Pipeline */}
      <div id="extraction-dual-pipeline-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track 1: Download & Ingest Pipeline */}
        <div 
          id="pipeline-track-download"
          className={`p-4 border-2 transition-all duration-300 ${
            isDownloading 
              ? "bg-background border-primary shadow-[2px_2px_0px_#1b222c]" 
              : "bg-background/40 border-primary/20 opacity-80"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Download className={`w-3.5 h-3.5 ${isDownloading ? "text-secondary animate-bounce" : "text-primary"}`} />
              <span>1. Download Stream Ingest</span>
            </h5>
            <span className="text-[9px] font-mono font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 border border-secondary/20">
              {downloadBarProgress === 100 ? "BUFFERED" : `${downloadBarProgress}%`}
            </span>
          </div>
          
          <div className="h-2 w-full bg-[#ded9cf]/40 border border-primary/30 overflow-hidden mb-3">
            <div 
              className="h-full bg-secondary transition-all duration-300" 
              style={{ width: `${downloadBarProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-on-surface-variant">
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span>Lanes Connected:</span>
              <span className="text-primary font-bold">8 / 8 Active</span>
            </div>
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span>Data Ingested:</span>
              <span className="text-primary font-bold">
                {isDownloading ? `${Math.min(450, Math.floor(progress * 9))} MB` : "450 MB"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CDN Decryption:</span>
              <span className="text-[#4f5e7c] font-bold">EPHEMERAL SSL</span>
            </div>
            <div className="flex justify-between">
              <span>Buffering Target:</span>
              <span className="text-primary font-bold">Isolated RAM</span>
            </div>
          </div>
        </div>

        {/* Track 2: Transcoding & Format Packaging */}
        <div 
          id="pipeline-track-transcode"
          className={`p-4 border-2 transition-all duration-300 ${
            isTranscoding || isPackaging
              ? "bg-background border-[#4f5e7c] shadow-[2px_2px_0px_#4f5e7c]" 
              : "bg-background/40 border-primary/20 opacity-80"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-mono text-[10px] font-bold text-[#4f5e7c] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className={`w-3.5 h-3.5 ${isTranscoding ? "text-[#4f5e7c] animate-spin-slow" : "text-primary"}`} />
              <span>2. Transcoding Canvas</span>
            </h5>
            <span className="text-[9px] font-mono font-bold text-[#4f5e7c] bg-[#4f5e7c]/10 px-1.5 py-0.5 border border-[#4f5e7c]/20">
              {progress >= 100 ? "COMPLETE" : progress <= 50 ? "WAITING" : `${transcodeBarProgress}%`}
            </span>
          </div>

          <div className="h-2 w-full bg-[#ded9cf]/40 border border-primary/30 overflow-hidden mb-3">
            <div 
              className="h-full bg-[#4f5e7c] transition-all duration-300" 
              style={{ width: `${transcodeBarProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-on-surface-variant">
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span>Target Format:</span>
              <span className="text-primary font-bold">{videoFormat}</span>
            </div>
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span>Audio Preserved:</span>
              <span className="text-primary font-bold">{selectedAudio}</span>
            </div>
            <div className="flex justify-between">
              <span>Canvas Aspect:</span>
              <span className="text-primary font-bold">{aspectRatio}</span>
            </div>
            <div className="flex justify-between">
              <span>Watermark Applied:</span>
              <span className="text-[#4f5e7c] font-bold truncate max-w-[60px]" title={watermarkText || "Disabled"}>
                {watermarkText ? "ENABLED" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Shell Stream */}
      <div id="extraction-telemetry-shell" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-secondary" />
            <span>PIPELINE LOG TELEMETRY STACK</span>
          </label>
          <span className="text-[8px] font-mono bg-primary text-on-primary px-1.5 py-0.5 uppercase tracking-widest">
            REAL-TIME FEED
          </span>
        </div>

        <div 
          ref={logContainerRef}
          className="h-28 w-full bg-neutral-950 border border-primary/40 p-3 font-mono text-[10px] space-y-1 overflow-y-auto shadow-inner rounded-none select-all scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          {logs.map((log, index) => (
            <div key={index} className="flex gap-2 items-start text-neutral-300 leading-tight">
              <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
              <span className={`font-black shrink-0 ${
                log.tag === "CONN" ? "text-amber-400" :
                log.tag === "DOWN" ? "text-secondary" :
                log.tag === "CODEC" ? "text-sky-400" :
                log.tag === "SYS" ? "text-[#4f5e7c]" : "text-rose-500"
              }`}>
                [{log.tag}]
              </span>
              <span className="text-neutral-100 flex-grow select-text">{log.message}</span>
            </div>
          ))}
          
          {progress < 100 && (
            <div className="flex gap-1.5 items-center text-secondary font-bold text-[9px] animate-pulse">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
              <span>COMPUTING SUB-PIXEL VECTORS FROM MULTIPLEXED LANES...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
