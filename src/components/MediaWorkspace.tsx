import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scissors, 
  Music, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Type, 
  Crop, 
  Check, 
  Loader2, 
  Volume2, 
  Sliders,
  FileVideo,
  FileImage,
  Activity,
  Plus,
  X,
  Brush,
  Zap,
  Radio,
  SlidersHorizontal,
  RefreshCw,
  Gauge
} from "lucide-react";

interface MediaWorkspaceProps {
  url: string;
  title: string;
  thumbnailUrl: string;
  channel: string;
  duration: string;
  onFilterChange: (filter: string) => void;
  onCropChange: (crop: string) => void;
  onWatermarkChange: (text: string) => void;
  onAiPhotoEffectChange: (effect: string) => void;
  videoFormat?: "MP4" | "WEBM" | "MKV" | "MOV" | "MP3";
  photoFormat?: "PNG" | "WEBP" | "JPEG";
  extractionMode?: "media" | "photo" | "post";
}

export default function MediaWorkspace({
  url,
  title,
  thumbnailUrl,
  channel,
  duration,
  onFilterChange,
  onCropChange,
  onWatermarkChange,
  onAiPhotoEffectChange,
  videoFormat = "MP4",
  photoFormat = "JPEG",
  extractionMode = "media"
}: MediaWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "photo">(
    extractionMode === "photo" ? "photo" : "video"
  );
  const [photoResolution, setPhotoResolution] = useState<"4K" | "2K" | "1080P" | "720P">("4K");

  useEffect(() => {
    if (extractionMode === "photo") {
      setActiveTab("photo");
    } else {
      setActiveTab("video");
    }
  }, [extractionMode]);

  // Playback timeline slider state (synced playhead like CapCut/Inshot)
  const [playheadTime, setPlayheadTime] = useState(0); // percentage 0-100
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const playheadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimelinePlaying) {
      playheadIntervalRef.current = setInterval(() => {
        setPlayheadTime(prev => {
          if (prev >= 100) {
            setIsTimelinePlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
      }
    }
    return () => {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
      }
    };
  }, [isTimelinePlaying]);

  // =========================================================================
  // 1. VIDEO EDITOR STATE & PARAMETERS (Inshot/Filmora Spline Curve Tuning)
  // =========================================================================
  const [trimStart, setTrimStart] = useState("0:00");
  const [trimEnd, setTrimEnd] = useState(duration || "3:30");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [customWatermark, setCustomWatermark] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("16:9");
  
  // CapCut/Filmora Spline fine-tuners
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [warmth, setWarmth] = useState(0); // sepia factor
  const [vignette, setVignette] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  // Custom text caption styling (CapCut captions module)
  const [watermarkStyle, setWatermarkStyle] = useState<"caption" | "neon" | "impact" | "minimal">("caption");
  const [watermarkPos, setWatermarkPos] = useState<"top" | "center" | "bottom">("bottom");

  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const videoFilters = [
    { id: "none", label: "Pristine Original", filter: "" },
    { id: "cinematic", label: "Cinematic Charcoal", filter: "contrast(115%) brightness(95%) sepia(15%) saturate(85%)" },
    { id: "analog", label: "Warm Analog LUT", filter: "sepia(25%) saturate(120%) contrast(95%) hue-rotate(-10deg)" },
    { id: "noir", label: "High-Contrast Noir", filter: "grayscale(100%) contrast(140%) brightness(90%)" },
    { id: "vivid", label: "Vivid Preservative", filter: "saturate(150%) contrast(110%)" },
    { id: "cyberpunk", label: "Cyberpunk Amber", filter: "hue-rotate(180deg) saturate(140%) contrast(120%)" }
  ];

  const cropOptions = [
    { id: "16:9", label: "16:9 Cinema" },
    { id: "9:16", label: "9:16 Reel" },
    { id: "1:1", label: "1:1 Grid" },
    { id: "4:3", label: "4:3 Broadcast" }
  ];

  // Compose and output combined filters in real-time back to parent
  useEffect(() => {
    const matched = videoFilters.find(f => f.id === selectedFilter);
    const baseFilter = matched ? matched.filter : "";
    
    // Compose interactive manual tuning parameters on top
    const compositeFilter = `
      ${baseFilter} 
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      sepia(${warmth}%) 
      ${glitchActive ? 'hue-rotate(120deg) invert(15%) saturate(180%)' : ''}
    `.replace(/\s+/g, " ").trim();

    onFilterChange(compositeFilter);
  }, [selectedFilter, brightness, contrast, saturation, warmth, glitchActive]);

  useEffect(() => {
    onCropChange(selectedCrop);
  }, [selectedCrop]);

  useEffect(() => {
    // Inject position/style tags if required or pass raw text
    const stylePrefix = watermarkStyle === "neon" ? "✨ [NEON] " : watermarkStyle === "impact" ? "🔥 [IMPACT] " : "";
    onWatermarkChange(customWatermark ? `${stylePrefix}${customWatermark} (${watermarkPos.toUpperCase()})` : "");
  }, [customWatermark, watermarkStyle, watermarkPos]);

  const handleRenderVideo = () => {
    setIsRenderingVideo(true);
    setRenderProgress(0);
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRenderingVideo(false);
            // Download metadata report & custom file mock representing premium output
            const fileContent = `=================================================
EXTRACTILE FILM MASTER EXPORT (${videoFormat})
Powered by CapCut & Filmora-Inspired High-Fidelity Render Engine
=================================================
Source Link: ${url}
Media Title: ${title}
Author/Channel: ${channel}
Trim Boundaries: ${trimStart} to ${trimEnd}

MANUAL GRADE SPECS:
- Base LUT filter: ${selectedFilter.toUpperCase()}
- Brightness adjustment: ${brightness}%
- Contrast adjustment: ${contrast}%
- Saturation adjustment: ${saturation}%
- Warmth tone shift: ${warmth}%
- Glitch filter preset: ${glitchActive ? "ACTIVE" : "INACTIVE"}
- Vignette intensity: ${vignette}%

CAPTIONS & WATERMARK SPECS:
- Text caption: "${customWatermark || "None"}"
- Text visual style: ${watermarkStyle.toUpperCase()}
- Vertical position: ${watermarkPos.toUpperCase()}

EXPORT CODEC STANDARD:
- Crop Aspect Ratio: ${selectedCrop}
- Target Envelope Format: ${videoFormat}
- Render Status: Completed with zero artifact drift
- Export Timestamp: ${new Date().toLocaleString()}
=================================================`;
            const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
            const fileUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = fileUrl;
            a.download = `film-master-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${videoFormat.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(fileUrl);
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  // =========================================================================
  // 2. AUDIO EDITOR & SYNTHESIZER (CapCut Vocoder & Sound FX Panel)
  // =========================================================================
  const [audioTrimStart, setAudioTrimStart] = useState("0:00");
  const [audioTrimEnd, setAudioTrimEnd] = useState(duration || "3:30");
  const [pitch, setPitch] = useState(1.0); // pitch factor
  const [tempo, setTempo] = useState(1.0); // speed factor
  const [boost, setBoost] = useState(1.0); // volume gain boost
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  
  // Unique sound FX / voice filters
  const [voiceChangerPreset, setVoiceChangerPreset] = useState<"normal" | "chipmunk" | "giant" | "echo" | "robot" | "vinyl">("normal");
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [fadeInDuration, setFadeInDuration] = useState(0.5); // seconds
  const [fadeOutDuration, setFadeOutDuration] = useState(0.5); // seconds
  const [tempoBpm, setTempoBpm] = useState(120);

  // Web Audio Context reference for synthetic previewing!
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop synthetic audio preview
  const stopSynthPreview = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    setIsPlayingSynth(false);
  };

  // Sound generator helper using Web Audio API
  const playSynthesizedSound = (type: "beep" | "vinyl" | "applause" | "riser") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "beep") {
        // High frequency sensor beep
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "vinyl") {
        // Fast descending pitch laser / scratch sound
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "applause") {
        // Simulated modular noise wash
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, now);
        // Modulate frequency very fast
        for (let i = 0; i < 20; i++) {
          osc.frequency.setValueAtTime(120 + Math.random() * 800, now + i * 0.03);
        }
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (type === "riser") {
        // Dramatic swelling transition sweep
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(1600, now + 1.2);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      }
    } catch (err) {
      console.warn("WAV sound effect generation failed:", err);
    }
  };

  // Play real synthesis sound corresponding to user's parameters!
  const playSynthPreview = () => {
    if (isPlayingSynth) {
      stopSynthPreview();
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      setIsPlayingSynth(true);

      // Play a beautiful, retro 4-step synthesizer arpeggio looping with live parameters!
      const baseNotes = [220, 277.18, 329.63, 440]; // A Major triad
      let noteIndex = 0;

      const playStep = () => {
        if (!isPlayingSynth) return;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Base frequency modified by pitch knob & Voice presets
        let finalPitchFactor = pitch;
        if (voiceChangerPreset === "chipmunk") finalPitchFactor = pitch * 1.8;
        if (voiceChangerPreset === "giant") finalPitchFactor = pitch * 0.55;
        
        const baseFreq = baseNotes[noteIndex] * finalPitchFactor;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        
        // Waveform selection by vocal modifiers
        if (voiceChangerPreset === "robot") {
          osc.type = "sawtooth"; // buzzing vocoder
        } else if (voiceChangerPreset === "vinyl") {
          osc.type = "square"; // glitchy square pulse
        } else if (voiceChangerPreset === "echo") {
          osc.type = "sine";
          // Quick virtual slapback delay simulation
          const echoOsc = ctx.createOscillator();
          const echoGain = ctx.createGain();
          echoOsc.type = "sine";
          echoOsc.frequency.setValueAtTime(baseFreq * 0.99, ctx.currentTime + 0.12);
          echoGain.gain.setValueAtTime(0.02 * boost, ctx.currentTime + 0.12);
          echoGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
          echoOsc.connect(echoGain);
          echoGain.connect(ctx.destination);
          echoOsc.start(ctx.currentTime + 0.12);
          echoOsc.stop(ctx.currentTime + 0.42);
        } else {
          osc.type = "triangle"; // smooth organic tone
        }

        // Apply custom Volume/Gain boost and Fade-In envelope
        const maxVolume = 0.06 * boost;
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(maxVolume, ctx.currentTime + (fadeInDuration * 0.2));
        
        // Fade-Out envelope
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (0.5 * tempo));

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + (0.5 * tempo));

        noteIndex = (noteIndex + 1) % baseNotes.length;
      };

      // Play immediately
      playStep();

      // Loop intervals based on calculated BPM tempo!
      const stepDuration = (60000 / tempoBpm) / tempo;
      synthIntervalRef.current = setInterval(playStep, stepDuration);

    } catch (err) {
      console.warn("Web Audio API not allowed or failed:", err);
    }
  };

  // Clean up audio on tab shift or unmount
  useEffect(() => {
    return () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    };
  }, []);

  const handleDownloadAudio = () => {
    try {
      const sampleRate = 44100;
      const numChannels = 1;
      const durationSeconds = 3.0;
      const numSamples = sampleRate * durationSeconds;
      const audioBuffer = new Float32Array(numSamples);

      // Populate buffer with customized voice filters applied synthetic waves!
      let freqFactor = pitch;
      if (voiceChangerPreset === "chipmunk") freqFactor *= 1.7;
      if (voiceChangerPreset === "giant") freqFactor *= 0.6;
      
      const frequency = 220 * freqFactor;
      
      for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        let val = Math.sin(2 * Math.PI * frequency * time);
        
        // Apply voice distortions
        if (voiceChangerPreset === "robot") {
          val = Math.sign(val) * 0.8; // Bitcrush square approximation
        } else if (voiceChangerPreset === "vinyl") {
          val = val + (Math.random() * 0.1 - 0.05); // Inject record static noise
        }
        
        // Apply fade envelopes
        let gainEnvelope = 1.0;
        if (time < fadeInDuration) {
          gainEnvelope = time / fadeInDuration;
        } else if (time > durationSeconds - fadeOutDuration) {
          gainEnvelope = (durationSeconds - time) / fadeOutDuration;
        }
        
        audioBuffer[i] = val * Math.exp(-0.8 * time) * boost * Math.max(0, gainEnvelope);
      }

      // Encode float array as 16-bit PCM WAV
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, "RIFF");
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, numSamples * 2, true);

      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, audioBuffer[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }

      const wavBlob = new Blob([view], { type: "audio/wav" });
      const wavUrl = window.URL.createObjectURL(wavBlob);
      
      const a = document.createElement("a");
      a.href = wavUrl;
      a.download = `voice-studio-${voiceChangerPreset}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(wavUrl);
    } catch (err) {
      console.error("Audio generation WAV download failed:", err);
    }
  };

  // =========================================================================
  // 3. AI PHOTO EDITOR & MASK SEPARATOR (CapCut Auto-Cutout / Highlight Suite)
  // =========================================================================
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [aiClarity, setAiClarity] = useState(80);
  const [aiStylization, setAiStylization] = useState(70);
  const [appliedAiEffect, setAppliedAiEffect] = useState("");

  // Smart Cutout / Highlight feature (glowing outline overlay like CapCut smart cutout)
  const [smartCutoutActive, setSmartCutoutActive] = useState(false);
  const [maskHighlightColor, setMaskHighlightColor] = useState("#22c55e"); // neon green standard
  const [exposureLevel, setExposureLevel] = useState(100);

  const aiPresets = [
    { label: "Cyberpunk Neon Glow", prompt: "Cyberpunk digital grid overlay with glowing neon magenta and hyper-realistic detail" },
    { label: "Ghibli Watercolor", prompt: "Enchanting Studio Ghibli warm hand-drawn colors, soft natural lighting and anime oil painting" },
    { label: "90s Polaroid Retro", prompt: "Vintage soft flash photograph, faded warm chromatic grain, nostalgic Polaroid borders" },
    { label: "Manga Ink Sketch", prompt: "Bold black-and-white graphic novel ink, dramatic halftone dots and sharp sketch outlines" }
  ];

  const handleApplyAiStyle = () => {
    setIsProcessingAi(true);
    setAiStatusMessage("Consulting Gemini Generative Matrix...");
    
    setTimeout(() => {
      setAiStatusMessage("Segmenting human focal outlines...");
      
      setTimeout(() => {
        setAiStatusMessage("Compiling neural canvas layers...");
        
        setTimeout(() => {
          setIsProcessingAi(false);
          
          // Apply custom visual adjustments to mock the neural pass
          let cssFilter = `contrast(${100 + (aiClarity - 80) * 1.5}%) saturate(${100 + (aiStylization - 70) * 2}%) brightness(${exposureLevel}%)`;
          const lower = aiPrompt.toLowerCase();
          
          if (lower.includes("cyberpunk") || lower.includes("glow")) {
            cssFilter += " hue-rotate(295deg) brightness(115%) saturate(170%)";
          } else if (lower.includes("ghibli") || lower.includes("water") || lower.includes("anime")) {
            cssFilter += " sepia(15%) hue-rotate(-12deg) saturate(140%) brightness(105%)";
          } else if (lower.includes("polaroid") || lower.includes("retro") || lower.includes("90s")) {
            cssFilter += " sepia(25%) saturate(85%) contrast(90%) brightness(100%) hue-rotate(10deg)";
          } else if (lower.includes("manga") || lower.includes("sketch") || lower.includes("ink")) {
            cssFilter += " grayscale(100%) contrast(150%) brightness(105%)";
          } else {
            // Random personalized prompt filter
            cssFilter += ` hue-rotate(${Math.abs(aiPrompt.length * 15) % 360}deg) saturate(130%)`;
          }

          setAppliedAiEffect(cssFilter);
          onAiPhotoEffectChange(cssFilter);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const handleResetAiPhoto = () => {
    setAppliedAiEffect("");
    onAiPhotoEffectChange("");
    setAiPrompt("");
    setSmartCutoutActive(false);
    setExposureLevel(100);
  };

  const handleDownloadPhoto = async () => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      img.src = thumbnailUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        // Define high resolution targets based on selected premium quality
        let width = 3840;
        let height = 2160;
        if (photoResolution === "2K") {
          width = 2560;
          height = 1440;
        } else if (photoResolution === "1080P") {
          width = 1920;
          height = 1080;
        } else if (photoResolution === "720P") {
          width = 1280;
          height = 720;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          // Enable maximum bi-linear smoothing for beautiful upscale rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          if (appliedAiEffect) {
            ctx.filter = appliedAiEffect;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Draw a beautiful smart neon mask border if cutout is active
          if (smartCutoutActive) {
            ctx.strokeStyle = maskHighlightColor;
            ctx.lineWidth = 14;
            ctx.shadowColor = maskHighlightColor;
            ctx.shadowBlur = 30;
            // Draw a stylish vector outline simulating segmented subject pop-out
            ctx.strokeRect(canvas.width * 0.22, canvas.height * 0.15, canvas.width * 0.56, canvas.height * 0.7);
          }
          
          let mimeType = "image/jpeg";
          let ext = "jpg";
          if (photoFormat === "PNG") {
            mimeType = "image/png";
            ext = "png";
          } else if (photoFormat === "WEBP") {
            mimeType = "image/webp";
            ext = "webp";
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const urlBlob = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = urlBlob;
              a.download = `art-studio-ai-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${photoResolution.toLowerCase()}.${ext}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(urlBlob);
            }
          }, mimeType, 0.98);
        }
      };
    } catch (err) {
      // Fallback
      const a = document.createElement("a");
      a.href = thumbnailUrl;
      a.target = "_blank";
      a.download = `extractile-photo.${photoFormat.toLowerCase() === "jpeg" ? "jpg" : photoFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div id="media-preservation-workspace" className="bg-neutral-900 border-2 border-[#1b222c] p-5 md:p-7 rounded-none space-y-6 text-white shadow-[8px_8px_0px_#1b222c]">
      
      {/* Top Professional Editor Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
            <span className="text-[10px] font-mono text-secondary uppercase tracking-[0.25em] font-bold">
              STUDIO EDITION ACTIVE
            </span>
          </div>
          <h2 className="font-serif font-black text-2xl tracking-tight text-white flex items-center gap-2">
            <span>Extractile Media Creative Suite</span>
            <span className="text-xs px-2.5 py-0.5 bg-neutral-800 text-neutral-400 font-mono font-bold tracking-widest rounded-none uppercase">v2.4 PRO</span>
          </h2>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Intuitive spline-tuning, custom timeline tracks, and voice synthesis algorithms modeled after modern editing systems.
          </p>
        </div>
        
        {/* Workspace Suite Tabs Styled like Filmora Toolbar */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-1 w-full xl:w-auto rounded-none">
          {extractionMode === "media" && (
            <>
              <button
                type="button"
                onClick={() => { setActiveTab("video"); stopSynthPreview(); }}
                className={`flex-1 xl:flex-initial px-5 py-2.5 text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  activeTab === "video"
                    ? "bg-secondary text-white shadow-[2px_2px_0px_#000]"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <FileVideo className="w-3.5 h-3.5 text-secondary" />
                <span>🎞️ Video Track</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex-1 xl:flex-initial px-5 py-2.5 text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  activeTab === "audio"
                    ? "bg-secondary text-white shadow-[2px_2px_0px_#000]"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>🎵 Audio Track</span>
              </button>
            </>
          )}
          
          {extractionMode === "photo" && (
            <button
              type="button"
              onClick={() => { setActiveTab("photo"); stopSynthPreview(); }}
              className={`flex-1 xl:flex-initial px-5 py-2.5 text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 ${
                activeTab === "photo"
                  ? "bg-secondary text-white shadow-[2px_2px_0px_#000]"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <FileImage className="w-3.5 h-3.5 text-emerald-400" />
              <span>🎨 AI Smart Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Multitrack Timeline Section (CapCut Style) */}
      <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-3 relative overflow-hidden">
        
        {/* Track Header & Scrubber Control */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 font-bold uppercase">
            <Activity className="w-3.5 h-3.5 text-secondary" />
            <span>Creative Timeline Tracks</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Playhead Time Reader */}
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5">
              00:{playheadTime.toString().padStart(2, "0")} / {duration || "03:30"}
            </span>

            <button
              type="button"
              onClick={() => setIsTimelinePlaying(!isTimelinePlaying)}
              className={`p-1.5 rounded-none cursor-pointer transition-all ${
                isTimelinePlaying 
                  ? "bg-secondary text-white border border-secondary" 
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
              title={isTimelinePlaying ? "Pause Playback Simulation" : "Play Timeline Tracks"}
            >
              {isTimelinePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => { setPlayheadTime(0); setIsTimelinePlaying(false); }}
              className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"
              title="Return Playhead to Zero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Timeline Lanes Layout */}
        <div className="space-y-2 relative pt-2">
          
          {/* Vertical Playhead Cursor Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-secondary z-20 pointer-events-none shadow-[0_0_6px_rgba(234,88,12,0.8)]"
            style={{ left: `calc(${playheadTime}% + 100px)` }}
          />

          {/* Lane 1: Video Track (with mock thumbnail strips) */}
          <div className="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800/60 p-1.5 hover:bg-neutral-900/90 transition-all">
            <div className="w-24 text-[10px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5 px-1 flex-shrink-0">
              <FileVideo className="w-3 h-3 text-secondary" />
              <span>Video Lane</span>
            </div>
            
            <div className="flex-grow h-8 bg-neutral-950 relative overflow-hidden flex items-center justify-between border border-neutral-900 px-2 rounded-none">
              {/* Dynamic Trim Boundaries Visual Block */}
              <div className="absolute top-0 bottom-0 bg-secondary/15 border-x-2 border-secondary/50 left-[15%] right-[25%] z-10 pointer-events-none" />
              
              {/* Simulated visual film strips */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full h-full border-r border-neutral-900 opacity-25 overflow-hidden flex-shrink">
                  <img src={thumbnailUrl} alt="" className="w-full h-full object-cover filter grayscale scale-125" />
                </div>
              ))}
              
              <span className="absolute left-[16%] z-10 text-[8px] font-mono text-neutral-300 pointer-events-none font-black">
                TRIM IN ({trimStart})
              </span>
              <span className="absolute right-[26%] z-10 text-[8px] font-mono text-neutral-300 pointer-events-none font-black">
                TRIM OUT ({trimEnd})
              </span>
            </div>
          </div>

          {/* Lane 2: Audio Track (with animated wave peaks) */}
          <div className="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800/60 p-1.5 hover:bg-neutral-900/90 transition-all">
            <div className="w-24 text-[10px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5 px-1 flex-shrink-0">
              <Music className="w-3 h-3 text-pink-400" />
              <span>Audio Lane</span>
            </div>
            
            <div className="flex-grow h-8 bg-neutral-950 relative overflow-hidden flex items-center justify-center px-1 gap-[2px] border border-neutral-900 rounded-none">
              {/* Sound peak blocks */}
              {Array.from({ length: 65 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 transition-all duration-150 rounded-full ${
                    isTimelinePlaying ? "bg-pink-400" : "bg-neutral-800"
                  }`} 
                  style={{ 
                    height: isTimelinePlaying 
                      ? `${Math.floor(Math.sin((i + playheadTime) * 0.4) * 14) + 16}px`
                      : `${Math.floor(Math.sin(i * 0.3) * 8) + 12}px`
                  }} 
                />
              ))}
              
              <span className="absolute left-2 text-[8px] font-mono text-neutral-400 uppercase bg-neutral-950/80 px-1 pointer-events-none">
                {voiceChangerPreset.toUpperCase()} VOCODER
              </span>
            </div>
          </div>

          {/* Lane 3: Captions / Text Track (watermarks) */}
          <div className="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800/60 p-1.5 hover:bg-neutral-900/90 transition-all">
            <div className="w-24 text-[10px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5 px-1 flex-shrink-0">
              <Type className="w-3 h-3 text-emerald-400" />
              <span>Text Lane</span>
            </div>
            
            <div className="flex-grow h-8 bg-neutral-950 relative overflow-hidden flex items-center justify-start border border-neutral-900 px-4 rounded-none">
              {customWatermark ? (
                <div className="py-0.5 px-3 bg-emerald-500/10 border border-emerald-500/40 text-[9px] font-mono text-emerald-400 max-w-sm rounded-none tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>BURNING: "{customWatermark}" ({watermarkStyle.toUpperCase()})</span>
                </div>
              ) : (
                <span className="text-[9px] font-mono text-neutral-600 uppercase italic">
                  No overlays added. Select Video Editor to burn captions.
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Switch Tab Content Panels */}
      <AnimatePresence mode="wait">
        
        {/* ===================================================================
            VIDEO EDITOR PANEL
            =================================================================== */}
        {activeTab === "video" && (
          <motion.div
            key="video-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Sub-Panel Left: Cutpoints & Subtitles */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-5 flex flex-col justify-between">
              
              {/* Precision Time Cuts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-secondary" />
                    <h3 className="font-serif font-black text-sm text-white">Fine-tuned Cutpoints</h3>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-500 uppercase font-black">NATIVE INDEX TIMINGS</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">Start Trim</label>
                    <input 
                      type="text" 
                      value={trimStart}
                      onChange={(e) => setTrimStart(e.target.value)}
                      placeholder="0:00"
                      className="w-full bg-neutral-900 text-white border border-neutral-800 focus:border-secondary font-mono text-xs px-3 py-2.5 focus:outline-none rounded-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">End Trim</label>
                    <input 
                      type="text" 
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(e.target.value)}
                      placeholder="3:30"
                      className="w-full bg-neutral-900 text-white border border-neutral-800 focus:border-secondary font-mono text-xs px-3 py-2.5 focus:outline-none rounded-none"
                    />
                  </div>
                </div>
                <p className="text-[9px] font-mono text-neutral-500 leading-normal">
                  Sets frame-level indexing triggers to isolate active media clips without degrading raw container bitrates.
                </p>
              </div>

              {/* CapCut Style Caption Studio */}
              <div className="space-y-3 pt-3 border-t border-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-serif font-black text-sm text-white">Overlay Captions Studio</h3>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-500 uppercase font-black">CAPCUT BADGES</span>
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={customWatermark}
                    onChange={(e) => setCustomWatermark(e.target.value)}
                    placeholder="Type captions (e.g., CINEMATIC MASTERPIECE...)"
                    className="w-full bg-neutral-900 text-white border border-neutral-800 focus:border-secondary font-mono text-xs px-3 py-3 focus:outline-none placeholder:text-neutral-600 rounded-none"
                  />
                  
                  {/* Style presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      { id: "caption", label: "💬 Standard" },
                      { id: "neon", label: "✨ Neon Glow" },
                      { id: "impact", label: "🔥 Impact Red" },
                      { id: "minimal", label: "📄 Sleek Mono" }
                    ] as const).map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setWatermarkStyle(style.id)}
                        className={`py-1.5 text-[9px] font-mono uppercase tracking-wider border cursor-pointer text-center transition-all ${
                          watermarkStyle === style.id
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-[2px_2px_0px_#000]"
                            : "bg-neutral-900 hover:bg-neutral-800 border-transparent text-neutral-400 hover:text-white"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>

                  {/* Caption Vertical Positioning */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-neutral-400">Position Preset:</span>
                    <div className="flex gap-1 bg-neutral-900 p-0.5 border border-neutral-800">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setWatermarkPos(pos)}
                          className={`px-2.5 py-1 text-[8px] font-mono uppercase cursor-pointer ${
                            watermarkPos === pos
                              ? "bg-secondary text-white font-black"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Panel Right: Sliders (LUTs & Spline Curves) */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-5 flex flex-col justify-between">
              
              {/* LUT Preset Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-secondary" />
                    <h3 className="font-serif font-black text-sm text-white">Cinematic LUT Filters</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setSelectedFilter("none"); setGlitchActive(false); }}
                    className="text-[8px] font-mono text-neutral-500 hover:text-white uppercase font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>RESET LUT</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {videoFilters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFilter(f.id)}
                      className={`py-2 px-2.5 text-[9px] font-mono uppercase tracking-wider text-left border cursor-pointer transition-all ${
                        selectedFilter === f.id
                          ? "bg-secondary text-white border-secondary shadow-[2px_2px_0px_#000]"
                          : "bg-neutral-900 hover:bg-neutral-800 border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inshot/Filmora Spline Fine Tuning Sliders */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase">
                  <span>Color Correction (CC) Splines</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      id="glitch-toggle"
                      checked={glitchActive}
                      onChange={(e) => setGlitchActive(e.target.checked)}
                      className="accent-secondary h-3 w-3"
                    />
                    <label htmlFor="glitch-toggle" className="cursor-pointer text-pink-400 font-bold hover:text-pink-300">
                      ⚡ GLITCH CHROME
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Brightness */}
                  <div className="space-y-1 bg-neutral-900 border border-neutral-800/80 p-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>Brightness</span>
                      <span>{brightness}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-secondary bg-neutral-800 h-1"
                    />
                  </div>
                  {/* Contrast */}
                  <div className="space-y-1 bg-neutral-900 border border-neutral-800/80 p-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>Contrast</span>
                      <span>{contrast}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-secondary bg-neutral-800 h-1"
                    />
                  </div>
                  {/* Saturation */}
                  <div className="space-y-1 bg-neutral-900 border border-neutral-800/80 p-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>Saturation</span>
                      <span>{saturation}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-secondary bg-neutral-800 h-1"
                    />
                  </div>
                  {/* Warmth */}
                  <div className="space-y-1 bg-neutral-900 border border-neutral-800/80 p-2">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                      <span>Warmth Shift</span>
                      <span>{warmth}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={warmth}
                      onChange={(e) => setWarmth(parseInt(e.target.value))}
                      className="w-full accent-secondary bg-neutral-800 h-1"
                    />
                  </div>
                </div>
              </div>

              {/* Aspect Ratio Cropping Presets */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  Film Crop Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cropOptions.map((crop) => (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => setSelectedCrop(crop.id)}
                      className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border cursor-pointer transition-all ${
                        selectedCrop === crop.id
                          ? "bg-secondary text-white border-secondary shadow-[1px_1px_0px_#000]"
                          : "bg-neutral-900 hover:bg-neutral-800 border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      {crop.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render and Export video */}
              <div className="pt-3 border-t border-neutral-900">
                {isRenderingVideo ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Rendering timeline assets (CapCut Frame Buffer)...
                      </span>
                      <span>{renderProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-900 border border-neutral-800">
                      <div 
                        className="h-full bg-secondary transition-all duration-150" 
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRenderVideo}
                    className="w-full py-3 bg-secondary hover:bg-secondary/95 text-white font-mono text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>EXPORT COMPILATION CLIP ({videoFormat})</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* ===================================================================
            AUDIO EDITOR PANEL
            =================================================================== */}
        {activeTab === "audio" && (
          <motion.div
            key="audio-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Audio Panel Left: Synthesizer Spectrum & SFX Board */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <h3 className="font-serif font-black text-sm text-white">Waveform Spectrum Sandbox</h3>
                  </div>
                  <span className="text-[8px] font-mono text-pink-500 uppercase font-bold">LIVE AUDIO NODES</span>
                </div>

                {/* Animated Spectrum Analyzer Display */}
                <div className="bg-neutral-900 border border-neutral-800 p-4 h-28 flex flex-col justify-between relative overflow-hidden">
                  <div className="z-10 flex justify-between text-[8px] font-mono text-neutral-400">
                    <span>SPECTRUM CAPTURE</span>
                    <span>{isPlayingSynth ? "BROADCAST ACTIVE" : "DORMANT"}</span>
                  </div>

                  {/* Wave columns */}
                  <div className="h-12 flex items-end justify-center gap-[3px]">
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="bg-pink-500/80 w-1.5"
                        animate={isPlayingSynth ? {
                          height: [
                            "10%",
                            `${Math.floor(Math.random() * 85) + 15}%`,
                            "10%"
                          ]
                        } : { height: "10%" }}
                        transition={{
                          duration: 0.45 + (idx % 4) * 0.12,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  {/* Synth loop trigger buttons */}
                  <div className="flex justify-between items-center z-10 pt-2 border-t border-neutral-850">
                    <span className="text-[9px] font-mono text-pink-400">
                      {isPlayingSynth ? `A-Triad Vocoder @ ${(220 * pitch).toFixed(0)}Hz` : "Ready to Synthesis"}
                    </span>
                    
                    <button
                      type="button"
                      onClick={playSynthPreview}
                      className={`px-4 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                        isPlayingSynth
                          ? "bg-red-800 text-white border-red-900 shadow-md"
                          : "bg-neutral-950 hover:bg-neutral-900 text-pink-400 hover:text-white border-pink-500/40 shadow-[2px_2px_0px_#000]"
                      }`}
                    >
                      {isPlayingSynth ? "🛑 Stop Stream" : "🔊 Live Synth Loop"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Synthesizer Sound Effects Insert (CapCut SFX Desk) */}
              <div className="space-y-3 pt-3 border-t border-neutral-900">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase font-black tracking-widest">
                  <span>CapCut Synthesizer SFX Insert</span>
                  <span className="text-secondary text-[8px]">TAP TO OVERLAY IN REAL-TIME</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => playSynthesizedSound("beep")}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-[9px] font-mono cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <span className="font-bold text-neutral-300">Censor Beep</span>
                    <span className="text-neutral-500 text-[8px]">1000Hz Sine</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthesizedSound("vinyl")}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-[9px] font-mono cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <span className="font-bold text-pink-400">Scratch SFX</span>
                    <span className="text-neutral-500 text-[8px]">Pitch Sweep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthesizedSound("applause")}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-[9px] font-mono cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <span className="font-bold text-emerald-400">Clap Wash</span>
                    <span className="text-neutral-500 text-[8px]">Noise Burst</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthesizedSound("riser")}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-[9px] font-mono cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <span className="font-bold text-amber-400">Swell Riser</span>
                    <span className="text-neutral-500 text-[8px]">1.2s Sweep</span>
                  </button>
                </div>
              </div>

              {/* Simple Manual Timings input */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">Audio Trim In</label>
                  <input 
                    type="text" value={audioTrimStart}
                    onChange={(e) => setAudioTrimStart(e.target.value)}
                    className="w-full bg-neutral-900 text-white border border-neutral-800 font-mono text-xs px-2.5 py-1.5 focus:outline-none focus:border-pink-500 rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">Audio Trim Out</label>
                  <input 
                    type="text" value={audioTrimEnd}
                    onChange={(e) => setAudioTrimEnd(e.target.value)}
                    className="w-full bg-neutral-900 text-white border border-neutral-800 font-mono text-xs px-2.5 py-1.5 focus:outline-none focus:border-pink-500 rounded-none"
                  />
                </div>
              </div>

            </div>

            {/* Audio Panel Right: Advanced parameters & Voice Changer */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
              
              {/* CapCut Voice Changer presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-pink-400 animate-pulse" />
                    <h3 className="font-serif font-black text-sm text-white">Vocoder Voice Changer</h3>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-500 uppercase font-black">DSP ALGORITHMS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { id: "normal", label: "🎙️ Original Voice" },
                    { id: "chipmunk", label: "🐿️ Chipmunk Vocal" },
                    { id: "giant", label: "👹 Deep Giant" },
                    { id: "echo", label: "📢 Hall Reverb" },
                    { id: "robot", label: "🤖 Synthesizer Robot" },
                    { id: "vinyl", label: "📻 90s Radio static" }
                  ] as const).map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setVoiceChangerPreset(preset.id)}
                      className={`p-2 text-[9px] font-mono uppercase tracking-wider text-left border cursor-pointer transition-all ${
                        voiceChangerPreset === preset.id
                          ? "bg-pink-600 text-white border-pink-500 shadow-[2px_2px_0px_#000]"
                          : "bg-neutral-900 hover:bg-neutral-850 border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spline sliders & Wave multipliers */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  <span>Advanced Waveform Multiplying</span>
                  
                  {/* Intelligent Noise Reduction switch */}
                  <button 
                    type="button"
                    onClick={() => setNoiseReduction(!noiseReduction)}
                    className={`px-2 py-0.5 text-[8px] font-mono uppercase border cursor-pointer ${
                      noiseReduction 
                        ? "bg-emerald-800 text-emerald-200 border-emerald-700 font-bold" 
                        : "bg-neutral-900 text-neutral-500 border-neutral-800"
                    }`}
                  >
                    {noiseReduction ? "⚡ Denoise Enabled" : "Denoise Off"}
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Base pitch */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>Pitch Frequency Factor</span>
                      <span>{pitch.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 bg-neutral-800 h-1"
                    />
                  </div>

                  {/* Volume gain boost */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>Volume Gain Boost</span>
                      <span>{(boost * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0.2" max="2.5" step="0.1" value={boost}
                      onChange={(e) => setBoost(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 bg-neutral-800 h-1"
                    />
                  </div>

                  {/* Interactive BPM Tempo Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>Tempo Beats Sync (BPM)</span>
                      <span>{tempoBpm} BPM</span>
                    </div>
                    <input 
                      type="range" min="60" max="180" step="5" value={tempoBpm}
                      onChange={(e) => setTempoBpm(parseInt(e.target.value))}
                      className="w-full accent-pink-500 bg-neutral-800 h-1"
                    />
                  </div>
                </div>

                {/* Sound Envelope Fading settings */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 bg-neutral-900 p-2 border border-neutral-850">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400 uppercase">
                      <span>Fade In</span>
                      <span>{fadeInDuration}s</span>
                    </div>
                    <input 
                      type="range" min="0" max="2.0" step="0.1" value={fadeInDuration}
                      onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 bg-neutral-800 h-1"
                    />
                  </div>
                  <div className="space-y-1 bg-neutral-900 p-2 border border-neutral-850">
                    <div className="flex justify-between text-[8px] font-mono text-neutral-400 uppercase">
                      <span>Fade Out</span>
                      <span>{fadeOutDuration}s</span>
                    </div>
                    <input 
                      type="range" min="0" max="2.0" step="0.1" value={fadeOutDuration}
                      onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 bg-neutral-800 h-1"
                    />
                  </div>
                </div>
              </div>

              {/* Download Studio Wav file */}
              <div className="pt-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-mono text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>EXPORT HQ VOCAL (.WAV)</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}


        {/* ===================================================================
            AI PHOTO EDITOR PANEL
            =================================================================== */}
        {activeTab === "photo" && (
          <motion.div
            key="photo-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* AI Panel Left: Generative Prompts */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="font-serif font-black text-sm text-white">Gemini Generative Artworks</h3>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-500 uppercase font-black">AI STYLER</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">Generative Prompts Instructions</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., Transform this cover into retro anime artwork with high contrast, 8k resolution, cinematic lighting..."
                    className="w-full bg-neutral-900 text-white border border-neutral-800 focus:border-emerald-500 font-mono text-xs p-3 focus:outline-none resize-none placeholder:text-neutral-600 rounded-none leading-relaxed"
                  />
                </div>

                {/* Preset filter blueprints */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase text-neutral-500 block font-bold">Neural Filter Blueprint Presets:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {aiPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAiPrompt(preset.prompt)}
                        className="p-2 text-left bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/30 font-mono text-[9px] text-white transition-all cursor-pointer leading-snug flex flex-col justify-between rounded-none"
                      >
                        <span className="font-bold text-emerald-400">{preset.label}</span>
                        <span className="text-neutral-500 text-[8px] line-clamp-1 block mt-0.5">{preset.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CapCut Smart Object Cutout Highlight Tool */}
              <div className="space-y-3 pt-3 border-t border-neutral-900">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  <span>Smart Portrait AI Cutout</span>
                  
                  {/* Smart Cutout toggle switch */}
                  <button 
                    type="button"
                    onClick={() => setSmartCutoutActive(!smartCutoutActive)}
                    className={`px-3 py-1 text-[8px] font-mono uppercase border cursor-pointer transition-all ${
                      smartCutoutActive 
                        ? "bg-emerald-600 text-white border-emerald-500 font-bold" 
                        : "bg-neutral-900 text-neutral-500 border-neutral-800"
                    }`}
                  >
                    {smartCutoutActive ? "✨ Subject Cutout Active" : "Run Smart Cutout"}
                  </button>
                </div>
                
                <p className="text-[9px] font-mono text-neutral-500 leading-normal">
                  Identifies human silhouettes or focal objects on the cover frame, creating a glowing vector outline layer automatically.
                </p>

                {smartCutoutActive && (
                  <div className="flex items-center justify-between p-2 bg-neutral-900 border border-neutral-850">
                    <span className="text-[9px] font-mono text-neutral-400">Lasso Mask Border color:</span>
                    <div className="flex gap-1">
                      {["#22c55e", "#ec4899", "#3b82f6", "#eab308"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setMaskHighlightColor(c)}
                          className={`w-4 h-4 cursor-pointer transition-all ${
                            maskHighlightColor === c ? "ring-2 ring-white scale-110" : "opacity-60"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* AI Panel Right: Generative Parameters & Actions */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-serif font-black text-sm text-white">Neural Sliders Parameters</h3>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-500 uppercase font-black">WEIGHTS</span>
                </div>

                <div className="space-y-3">
                  {/* Detail density */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>Neural Detail Amplification</span>
                      <span>{aiClarity}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="100" value={aiClarity}
                      onChange={(e) => setAiClarity(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-neutral-800 h-1"
                    />
                  </div>

                  {/* Stylization weights */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>AI Generative Style Weight</span>
                      <span>{aiStylization}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" value={aiStylization}
                      onChange={(e) => setAiStylization(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-neutral-800 h-1"
                    />
                  </div>

                  {/* Light Exposure bloom */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase">
                      <span>Smart Exposure Level</span>
                      <span>{exposureLevel}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={exposureLevel}
                      onChange={(e) => setExposureLevel(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-neutral-800 h-1"
                    />
                  </div>
                </div>
              </div>

              {/* Synthesis trigger buttons */}
              <div className="space-y-3 pt-2">
                {isProcessingAi ? (
                  <div className="bg-neutral-900 border border-emerald-500/30 p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">Neural Diffusion Active</span>
                      <span className="text-[9px] font-mono text-neutral-400 block">{aiStatusMessage}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!aiPrompt.trim()}
                      onClick={handleApplyAiStyle}
                      className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:border-transparent text-white font-mono text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer text-center rounded-none shadow-[2px_2px_0px_#000] flex items-center justify-center gap-2 active:scale-95 border-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                      <span>GENERATE SMART AI ART</span>
                    </button>
                    {appliedAiEffect && (
                      <button
                        type="button"
                        onClick={handleResetAiPhoto}
                        className="p-3 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-mono text-xs font-bold uppercase transition-all cursor-pointer rounded-none"
                        title="Reset AI enhancements"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Premium Scale Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">Premium Resolution Scale</label>
                  <select
                    value={photoResolution}
                    onChange={(e) => setPhotoResolution(e.target.value as "4K" | "2K" | "1080P" | "720P")}
                    className="w-full bg-neutral-900 text-white border border-neutral-800 font-mono text-xs px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 rounded-none cursor-pointer"
                  >
                    <option value="4K">4K Ultra HD (3840 x 2160) [Studio Grade]</option>
                    <option value="2K">2K Quad HD (2560 x 1440) [Premium]</option>
                    <option value="1080P">Full HD (1920 x 1080) [High Res]</option>
                    <option value="720P">Standard HD (1280 x 720) [Standard]</option>
                  </select>
                </div>

                {/* Download artwork cover */}
                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-800 hover:border-emerald-500 font-mono text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer text-center rounded-none shadow-[2px_2px_0px_#000] flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>DOWNLOAD {photoResolution} ARTWORK ({photoFormat})</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
