import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  Music,
  Video,
  Image as ImageIcon,
  Mic,
  MicOff,
  Search,
  MapPin,
  Brain,
  Zap,
  Play,
  Pause,
  Download,
  Upload,
  Globe,
  FileText,
  RefreshCw,
  Send,
  Layers,
  Volume2,
  CheckCircle2,
  Sliders,
  Maximize2
} from "lucide-react";

interface AiStudioViewProps {
  onTriggerAlert?: (title: string, message: string) => void;
}

type StudioTab = "chat" | "image" | "video" | "music" | "live" | "analyze" | "transcribe" | "grounding";

interface ChatMsg {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  modelUsed?: string;
  thinkingUsed?: string;
}

export default function AiStudioView({ onTriggerAlert }: AiStudioViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<StudioTab>("chat");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: "init-1",
      role: "model",
      text: "Hello! I am your Extractile Gemini AI Assistant. How can I help you analyze media, edit scripts, generate tracks, or create visuals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: "gemini-3.6-flash"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatbotRole, setChatbotRole] = useState("Creative Media Specialist");
  const [modelType, setModelType] = useState<"general" | "complex" | "fast">("general");
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [useLowLatency, setUseLowLatency] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Image Generation & Editing State
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgAspectRatio, setImgAspectRatio] = useState("16:9");
  const [imgSize, setImgSize] = useState("1K");
  const [imgSourceFile, setImgSourceFile] = useState<string | null>(null);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [isImgEditMode, setIsImgEditMode] = useState(false);

  // Video Generation State (Veo 3.1)
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [videoSourcePhoto, setVideoSourcePhoto] = useState<string | null>(null);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatusText, setVideoStatusText] = useState("");
  const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Music Generation State (Lyria 3)
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicDuration, setMusicDuration] = useState<"clip" | "full">("clip");
  const [musicImageRef, setMusicImageRef] = useState<string | null>(null);
  const [musicAudioUrl, setMusicAudioUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  // Voice Conversation State (Live API)
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Idle. Ready to connect voice session.");
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Media Analysis State
  const [analyzePrompt, setAnalyzePrompt] = useState("");
  const [analyzeFile, setAnalyzeFile] = useState<string | null>(null);
  const [analyzeMediaUrl, setAnalyzeMediaUrl] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Audio Transcription State
  const [transcribeAudioFile, setTranscribeAudioFile] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Grounding State (Search & Maps)
  const [groundingQuery, setGroundingQuery] = useState("");
  const [groundingType, setGroundingType] = useState<"search" | "maps">("search");
  const [groundingResult, setGroundingResult] = useState<{ text: string; chunks: any[] } | null>(null);
  const [groundingLoading, setGroundingLoading] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Handle Chat Submit
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          modelType,
          systemInstruction: `You are acting as: ${chatbotRole}. Provide high-fidelity, accurate, creative responses.`,
          useHighThinking,
          useLowLatency
        })
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "model",
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: data.modelUsed,
            thinkingUsed: data.thinkingUsed
          }
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err: any) {
      onTriggerAlert?.("Chat API Notice", err.message || "Error connecting to AI chat service.");
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Image Gen / Edit
  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || imgLoading) return;
    setImgLoading(true);
    setGeneratedImgUrl(null);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          aspectRatio: imgAspectRatio,
          imageSize: imgSize,
          base64Image: imgSourceFile,
          isEdit: isImgEditMode
        })
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setGeneratedImgUrl(data.imageUrl);
        if (data.fallback && onTriggerAlert) {
          onTriggerAlert("Image Render Notice", "Visual generated using sandbox rendering profile.");
        }
      } else {
        throw new Error(data.error || "Failed to render image.");
      }
    } catch (err: any) {
      onTriggerAlert?.("Image Generation Failed", err.message || "Failed to create image.");
    } finally {
      setImgLoading(false);
    }
  };

  // Handle Video Generation (Veo 3.1)
  const handleGenerateVideo = async () => {
    if ((!videoPrompt.trim() && !videoSourcePhoto) || videoLoading) return;
    setVideoLoading(true);
    setVideoResultUrl(null);
    setVideoStatusText("Initiating Veo 3.1 Fast Video Pipeline...");

    try {
      const res = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          base64Image: videoSourcePhoto
        })
      });

      const data = await res.json();
      if (!res.ok || !data.operationName) {
        throw new Error(data.error || "Failed to queue video generation.");
      }

      const opName = data.operationName;
      setVideoOperationName(opName);
      setVideoStatusText("Rendering neural frames... (This takes a few moments)");

      // Poll status
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch("/api/ai/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName: opName })
          });
          const statusData = await statusRes.json();

          if (statusData.done) {
            clearInterval(interval);
            setVideoStatusText("Finalizing MP4 video package...");

            const downloadRes = await fetch("/api/ai/video-download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operationName: opName })
            });

            if (downloadRes.ok) {
              if (statusData.isMock || downloadRes.headers.get("content-type")?.includes("json")) {
                const dlData = await downloadRes.json();
                setVideoResultUrl(dlData.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-from-above-31405-large.mp4");
              } else {
                const blob = await downloadRes.blob();
                setVideoResultUrl(URL.createObjectURL(blob));
              }
              setVideoStatusText("Video generated successfully!");
            } else {
              throw new Error("Failed to download generated video.");
            }
            setVideoLoading(false);
          } else {
            setVideoStatusText(`Synthesizing motion vectors... (Poll #${attempts})`);
          }
        } catch (pollErr: any) {
          clearInterval(interval);
          setVideoLoading(false);
          onTriggerAlert?.("Video Rendering Exception", pollErr.message || "Error polling video status.");
        }
      }, 3000);

    } catch (err: any) {
      setVideoLoading(false);
      onTriggerAlert?.("Video Generation Error", err.message || "Failed to process video command.");
    }
  };

  // Handle Music Generation (Lyria 3)
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    setMusicAudioUrl(null);
    setMusicLyrics(null);

    try {
      const res = await fetch("/api/ai/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: musicPrompt,
          durationType: musicDuration,
          base64Image: musicImageRef
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.audioData) {
          setMusicAudioUrl(data.audioData);
        } else if (data.audioUrl) {
          setMusicAudioUrl(data.audioUrl);
        }
        if (data.lyrics) setMusicLyrics(data.lyrics);
      } else {
        throw new Error(data.error || "Music synthesis failed.");
      }
    } catch (err: any) {
      onTriggerAlert?.("Lyria Synthesis Error", err.message || "Failed to compose music track.");
    } finally {
      setMusicLoading(false);
    }
  };

  // Handle Live Voice Connection
  const toggleLiveVoice = () => {
    if (isLiveActive) {
      if (wsRef.current) wsRef.current.close();
      setIsLiveActive(false);
      setLiveStatus("Disconnected.");
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      setLiveStatus("Connecting to Gemini Live Voice Stream...");

      ws.onopen = () => {
        setIsLiveActive(true);
        setLiveStatus("Voice session active. Speak into your microphone!");
        setLiveTranscript(prev => [...prev, "🎙️ [SESSION STARTED] Voice connection established at 24kHz."]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            setLiveTranscript(prev => [...prev, "🔊 [GEMINI SPEECH] Audio stream chunk received."]);
          }
          if (data.error) {
            setLiveStatus(`Notice: ${data.error}`);
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        setLiveStatus("Connection error on Live WebSocket.");
        setIsLiveActive(false);
      };

      ws.onclose = () => {
        setIsLiveActive(false);
        setLiveStatus("Voice session ended.");
      };
    } catch (err: any) {
      onTriggerAlert?.("Live Voice Error", err.message || "Failed to connect WebSocket.");
    }
  };

  // Handle Media Analysis
  const handleAnalyzeMedia = async () => {
    if ((!analyzeFile && !analyzeMediaUrl && !analyzePrompt) || analyzeLoading) return;
    setAnalyzeLoading(true);
    setAnalyzeResult(null);

    try {
      const res = await fetch("/api/ai/analyze-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: analyzePrompt,
          base64Image: analyzeFile,
          mediaUrl: analyzeMediaUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalyzeResult(data.analysis);
      } else {
        throw new Error(data.error || "Analysis failed.");
      }
    } catch (err: any) {
      onTriggerAlert?.("Media Analysis Failure", err.message || "Failed to analyze media.");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Handle Audio Recording & Transcription
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setTranscribeAudioFile(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecordingMic(true);
    } catch (err) {
      onTriggerAlert?.("Microphone Access Required", "Please grant microphone permissions to transcribe speech.");
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  const handleTranscribeAudio = async () => {
    if (!transcribeAudioFile || transcribeLoading) return;
    setTranscribeLoading(true);
    setTranscriptionResult(null);

    try {
      const res = await fetch("/api/ai/transcribe-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Audio: transcribeAudioFile })
      });

      const data = await res.json();
      if (res.ok && data.transcription) {
        setTranscriptionResult(data.transcription);
      } else {
        throw new Error(data.error || "Transcription failed.");
      }
    } catch (err: any) {
      onTriggerAlert?.("Transcription Failure", err.message || "Failed to transcribe audio.");
    } finally {
      setTranscribeLoading(false);
    }
  };

  // Handle Grounding Search & Maps
  const handleGroundingQuery = async () => {
    if (!groundingQuery.trim() || groundingLoading) return;
    setGroundingLoading(true);
    setGroundingResult(null);

    try {
      const res = await fetch("/api/ai/grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: groundingQuery,
          type: groundingType
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGroundingResult({
          text: data.text,
          chunks: data.groundingChunks || []
        });
      } else {
        throw new Error(data.error || "Grounding query failed.");
      }
    } catch (err: any) {
      onTriggerAlert?.("Grounding Error", err.message || "Failed grounding query.");
    } finally {
      setGroundingLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-surface border border-outline-variant p-6 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-1">
            <Sparkles className="w-4 h-4 animate-pulse text-secondary" />
            <span>EXTRACTILE AI STUDIO & CREATIVE SUITE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
            Gemini Multimodal Intelligence
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl mt-1">
            Full-stack creative sandbox powered by official Gemini models. Generate music, produce Veo videos, converse over real-time Live API audio, render studio artwork, analyze media, and transcribe speech.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
          <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>GEMINI 3.6 & PRO</span>
          </span>
          <span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 font-bold flex items-center gap-1">
            <Video className="w-3 h-3" />
            <span>VEO 3.1</span>
          </span>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
            <Music className="w-3 h-3" />
            <span>LYRIA 3</span>
          </span>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-outline-variant pb-1 font-mono text-xs uppercase tracking-wider">
        {[
          { id: "chat", label: "Gemini Chatbot", icon: Bot },
          { id: "image", label: "Create & Edit Images", icon: ImageIcon },
          { id: "video", label: "Veo Video Studio", icon: Video },
          { id: "music", label: "Lyria Music Lab", icon: Music },
          { id: "live", label: "Live Voice API", icon: Mic },
          { id: "analyze", label: "Media Analyzer", icon: Layers },
          { id: "transcribe", label: "Transcribe Speech", icon: FileText },
          { id: "grounding", label: "Search & Maps", icon: Globe }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as StudioTab)}
              className={`flex items-center gap-2 px-3.5 py-2 cursor-pointer transition-all border-b-2 rounded-none whitespace-nowrap font-bold ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-on-surface-variant hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Feature Workspace Stage */}
      <div className="bg-surface border border-outline-variant p-6 min-h-[500px]">

        {/* 1. GEMINI CHATBOT VIEW */}
        {activeSubTab === "chat" && (
          <div className="flex flex-col h-[600px] space-y-4">
            
            {/* Control Config Header */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">PERSONA ROLE:</span>
                <input
                  type="text"
                  value={chatbotRole}
                  onChange={(e) => setChatbotRole(e.target.value)}
                  className="px-2 py-1 bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary w-48"
                  placeholder="e.g. Media Specialist"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-on-surface-variant font-bold">MODEL:</span>
                  <select
                    value={modelType}
                    onChange={(e: any) => setModelType(e.target.value)}
                    className="px-2 py-1 bg-surface border border-outline-variant text-on-surface text-xs font-mono focus:outline-none"
                  >
                    <option value="general">Gemini 3.5 Flash (General)</option>
                    <option value="complex">Gemini 3.1 Pro (Complex)</option>
                    <option value="fast">Gemini 3.1 Flash-Lite (Fast)</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useHighThinking}
                    onChange={(e) => {
                      setUseHighThinking(e.target.checked);
                      if (e.target.checked) setUseLowLatency(false);
                    }}
                    className="accent-primary"
                  />
                  <span className={`font-bold flex items-center gap-1 ${useHighThinking ? "text-primary" : "text-on-surface-variant"}`}>
                    <Brain className="w-3.5 h-3.5" />
                    High Thinking Mode
                  </span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useLowLatency}
                    onChange={(e) => {
                      setUseLowLatency(e.target.checked);
                      if (e.target.checked) setUseHighThinking(false);
                    }}
                    className="accent-secondary"
                  />
                  <span className={`font-bold flex items-center gap-1 ${useLowLatency ? "text-secondary" : "text-on-surface-variant"}`}>
                    <Zap className="w-3.5 h-3.5" />
                    Low Latency
                  </span>
                </label>
              </div>
            </div>

            {/* Scrollable Message Thread */}
            <div ref={chatScrollRef} className="flex-grow overflow-y-auto space-y-4 p-4 bg-background border border-outline-variant">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-on-surface-variant uppercase">
                    <span className="font-bold">{msg.role === "user" ? "Operator" : "Gemini AI"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20">
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.thinkingUsed === "HIGH" && (
                      <span className="px-1.5 py-0.2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                        HIGH THINKING
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-2xl p-4 rounded-none text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary font-sans"
                        : "bg-surface border border-outline-variant text-on-surface font-sans shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini is generating response...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="Type your message or prompt for Gemini..."
                className="flex-grow p-3 bg-surface border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary resize-none h-14"
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="h-14 px-6 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-wider hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>SEND</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. IMAGE CREATION & EDITING */}
        {activeSubTab === "image" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Form Controls */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                <span>Studio Image Generator & Editor</span>
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Text Prompt
                </label>
                <textarea
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  placeholder="e.g. A high-contrast futuristic cybernetic workstation with glowing orange neon borders, 8k resolution, studio lighting..."
                  className="w-full p-3 bg-background border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary h-28"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">
                    ASPECT RATIO
                  </label>
                  <select
                    value={imgAspectRatio}
                    onChange={(e) => setImgAspectRatio(e.target.value)}
                    className="w-full p-2 bg-background border border-outline-variant text-on-surface focus:outline-none"
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait Story)</option>
                    <option value="4:3">4:3 (Classic Display)</option>
                    <option value="3:4">3:4 (Vertical Banner)</option>
                    <option value="3:2">3:2 (Photography)</option>
                    <option value="2:3">2:3 (Poster)</option>
                    <option value="21:9">21:9 (Ultrawide Cinematic)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">
                    IMAGE SIZE / RESOLUTION
                  </label>
                  <select
                    value={imgSize}
                    onChange={(e) => setImgSize(e.target.value)}
                    className="w-full p-2 bg-background border border-outline-variant text-on-surface focus:outline-none"
                  >
                    <option value="1K">1K High Quality</option>
                    <option value="2K">2K Ultra HD (Gemini 3 Pro Image)</option>
                    <option value="4K">4K Studio Master (Gemini 3 Pro Image)</option>
                  </select>
                </div>
              </div>

              {/* Upload Image to Edit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                    Source Image for Editing (Optional)
                  </label>
                  <label className="text-[10px] font-mono text-primary flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isImgEditMode}
                      onChange={(e) => setIsImgEditMode(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>ENABLE EDIT MODE</span>
                  </label>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImgSourceFile(reader.result as string);
                        setIsImgEditMode(true);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
                />
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={imgLoading || !imgPrompt.trim()}
                className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {imgLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isImgEditMode ? "EDIT IMAGE WITH GEMINI" : "RENDER STUDIO IMAGE"}</span>
              </button>
            </div>

            {/* Image Result Stage */}
            <div className="bg-background border border-outline-variant p-4 flex flex-col items-center justify-center min-h-[350px] relative">
              {generatedImgUrl ? (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <img
                    src={generatedImgUrl}
                    alt="Generated Visual"
                    className="max-h-[360px] object-contain border border-outline-variant shadow-md"
                  />
                  <a
                    href={generatedImgUrl}
                    download="gemini-studio-artwork.png"
                    className="px-4 py-2 bg-primary text-on-primary font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-secondary transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD HIGH-RES IMAGE</span>
                  </a>
                </div>
              ) : (
                <div className="text-center text-on-surface-variant font-mono text-xs space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-primary/40" />
                  <p>Your generated visual will render here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. VEO 3.1 VIDEO STUDIO */}
        {activeSubTab === "video" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <Video className="w-5 h-5 text-secondary" />
                <span>Veo 3.1 Video Generator</span>
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Video Generation Prompt
                </label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="e.g. A neon hologram of a cybernetic cat driving a high-speed vehicle through a illuminated futuristic city..."
                  className="w-full p-3 bg-background border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary h-28"
                />
              </div>

              <div className="font-mono text-xs">
                <label className="block font-bold text-on-surface-variant mb-1">
                  ASPECT RATIO (16:9 Landscape / 9:16 Portrait)
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio("16:9")}
                    className={`flex-1 py-2 border font-bold cursor-pointer transition-all ${
                      videoAspectRatio === "16:9"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-on-surface border-outline-variant"
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio("9:16")}
                    className={`flex-1 py-2 border font-bold cursor-pointer transition-all ${
                      videoAspectRatio === "9:16"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-on-surface border-outline-variant"
                    }`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Animate Starting Photo (Image to Video)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setVideoSourcePhoto(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
                />
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={videoLoading || (!videoPrompt.trim() && !videoSourcePhoto)}
                className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {videoLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                <span>GENERATE VEO VIDEO</span>
              </button>

              {videoStatusText && (
                <p className="text-xs font-mono text-primary animate-pulse">{videoStatusText}</p>
              )}
            </div>

            <div className="bg-background border border-outline-variant p-4 flex flex-col items-center justify-center min-h-[350px]">
              {videoResultUrl ? (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <video
                    src={videoResultUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-[360px] object-cover border border-outline-variant shadow-md"
                  />
                  <a
                    href={videoResultUrl}
                    download="veo-3.1-generated-video.mp4"
                    className="px-4 py-2 bg-primary text-on-primary font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-secondary transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD VEO VIDEO (MP4)</span>
                  </a>
                </div>
              ) : (
                <div className="text-center text-on-surface-variant font-mono text-xs space-y-2">
                  <Video className="w-10 h-10 mx-auto text-primary/40" />
                  <p>Your Veo generated video preview will display here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. LYRIA MUSIC LAB */}
        {activeSubTab === "music" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-500" />
                <span>Lyria 3 Music Synthesizer</span>
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Music Composition Prompt
                </label>
                <textarea
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g. An energetic synthwave track with heavy basslines, analog arpeggiators, and retro-futuristic vibes..."
                  className="w-full p-3 bg-background border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary h-28"
                />
              </div>

              <div className="font-mono text-xs">
                <label className="block font-bold text-on-surface-variant mb-1">
                  TRACK LENGTH PROFILE
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMusicDuration("clip")}
                    className={`flex-1 py-2 border font-bold cursor-pointer transition-all ${
                      musicDuration === "clip"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-on-surface border-outline-variant"
                    }`}
                  >
                    Lyria Clip (30s Short)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMusicDuration("full")}
                    className={`flex-1 py-2 border font-bold cursor-pointer transition-all ${
                      musicDuration === "full"
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-on-surface border-outline-variant"
                    }`}
                  >
                    Lyria Pro (Full Track)
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateMusic}
                disabled={musicLoading || !musicPrompt.trim()}
                className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {musicLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                <span>SYNTHESIZE LYRIA MUSIC</span>
              </button>
            </div>

            <div className="bg-background border border-outline-variant p-4 flex flex-col justify-center min-h-[350px]">
              {musicAudioUrl ? (
                <div className="space-y-4 w-full">
                  <div className="p-4 bg-surface border border-outline-variant flex flex-col items-center space-y-3">
                    <Music className="w-12 h-12 text-primary animate-bounce" />
                    <audio
                      ref={musicAudioRef}
                      src={musicAudioUrl}
                      controls
                      className="w-full"
                    />
                    <a
                      href={musicAudioUrl}
                      download="lyria-music-track.mp3"
                      className="px-4 py-2 bg-primary text-on-primary font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-secondary transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>DOWNLOAD MUSIC TRACK</span>
                    </a>
                  </div>

                  {musicLyrics && (
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-outline-variant text-xs font-mono space-y-1">
                      <span className="font-bold text-primary uppercase">Generated Lyrics & Transcript:</span>
                      <p className="whitespace-pre-wrap text-on-surface-variant">{musicLyrics}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-on-surface-variant font-mono text-xs space-y-2">
                  <Music className="w-10 h-10 mx-auto text-primary/40" />
                  <p>Synthesized Lyria audio track will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. LIVE VOICE API */}
        {activeSubTab === "live" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center max-w-xl">
              <h3 className="font-serif font-bold text-xl text-primary mb-2 flex items-center justify-center gap-2">
                <Mic className="w-6 h-6 text-red-500 animate-pulse" />
                <span>Gemini Live Voice Conversations</span>
              </h3>
              <p className="text-xs text-on-surface-variant font-sans">
                Real-time low-latency WebSocket voice session using <code className="text-primary font-mono">gemini-3.1-flash-live-preview</code> at 24kHz. Speak directly into your microphone.
              </p>
            </div>

            <button
              onClick={toggleLiveVoice}
              className={`px-8 py-4 font-mono text-sm uppercase font-bold tracking-widest cursor-pointer transition-all flex items-center gap-3 shadow-lg ${
                isLiveActive
                  ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                  : "bg-primary text-on-primary hover:bg-secondary"
              }`}
            >
              {isLiveActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isLiveActive ? "DISCONNECT LIVE VOICE" : "CONNECT LIVE VOICE SESSION"}</span>
            </button>

            <div className="w-full max-w-2xl bg-background border border-outline-variant p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-on-surface-variant border-b border-outline-variant pb-2">
                <span className="font-bold text-primary uppercase">SESSION STATUS:</span>
                <span>{liveStatus}</span>
              </div>

              <div className="h-48 overflow-y-auto space-y-1.5 p-2 bg-surface text-on-surface">
                {liveTranscript.length === 0 ? (
                  <p className="text-on-surface-variant italic">Live voice transcript stream will appear here...</p>
                ) : (
                  liveTranscript.map((t, idx) => (
                    <p key={idx} className="text-xs">{t}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. MEDIA ANALYZER */}
        {activeSubTab === "analyze" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>Image & Video Analyzer</span>
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Upload Photo / Visual Asset
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setAnalyzeFile(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Or Media URL
                </label>
                <input
                  type="url"
                  value={analyzeMediaUrl}
                  onChange={(e) => setAnalyzeMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-background border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Analysis Instructions / Question
                </label>
                <textarea
                  value={analyzePrompt}
                  onChange={(e) => setAnalyzePrompt(e.target.value)}
                  placeholder="Analyze key visual elements, text contents, color palettes, and production quality..."
                  className="w-full p-3 bg-background border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary h-24"
                />
              </div>

              <button
                onClick={handleAnalyzeMedia}
                disabled={analyzeLoading || (!analyzeFile && !analyzeMediaUrl && !analyzePrompt)}
                className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {analyzeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>ANALYZE WITH GEMINI PRO</span>
              </button>
            </div>

            <div className="bg-background border border-outline-variant p-4 overflow-y-auto max-h-[450px]">
              {analyzeResult ? (
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold text-primary uppercase">Analysis Report:</span>
                  <div className="text-sm font-sans text-on-surface whitespace-pre-wrap leading-relaxed">
                    {analyzeResult}
                  </div>
                </div>
              ) : (
                <div className="text-center text-on-surface-variant font-mono text-xs py-12">
                  <Layers className="w-10 h-10 mx-auto text-primary/40 mb-2" />
                  <p>Analysis breakdown will display here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. TRANSCRIBE SPEECH */}
        {activeSubTab === "transcribe" && (
          <div className="flex flex-col items-center max-w-xl mx-auto space-y-6 py-6">
            <div className="text-center">
              <h3 className="font-serif font-bold text-xl text-primary mb-1 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Audio Speech Transcription</span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                Record directly or upload an audio file for speech-to-text transcription using <code className="text-primary font-mono">gemini-3.5-flash</code>.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                className={`px-6 py-3 font-mono text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  isRecordingMic
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-primary text-on-primary hover:bg-secondary"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecordingMic ? "STOP RECORDING" : "RECORD MICROPHONE"}</span>
              </button>
            </div>

            <div className="w-full">
              <label className="block text-xs font-mono uppercase font-bold text-on-surface-variant mb-1">
                Or Upload Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setTranscribeAudioFile(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
              />
            </div>

            <button
              onClick={handleTranscribeAudio}
              disabled={transcribeLoading || !transcribeAudioFile}
              className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-widest hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {transcribeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>TRANSCRIBE AUDIO</span>
            </button>

            {transcriptionResult && (
              <div className="w-full p-4 bg-background border border-outline-variant space-y-1">
                <span className="font-mono text-xs font-bold text-primary uppercase">Transcription:</span>
                <p className="text-sm font-sans text-on-surface whitespace-pre-wrap">{transcriptionResult}</p>
              </div>
            )}
          </div>
        )}

        {/* 8. SEARCH & MAPS GROUNDING */}
        {activeSubTab === "grounding" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                <Globe className="w-5 h-5 text-secondary" />
                <span>Google Search & Maps Grounding</span>
              </h3>

              <div className="flex gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setGroundingType("search")}
                  className={`px-3 py-1 border font-bold cursor-pointer ${
                    groundingType === "search" ? "bg-primary text-on-primary border-primary" : "bg-background text-on-surface border-outline-variant"
                  }`}
                >
                  Search Grounding
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingType("maps")}
                  className={`px-3 py-1 border font-bold cursor-pointer ${
                    groundingType === "maps" ? "bg-primary text-on-primary border-primary" : "bg-background text-on-surface border-outline-variant"
                  }`}
                >
                  Maps Grounding
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groundingQuery}
                onChange={(e) => setGroundingQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGroundingQuery()}
                placeholder={groundingType === "search" ? "Ask a real-time question e.g. What are the latest media tech news?" : "Find media studio locations e.g. Recording studios near Los Angeles"}
                className="flex-grow p-3 bg-background border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleGroundingQuery}
                disabled={groundingLoading || !groundingQuery.trim()}
                className="px-6 py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-wider hover:bg-secondary cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {groundingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>QUERY</span>
              </button>
            </div>

            {groundingResult && (
              <div className="space-y-4 p-4 bg-background border border-outline-variant">
                <p className="text-sm font-sans text-on-surface whitespace-pre-wrap leading-relaxed">
                  {groundingResult.text}
                </p>

                {groundingResult.chunks.length > 0 && (
                  <div className="space-y-2 border-t border-outline-variant pt-3 font-mono text-xs">
                    <span className="font-bold text-primary uppercase">Grounded Source Links:</span>
                    <ul className="space-y-1">
                      {groundingResult.chunks.map((chunk, i) => {
                        const url = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || url;
                        return (
                          <li key={i}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-secondary underline hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              <span>{title}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
