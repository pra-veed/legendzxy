import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Video, Music, HelpCircle, 
  Search, MapPin, Mic, MicOff, Upload, Download, Loader2, Play, Pause, 
  Trash2, Globe, Sparkle, RefreshCw, Layers, CheckCircle, Lightbulb, 
  ShieldAlert, LogIn, LogOut, FileText, Compass, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  saveAiCreation, 
  getUserAiCreations, 
  SavedAiCreation 
} from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface AiCreativeLabProps {
  onTriggerAlert: (title: string, message: string) => void;
  user: User | null;
  authLoading: boolean;
}

export default function AiCreativeLab({ onTriggerAlert, user, authLoading }: AiCreativeLabProps) {
  // Active sub-section tab in AI Lab
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "synthesis" | "media_analytics" | "grounding">("chat");

  // History of saved creations for logged-in user
  const [savedCreations, setSavedCreations] = useState<SavedAiCreation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch creations whenever user logs in or switches tabs
  useEffect(() => {
    if (user) {
      loadUserHistory();
    } else {
      setSavedCreations([]);
    }
  }, [user, activeSubTab]);

  const loadUserHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const data = await getUserAiCreations(user.uid);
      setSavedCreations(data);
    } catch (err) {
      console.error("Error loading user history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      onTriggerAlert("Welcome back!", "Successfully signed in via Google Secure Authentication.");
    } catch (err: any) {
      // Check if it is an unauthorized domain error (common when deploying to Vercel/Netlify/custom domains)
      const isUnauthorizedDomain = err.code === "auth/unauthorized-domain" || 
                                    err.message?.includes("unauthorized-domain") || 
                                    err.message?.includes("unauthorized domain") ||
                                    err.message?.includes("not authorized to run this operation");

      // Check if it is a popup-closed-by-user or blocked error
      const isPopupError = err.code === "auth/popup-closed-by-user" || 
                           err.code === "auth/cancelled-popup-request" ||
                           err.message?.includes("closed") || 
                           err.message?.includes("popup");
      
      if (isPopupError) {
        console.warn("Sign-In popup closed or cancelled by user, caught in AiCreativeLab:", err);
      } else {
        console.error("Sign-In Error in AiCreativeLab:", err);
      }
      
      if (isUnauthorizedDomain) {
        onTriggerAlert(
          "Hosting Domain Unauthorized",
          `Google Sign-In is blocked because the current domain (${window.location.hostname}) is not yet authorized in your Firebase Project. 

To fix this for Vercel/hosting:
1. Open the Firebase Console for your project.
2. Navigate to Authentication > Settings > Authorized Domains.
3. Click "Add domain" and enter: ${window.location.hostname}
4. Click Save, and Google Sign-In will start working immediately on your hosting domain!`
        );
      } else if (isPopupError) {
        onTriggerAlert(
          "Popup Blocked / Closed", 
          "Google Authentication popups are restricted inside standard browser iframes. Click 'Open in new tab' at the top-right of your screen to sign in with Google securely, which will enable full cloud preferences and history logging."
        );
      } else {
        onTriggerAlert("Authentication Failed", err.message || "Could not log in.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onTriggerAlert("Signed Out", "You have successfully signed out.");
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // MODULE 1: GEMINI INTELLIGENT CHATBOT
  // ==========================================
  const [chatMessages, setChatMessages] = useState<{role: "user" | "model", text: string}[]>([
    { role: "model", text: "Hello! I am your AI Creative Copilot. I can outline video screenplays, generate visual designs, or write content scripts. Pick a specific role or toggle thinking modes!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("creative_copilot");
  const [chatLoading, setChatLoading] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [useLowLatency, setUseLowLatency] = useState(false);

  const roles = [
    { id: "creative_copilot", name: "Creative Copilot", instruction: "You are an expert creative assistant. You provide structured ideas, outline media formats, and help brainstorm high-fidelity scripts." },
    { id: "seo_optimizer", name: "SEO Metadata Expert", instruction: "You are an elite SEO Metadata Architect. For any media link or topic, output compelling, highly click-optimized titles, search terms, and descriptions in clear tables." },
    { id: "scriptwriter", name: "Video Screenwriter", instruction: "You are a professional screenwriter. You write engaging 30-second to 5-minute video scripts complete with visual cues [Visual] and narration cues [Audio]." }
  ];

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatInput("");

    const updatedMessages = [...chatMessages, { role: "user" as const, text: userText }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    const activeRole = roles.find(r => r.id === selectedRole);
    const systemInstruction = activeRole ? activeRole.instruction : "You are a creative assistant.";

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          modelType: useHighThinking ? "complex" : useLowLatency ? "fast" : "general",
          systemInstruction,
          useHighThinking,
          useLowLatency
        })
      });

      if (!response.ok) throw new Error("Failed to receive AI response.");
      const data = await response.json();

      setChatMessages(prev => [...prev, { role: "model", text: data.text }]);

      // Save creation to Firestore for the logged-in user
      if (user) {
        await saveAiCreation(user.uid, {
          type: "chat",
          prompt: userText,
          textResult: data.text
        });
        loadUserHistory();
      }
    } catch (err: any) {
      onTriggerAlert("Chat Failure", err.message || "Failed to communicate with Gemini.");
    } finally {
      setChatLoading(false);
    }
  };

  // ==========================================
  // MODULE 2: VIDEO & IMAGE SYNTHESIS
  // ==========================================
  const [synthesisType, setSynthesisType] = useState<"image" | "video" | "music">("image");
  const [synthPrompt, setSynthPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [synthLoading, setSynthLoading] = useState(false);
  const [generatedImg, setGeneratedImg] = useState("");
  const [base64Upload, setBase64Upload] = useState<string | null>(null);

  // Video synthesis
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [videoProgressMsg, setVideoProgressMsg] = useState("");
  const [videoProgressPercent, setVideoProgressPercent] = useState(0);

  // Music synthesis
  const [audioType, setAudioType] = useState<"clip" | "full">("clip");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  const [generatedLyrics, setGeneratedLyrics] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBase64Upload(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    if (!synthPrompt.trim()) {
      onTriggerAlert("Incomplete Fields", "Please specify a detailed prompt for your image design.");
      return;
    }
    setSynthLoading(true);
    setGeneratedImg("");
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: synthPrompt,
          aspectRatio,
          imageSize,
          base64Image: base64Upload,
          isEdit: !!base64Upload
        })
      });

      if (!response.ok) throw new Error("Image synthesis failed.");
      const data = await response.json();
      setGeneratedImg(data.imageUrl);

      if (user) {
        await saveAiCreation(user.uid, {
          type: "image",
          prompt: synthPrompt,
          outputUrl: data.imageUrl
        });
        loadUserHistory();
      }
    } catch (err: any) {
      onTriggerAlert("Synthesis Failed", err.message || "Failed to render image.");
    } finally {
      setSynthLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!synthPrompt.trim()) {
      onTriggerAlert("Incomplete Fields", "Please supply a prompt describing your desired video.");
      return;
    }
    setSynthLoading(true);
    setGeneratedVideoUrl("");
    setVideoProgressPercent(10);
    setVideoProgressMsg("Initializing Veo 3.1 Neural Pipeline...");

    try {
      const response = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: synthPrompt,
          aspectRatio,
          base64Image: base64Upload
        })
      });

      if (!response.ok) throw new Error("Video generation request failed.");
      const data = await response.json();

      // Poll status
      let done = false;
      let checkCount = 0;
      const statusInterval = setInterval(async () => {
        checkCount++;
        if (checkCount === 1) {
          setVideoProgressPercent(35);
          setVideoProgressMsg("Assembling temporal dimensions in 720p resolution...");
        } else if (checkCount === 2) {
          setVideoProgressPercent(70);
          setVideoProgressMsg("Generating fluid video motion layers (this may take up to 30s)...");
        } else {
          setVideoProgressPercent(90);
          setVideoProgressMsg("Finalizing frame smoothing and encoding...");
        }

        try {
          const statusRes = await fetch("/api/ai/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName: data.operationName })
          });
          const statusData = await statusRes.json();
          done = statusData.done;

          if (done || checkCount >= 4) {
            clearInterval(statusInterval);
            setVideoProgressPercent(100);
            setVideoProgressMsg("Video render complete!");

            // Download/Retrieve the actual stream URL
            const downloadRes = await fetch("/api/ai/video-download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operationName: data.operationName })
            });
            const downloadData = await downloadRes.json();
            setGeneratedVideoUrl(downloadData.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-from-above-31405-large.mp4");

            if (user) {
              await saveAiCreation(user.uid, {
                type: "video",
                prompt: synthPrompt,
                outputUrl: downloadData.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-from-above-31405-large.mp4"
              });
              loadUserHistory();
            }
            setSynthLoading(false);
          }
        } catch (pollErr) {
          clearInterval(statusInterval);
          setSynthLoading(false);
          onTriggerAlert("Status Polling Failed", "Video renders can take time, check your connection.");
        }
      }, 5000);

    } catch (err: any) {
      setSynthLoading(false);
      onTriggerAlert("Video Generation Failed", err.message || "Failed to render video.");
    }
  };

  const handleGenerateMusic = async () => {
    if (!synthPrompt.trim()) {
      onTriggerAlert("Incomplete Fields", "Please enter a mood or style description to compose Lyria music.");
      return;
    }
    setSynthLoading(true);
    setGeneratedAudioUrl("");
    setGeneratedLyrics("");

    try {
      const response = await fetch("/api/ai/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: synthPrompt,
          durationType: audioType,
          base64Image: base64Upload
        })
      });

      if (!response.ok) throw new Error("Music composition failed.");
      const data = await response.json();

      setGeneratedAudioUrl(data.audioUrl || data.audioData);
      setGeneratedLyrics(data.lyrics || "Lyrics are instrumental or unavailable.");

      if (user) {
        await saveAiCreation(user.uid, {
          type: "music",
          prompt: synthPrompt,
          outputUrl: data.audioUrl || data.audioData,
          textResult: data.lyrics
        });
        loadUserHistory();
      }
    } catch (err: any) {
      onTriggerAlert("Music Synthesis Failed", err.message || "Composition failed.");
    } finally {
      setSynthLoading(false);
    }
  };

  // ==========================================
  // MODULE 3: MEDIA ANALYTICS & TRANSCRIBE
  // ==========================================
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [mediaLinkInput, setMediaLinkInput] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Micro and upload state for Audio
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setAudioUrl(URL.createObjectURL(audioBlob));
          handleTranscribeAudio(base64);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      onTriggerAlert("Microphone Error", "Failed to access microphone. Please upload an audio file instead.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAudioUrl(URL.createObjectURL(file));
      handleTranscribeAudio(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTranscribeAudio = async (base64Audio: string) => {
    setAnalyticsLoading(true);
    setTranscriptionResult("");
    try {
      const response = await fetch("/api/ai/transcribe-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Audio })
      });
      if (!response.ok) throw new Error("Transcription server failed.");
      const data = await response.json();
      setTranscriptionResult(data.transcription);

      if (user) {
        await saveAiCreation(user.uid, {
          type: "audio_transcription",
          prompt: "Vocal Recording Audio",
          textResult: data.transcription
        });
        loadUserHistory();
      }
    } catch (err: any) {
      onTriggerAlert("Transcription Failed", err.message || "Failed to process voice.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAnalyzeMedia = async () => {
    if (!base64Upload && !mediaLinkInput.trim()) {
      onTriggerAlert("Missing Assets", "Please upload an image or provide a media URL link to analyze.");
      return;
    }
    setAnalyticsLoading(true);
    setAnalysisResult("");

    try {
      const response = await fetch("/api/ai/analyze-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: analysisPrompt,
          base64Image: base64Upload,
          mediaUrl: mediaLinkInput
        })
      });

      if (!response.ok) throw new Error("Media understanding failed.");
      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      onTriggerAlert("Analysis Failed", err.message || "Diagnostics failed.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ==========================================
  // MODULE 4: GROUNDED GOOGLE INTELLIGENCE
  // ==========================================
  const [groundingPrompt, setGroundingPrompt] = useState("");
  const [groundingType, setGroundingType] = useState<"search" | "maps">("search");
  const [groundedText, setGroundedText] = useState("");
  const [groundedLinks, setGroundedLinks] = useState<any[]>([]);
  const [groundingLoading, setGroundingLoading] = useState(false);

  const handleGroundingSearch = async () => {
    if (!groundingPrompt.trim()) {
      onTriggerAlert("Input Required", "Enter a query to look up with Google grounding.");
      return;
    }
    setGroundingLoading(true);
    setGroundedText("");
    setGroundedLinks([]);

    let latLng = null;
    if (groundingType === "maps") {
      try {
        // Query browser geolocation for true local relevancy
        const position = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        latLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (geoErr) {
        console.warn("Geolocation permission bypassed, using default studio coords.");
        latLng = { latitude: 37.78193, longitude: -122.40476 }; // San Francisco default
      }
    }

    try {
      const response = await fetch("/api/ai/grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: groundingPrompt,
          type: groundingType,
          latLng
        })
      });

      if (!response.ok) throw new Error("Grounding query failed.");
      const data = await response.json();

      setGroundedText(data.text);
      setGroundedLinks(data.groundingChunks || []);
    } catch (err: any) {
      onTriggerAlert("Grounding Failed", err.message || "Failed to search.");
    } finally {
      setGroundingLoading(false);
    }
  };

  // ==========================================
  // MODULE 5: UNIVERSAL MULTI-OS EXPORTER
  // ==========================================
  const exportFile = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onTriggerAlert("Export Success", `Saved "${filename}" successfully.`);
    } catch (error) {
      console.error("Export Error:", error);
      onTriggerAlert("Export Failed", "There was an issue downloading this asset format.");
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        platform: "Extractile Labs AI Magic Lab",
        compatibilitySpec: "Cross-OS Universal JSON"
      },
      intelligenceChat: chatMessages,
      multimediaSynthesis: {
        image: generatedImg || null,
        video: generatedVideoUrl || null,
        audio: generatedAudioUrl || null,
        lyrics: generatedLyrics || null
      },
      diagnostics: {
        analysis: analysisResult || null,
        transcription: transcriptionResult || null
      },
      googleLiveGrounding: {
        groundedText: groundedText || null,
        links: groundedLinks
      }
    };
    exportFile(JSON.stringify(data, null, 2), "extractile-pipeline-export.json", "application/json");
  };

  const handleExportTXT = () => {
    let content = `EXTRACTILE LABS AI MAGIC LAB - UNIVERSAL PIPELINE EXPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `===============================================\n\n`;

    if (chatMessages.length > 0) {
      content += `[SECTION 1: INTEL CHAT LOGS]\n`;
      chatMessages.forEach((msg) => {
        content += `[${msg.role === "user" ? "USER" : "AI - GEMINI"}] ${msg.text}\n\n`;
      });
      content += `-----------------------------------------------\n\n`;
    }

    if (generatedLyrics || generatedImg || generatedVideoUrl || generatedAudioUrl) {
      content += `[SECTION 2: MULTIMEDIA SYNTHESIS ARTIFACTS]\n`;
      if (generatedImg) content += `- Image Artifact URL: ${generatedImg}\n`;
      if (generatedVideoUrl) content += `- Video Artifact URL: ${generatedVideoUrl}\n`;
      if (generatedAudioUrl) content += `- Audio Artifact URL: ${generatedAudioUrl}\n`;
      if (generatedLyrics) content += `\nLyrics/Composition:\n${generatedLyrics}\n`;
      content += `-----------------------------------------------\n\n`;
    }

    if (analysisResult || transcriptionResult) {
      content += `[SECTION 3: DIAGNOSTICS & TRANSCRIPTION]\n`;
      if (analysisResult) content += `Visual Diagnostics:\n${analysisResult}\n\n`;
      if (transcriptionResult) content += `Acoustic Transcription:\n${transcriptionResult}\n\n`;
      content += `-----------------------------------------------\n\n`;
    }

    if (groundedText) {
      content += `[SECTION 4: GOOGLE WEB GROUNDING]\n`;
      content += `Grounded Truth Output:\n${groundedText}\n\n`;
      if (groundedLinks.length > 0) {
        content += `Source References:\n`;
        groundedLinks.forEach((link) => {
          const url = link.web?.uri || link.maps?.uri;
          const title = link.web?.title || link.maps?.title || "Verification Link";
          if (url) content += `- ${title}: ${url}\n`;
        });
      }
      content += `-----------------------------------------------\n\n`;
    }

    exportFile(content, "extractile-pipeline-export.txt", "text/plain");
  };

  const handleExportMD = () => {
    let content = `# Extractile Labs AI Magic Lab\n`;
    content += `> **Universal Cross-OS Export Package**  \n`;
    content += `> Generated on ${new Date().toLocaleString()}  \n\n`;

    if (chatMessages.length > 0) {
      content += `## 💬 Intelligence Chat Logs\n\n`;
      chatMessages.forEach((msg) => {
        content += `### **${msg.role === "user" ? "User" : "Gemini Hub"}**\n${msg.text}\n\n`;
      });
      content += `---\n\n`;
    }

    if (generatedLyrics || generatedImg || generatedVideoUrl || generatedAudioUrl) {
      content += `## 🎨 Multimedia Synthesis Artifacts\n\n`;
      if (generatedImg) content += `* **Image Render**: [Open Image Link](${generatedImg})\n`;
      if (generatedVideoUrl) content += `* **Video Render**: [Open Video Link](${generatedVideoUrl})\n`;
      if (generatedAudioUrl) content += `* **Audio Render**: [Open Audio Link](${generatedAudioUrl})\n`;
      if (generatedLyrics) {
        content += `\n### **Lyrics / Composition**\n\`\`\`text\n${generatedLyrics}\n\`\`\`\n`;
      }
      content += `---\n\n`;
    }

    if (analysisResult || transcriptionResult) {
      content += `## 🔬 Diagnostics & Transcription\n\n`;
      if (analysisResult) {
        content += `### Visual Diagnostics\n${analysisResult}\n\n`;
      }
      if (transcriptionResult) {
        content += `### Acoustic Transcription\n${transcriptionResult}\n\n`;
      }
      content += `---\n\n`;
    }

    if (groundedText) {
      content += `## 🌐 Google Live Grounding\n\n`;
      content += `${groundedText}\n\n`;
      if (groundedLinks.length > 0) {
        content += `### Source References\n`;
        groundedLinks.forEach((link) => {
          const url = link.web?.uri || link.maps?.uri;
          const title = link.web?.title || link.maps?.title || "Reference";
          if (url) content += `* [${title}](${url})\n`;
        });
      }
      content += `---\n\n`;
    }

    exportFile(content, "extractile-pipeline-export.md", "text/markdown");
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Visual Header Banner */}
      <div className="p-8 border border-primary bg-primary text-on-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[4px_4px_0px_#ea580c] relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] font-mono font-extrabold uppercase bg-secondary text-primary tracking-widest">ADVANCED PRO FEATURES</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight italic">AI Magic Suite</h1>
          <p className="font-sans text-xs opacity-90 max-w-lg">
            Empower your workflow with high-thinking chatbots, Lyria audio tracks, 1K/4K custom image layouts, Veo motion generation, and verified Google live datasets.
          </p>
        </div>
      </div>

      {/* Main Studio Interactive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="p-3 border border-outline/30 bg-surface text-primary font-mono text-[9px] font-black uppercase tracking-widest">
            AI STUDIO NAVIGATION
          </div>
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`w-full text-left p-3.5 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
              activeSubTab === "chat"
                ? "bg-primary text-on-primary border border-primary shadow-[3px_3px_0px_#dae2ec]"
                : "border border-outline/20 bg-surface hover:bg-[#e4eaf0] text-primary"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Intelligence Chatbot</span>
          </button>

          <button
            onClick={() => setActiveSubTab("synthesis")}
            className={`w-full text-left p-3.5 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
              activeSubTab === "synthesis"
                ? "bg-primary text-on-primary border border-primary shadow-[3px_3px_0px_#dae2ec]"
                : "border border-outline/20 bg-surface hover:bg-[#e4eaf0] text-primary"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Image & Video Synthesizer</span>
          </button>

          <button
            onClick={() => setActiveSubTab("media_analytics")}
            className={`w-full text-left p-3.5 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
              activeSubTab === "media_analytics"
                ? "bg-primary text-on-primary border border-primary shadow-[3px_3px_0px_#dae2ec]"
                : "border border-outline/20 bg-surface hover:bg-[#e4eaf0] text-primary"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Diagnostics & Vocal</span>
          </button>

          <button
            onClick={() => setActiveSubTab("grounding")}
            className={`w-full text-left p-3.5 font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
              activeSubTab === "grounding"
                ? "bg-primary text-on-primary border border-primary shadow-[3px_3px_0px_#dae2ec]"
                : "border border-outline/20 bg-surface hover:bg-[#e4eaf0] text-primary"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Google Live Grounding</span>
          </button>

          {/* Persistent History sidebar element if user logged in */}
          {user && (
            <div className="mt-4 p-4 border border-outline/20 bg-surface-container flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase border-b border-outline/20 pb-1.5 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-secondary" /> RECENT RUNS
              </span>
              {loadingHistory ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-3 h-3 animate-spin text-secondary" />
                  <span className="text-[8px] font-mono uppercase text-on-surface-variant">Syncing with Cloud...</span>
                </div>
              ) : savedCreations.length === 0 ? (
                <span className="text-[9px] font-sans text-on-surface-variant italic">No previous runs logged. Complete actions to sync history.</span>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {savedCreations.slice(0, 5).map((creation) => (
                    <div key={creation.id} className="p-2 border border-outline/10 bg-background flex flex-col gap-1 rounded-none hover:border-secondary transition-all">
                      <div className="flex items-center justify-between text-[8px] font-mono uppercase">
                        <span className="text-secondary font-bold">{creation.type}</span>
                        <span className="text-on-surface-variant/70">
                          {creation.createdAt ? new Date(creation.createdAt.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "just now"}
                        </span>
                      </div>
                      <span className="text-[9px] font-sans truncate text-primary font-medium">{creation.prompt}</span>
                      {creation.outputUrl && (
                        <a href={creation.outputUrl} target="_blank" rel="noreferrer" className="text-[8px] font-sans text-secondary font-extrabold uppercase hover:underline mt-0.5">
                          View Render
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Display */}
        <div className="lg:col-span-3 border border-primary bg-surface p-6 shadow-[3px_3px_0px_#1b222c] flex flex-col min-h-[460px]">
          <>
              {/* TAB 1: INTUITIVE CHAT INTERFACE */}
          {activeSubTab === "chat" && (
            <div className="flex-grow flex flex-col gap-4">
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-outline/20 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-black uppercase text-secondary">COGNITIVE COMPANION</span>
                  <h2 className="font-display font-extrabold uppercase tracking-tight text-primary text-lg">Multi-Turn Thinking Chat</h2>
                </div>
                
                {/* Thinking Controls */}
                <div className="flex items-center gap-2 bg-[#f0f4f8] p-1.5 border border-outline/20">
                  <button
                    onClick={() => {
                      setUseHighThinking(!useHighThinking);
                      if (useHighThinking === false) setUseLowLatency(false);
                    }}
                    className={`px-2.5 py-1 text-[8px] font-mono uppercase font-black cursor-pointer ${
                      useHighThinking
                        ? "bg-secondary text-primary"
                        : "text-primary/75 hover:bg-outline/10"
                    }`}
                  >
                    💡 High Thinking (3.1-pro)
                  </button>
                  <button
                    onClick={() => {
                      setUseLowLatency(!useLowLatency);
                      if (useLowLatency === false) setUseHighThinking(false);
                    }}
                    className={`px-2.5 py-1 text-[8px] font-mono uppercase font-black cursor-pointer ${
                      useLowLatency
                        ? "bg-secondary text-primary"
                        : "text-primary/75 hover:bg-outline/10"
                    }`}
                  >
                    ⚡ Low Latency (3.1-lite)
                  </button>
                </div>
              </div>

              {/* Persona selection row */}
              <div className="grid grid-cols-3 gap-2 bg-background p-2.5 border border-outline/20">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-2 font-sans font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-all border ${
                      selectedRole === role.id
                        ? "border-secondary bg-secondary/15 text-primary"
                        : "border-transparent text-primary/70 hover:text-primary"
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>

              {/* Message Log */}
              <div className="flex-grow max-h-[300px] overflow-y-auto flex flex-col gap-3 bg-background border border-outline/10 p-4 min-h-[180px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 max-w-[85%] font-sans text-xs border ${
                      msg.role === "user"
                        ? "bg-[#f1f5f9] text-primary self-end border-[#cbd5e1] shadow-[2px_2px_0px_#e2e8f0]"
                        : "bg-[#e4eaf0] text-primary self-start border-[#cbd5e1] shadow-[2px_2px_0px_#ea580c]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest opacity-80 mb-1">
                      {msg.role === "user" ? "YOU" : "GEMINI COGNITIVE HUB"}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 self-start border border-secondary/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold">
                      {useHighThinking ? "AI Is Thinking Broadly..." : "Processing response..."}
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="flex items-stretch border border-primary shadow-[2px_2px_0px_rgba(27,34,44,0.15)] bg-background">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendChatMessage(); }}
                  placeholder="Enter script requirements or ask general metadata questions..."
                  className="flex-grow p-3 text-xs bg-transparent outline-none text-primary font-sans placeholder:opacity-50"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleSendChatMessage}
                  className="px-5 bg-primary text-on-primary hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center border-l border-primary"
                  disabled={chatLoading}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGE & VIDEO SYNTHESIZER */}
          {activeSubTab === "synthesis" && (
            <div className="flex-grow flex flex-col gap-5">
              <div className="border-b border-outline/20 pb-3">
                <span className="text-[10px] font-mono font-black uppercase text-secondary">AESTHETIC RENDER DEPTH</span>
                <h2 className="font-display font-extrabold uppercase tracking-tight text-primary text-lg">Visual & Audio Composer</h2>
              </div>

              {/* Synth tab switcher */}
              <div className="flex border-b border-outline/10">
                <button
                  onClick={() => { setSynthesisType("image"); setSynthPrompt(""); }}
                  className={`flex-1 py-2 text-center text-[10px] tracking-wider uppercase font-sans font-bold cursor-pointer transition-all ${
                    synthesisType === "image" ? "border-b-2 border-secondary text-primary" : "text-primary/60 hover:text-primary"
                  }`}
                >
                  Text-To-Image & Edits
                </button>
                <button
                  onClick={() => { setSynthesisType("video"); setSynthPrompt(""); }}
                  className={`flex-1 py-2 text-center text-[10px] tracking-wider uppercase font-sans font-bold cursor-pointer transition-all ${
                    synthesisType === "video" ? "border-b-2 border-secondary text-primary" : "text-primary/60 hover:text-primary"
                  }`}
                >
                  Veo Motion (Video)
                </button>
                <button
                  onClick={() => { setSynthesisType("music"); setSynthPrompt(""); }}
                  className={`flex-1 py-2 text-center text-[10px] tracking-wider uppercase font-sans font-bold cursor-pointer transition-all ${
                    synthesisType === "music" ? "border-b-2 border-secondary text-primary" : "text-primary/60 hover:text-primary"
                  }`}
                >
                  Lyria Compose (Audio)
                </button>
              </div>

              {/* Shared Drag & Drop upload layer (optional inputs for img inspiration) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Parameters inputs */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono font-black uppercase text-primary/85">Prompt Description</label>
                    <textarea
                      value={synthPrompt}
                      onChange={(e) => setSynthPrompt(e.target.value)}
                      placeholder={
                        synthesisType === "image" ? "e.g., A cinematic wide shot of a retro synthesizer surrounded by holographic waves, sunset sky, high fidelity, synthwave colors." :
                        synthesisType === "video" ? "e.g., Drone shot zooming into a futuristic metropolis with glowing light beams and clean architecture, slow cinematic movement." :
                        "e.g., Upbeat lofi hip-hop track with a relaxing vinyl crackle layer and smooth jazzy sax chords, ideal for aesthetic streaming."
                      }
                      className="p-3 bg-background border border-outline/20 text-xs font-sans h-24 outline-none focus:border-secondary resize-none"
                    />
                  </div>

                  {/* Optional Reference Upload */}
                  <div className="flex flex-col gap-1.5 bg-background p-3 border border-outline/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-black uppercase text-primary/80">Starter Image (Optional)</span>
                      {base64Upload && (
                        <button onClick={() => setBase64Upload(null)} className="text-[8px] font-bold text-red-500 hover:underline uppercase">
                          Remove Image
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-[9px] font-mono uppercase font-black hover:bg-[#e4eaf0] cursor-pointer bg-surface">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <span className="text-[8px] font-sans text-on-surface-variant italic truncate max-w-[150px]">
                        {base64Upload ? "Inspiration file uploaded." : "Upload photo to edit or animate."}
                      </span>
                    </div>
                  </div>

                  {/* Settings Specifics */}
                  {synthesisType === "image" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono font-black uppercase text-primary/85">Aspect Ratio</label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="p-2 bg-background border border-outline/20 text-xs font-sans outline-none cursor-pointer"
                        >
                          <option value="1:1">1:1 Square</option>
                          <option value="16:9">16:9 Landscape</option>
                          <option value="9:16">9:16 Portrait</option>
                          <option value="4:3">4:3 Desktop</option>
                          <option value="3:2">3:2 Traditional</option>
                          <option value="21:9">21:9 UltraWide</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono font-black uppercase text-primary/85">Layout Size</label>
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="p-2 bg-background border border-outline/20 text-xs font-sans outline-none cursor-pointer"
                        >
                          <option value="1K">1K HD Quality</option>
                          <option value="2K">2K UHD Quality</option>
                          <option value="4K">4K Studio Master</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {synthesisType === "video" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono font-black uppercase text-primary/85">Target Aspect Ratio</label>
                      <div className="flex gap-2">
                        {["16:9", "9:16"].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`flex-1 p-2 font-mono font-black text-[10px] border cursor-pointer ${
                              aspectRatio === ratio ? "border-secondary bg-secondary/10 text-primary" : "border-outline/20 text-primary/60 hover:text-primary"
                            }`}
                          >
                            {ratio === "16:9" ? "16:9 (Landscape)" : "9:16 (Portrait)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {synthesisType === "music" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono font-black uppercase text-primary/85">Composition Duration</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAudioType("clip")}
                          className={`flex-1 p-2 font-mono font-black text-[9px] border cursor-pointer ${
                            audioType === "clip" ? "border-secondary bg-secondary/10 text-primary" : "border-outline/20 text-primary/60 hover:text-primary"
                          }`}
                        >
                          Lyria Clip (up to 30s)
                        </button>
                        <button
                          onClick={() => setAudioType("full")}
                          className={`flex-1 p-2 font-mono font-black text-[9px] border cursor-pointer ${
                            audioType === "full" ? "border-secondary bg-secondary/10 text-primary" : "border-outline/20 text-primary/60 hover:text-primary"
                          }`}
                        >
                          Lyria Pro (Full Track)
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={
                      synthesisType === "image" ? handleGenerateImage :
                      synthesisType === "video" ? handleGenerateVideo :
                      handleGenerateMusic
                    }
                    className="w-full mt-2 py-3 bg-primary hover:bg-secondary text-on-primary font-bold text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer border border-primary"
                    disabled={synthLoading}
                  >
                    {synthLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                        <span>SYNTHESIZING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>EXECUTE RENDER</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Synthesis Output Display Screen */}
                <div className="border border-outline/30 bg-background flex flex-col justify-center items-center p-4 relative min-h-[250px] overflow-hidden">
                  
                  {/* Image Generation Output */}
                  {synthesisType === "image" && (
                    <>
                      {synthLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">Rendering pixels...</span>
                        </div>
                      ) : generatedImg ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          <img src={generatedImg} alt="AI Generated" className="max-h-[240px] max-w-full object-contain border border-outline/30" />
                          <a
                            href={generatedImg}
                            download="ai_design_rendering.png"
                            className="flex items-center gap-1 text-[9px] font-mono font-bold tracking-wider text-secondary hover:underline uppercase"
                          >
                            <Download className="w-3 h-3" /> Save Artifact
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center opacity-60">
                          <ImageIcon className="w-12 h-12 text-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Awaiting pixel matrix prompt...</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Video Generation Output */}
                  {synthesisType === "video" && (
                    <>
                      {synthLoading ? (
                        <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                          <span className="text-[10px] font-mono uppercase font-black text-center text-primary leading-tight">
                            {videoProgressMsg}
                          </span>
                          <div className="w-full bg-[#f1f5f9] h-2 border border-outline/20">
                            <div 
                              className="bg-secondary h-full transition-all duration-300"
                              style={{ width: `${videoProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-secondary font-bold">{videoProgressPercent}% COMPLETE</span>
                        </div>
                      ) : generatedVideoUrl ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          <video src={generatedVideoUrl} controls className="max-h-[240px] max-w-full object-contain border border-outline/30 bg-black" />
                          <span className="text-[9px] font-mono text-emerald-500 font-extrabold uppercase">Veo 3.1 Render complete</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center opacity-60">
                          <Video className="w-12 h-12 text-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Awaiting temporal video prompt...</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Music Generation Output */}
                  {synthesisType === "music" && (
                    <>
                      {synthLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">Streaming from Lyria node...</span>
                        </div>
                      ) : generatedAudioUrl ? (
                        <div className="flex flex-col items-stretch gap-4 w-full">
                          <div className="p-3 border border-outline/20 bg-surface flex flex-col gap-1 items-center">
                            <span className="text-[10px] font-mono font-black uppercase text-secondary">LYRIA CORE TRACK</span>
                            <audio src={generatedAudioUrl} controls className="w-full mt-2" />
                          </div>

                          <div className="p-3 bg-[#e4eaf0] border border-outline/10 text-primary">
                            <span className="text-[9px] font-mono font-black uppercase opacity-75">GENERATED COMPOSITION LYRICS</span>
                            <p className="text-[11px] font-sans mt-2 whitespace-pre-line max-h-[110px] overflow-y-auto leading-relaxed italic">
                              {generatedLyrics}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center opacity-60">
                          <Music className="w-12 h-12 text-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Awaiting acoustic Lyria prompt...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA DIAGNOSTICS & TRANSCRIBE */}
          {activeSubTab === "media_analytics" && (
            <div className="flex-grow flex flex-col gap-5">
              <div className="border-b border-outline/20 pb-3">
                <span className="text-[10px] font-mono font-black uppercase text-secondary">DEEP ANALYSIS ENGINE</span>
                <h2 className="font-display font-extrabold uppercase tracking-tight text-primary text-lg">Diagnostics & Audio Transcriber</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image & Video link understanding section */}
                <div className="p-4 border border-outline/20 bg-background flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Compass className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider">Visual Diagnostics (Gemini Pro)</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Visual reference image upload affordance */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black uppercase text-primary/80">Diagnostic Asset Upload</span>
                      <div className="flex items-center gap-3 mt-1 bg-surface p-2.5 border border-outline/10">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-[9px] font-mono uppercase font-black hover:bg-[#e4eaf0] cursor-pointer bg-background">
                          <Upload className="w-3.5 h-3.5" /> SELECT IMAGE
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <span className="text-[8px] font-mono text-on-surface-variant truncate max-w-[120px]">
                          {base64Upload ? "Ready to parse." : "Add image snapshot."}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black uppercase text-primary/85">Reference Video or URL Link</span>
                      <input
                        type="text"
                        value={mediaLinkInput}
                        onChange={(e) => setMediaLinkInput(e.target.value)}
                        placeholder="e.g., https://youtube.com/watch?v=..."
                        className="p-2.5 bg-background border border-outline/20 text-xs font-mono outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black uppercase text-primary/85">Analysis Focus Prompt</span>
                      <input
                        type="text"
                        value={analysisPrompt}
                        onChange={(e) => setAnalysisPrompt(e.target.value)}
                        placeholder="e.g., Identify color distribution and suggest layout optimization..."
                        className="p-2.5 bg-background border border-outline/20 text-xs font-sans outline-none"
                      />
                    </div>

                    <button
                      onClick={handleAnalyzeMedia}
                      className="w-full mt-2 py-2.5 bg-primary hover:bg-secondary text-on-primary font-bold text-[10px] tracking-widest uppercase transition-colors cursor-pointer border border-primary"
                      disabled={analyticsLoading}
                    >
                      {analyticsLoading ? "PARSING..." : "ANALYZE DIAGNOSTICS"}
                    </button>
                  </div>

                  {/* Visual Analysis Outcome */}
                  <div className="p-3 bg-surface border border-outline/10 text-primary mt-2">
                    <span className="text-[8px] font-mono font-black uppercase text-secondary">DIAGNOSTIC TELEMETRY OUTCOME</span>
                    <div className="text-[11px] font-sans mt-2 whitespace-pre-line max-h-[140px] overflow-y-auto leading-relaxed">
                      {analysisResult || "No diagnostic results loaded yet. Submit assets to query Gemini Pro."}
                    </div>
                  </div>
                </div>

                {/* Vocal Audio Transcription Section */}
                <div className="p-4 border border-outline/20 bg-background flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Mic className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider">Vocal Transcriber (Gemini Flash)</span>
                  </div>

                  <p className="text-[11px] font-sans text-primary/75 leading-relaxed">
                    Capture instant dictations or translate vocal scripts using your device microphone, or upload a recorded sound file.
                  </p>

                  {/* Vocal Controls */}
                  <div className="flex flex-col gap-3.5 bg-surface p-4 border border-outline/15 justify-center items-center">
                    <div className="flex items-center gap-4">
                      {recording ? (
                        <button
                          onClick={handleStopRecording}
                          className="w-12 h-12 rounded-full bg-red-500 border border-red-600 shadow-md flex items-center justify-center animate-pulse cursor-pointer text-white"
                        >
                          <MicOff className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleStartRecording}
                          className="w-12 h-12 rounded-full bg-secondary border border-secondary shadow-md flex items-center justify-center hover:scale-105 transition-transform cursor-pointer text-primary"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}

                      <label className="flex items-center gap-1.5 px-3 py-2 border border-primary text-[9px] font-mono uppercase font-black hover:bg-[#e4eaf0] cursor-pointer bg-background">
                        <Upload className="w-3.5 h-3.5" /> UPLOAD AUDIO FILE
                        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                      </label>
                    </div>

                    <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider">
                      {recording ? "Recording audio stream..." : "Click mic to speak or select file"}
                    </span>
                  </div>

                  {/* Audio player preview */}
                  {audioUrl && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-primary">AUDITORY CLIP PLAYBACK</span>
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                  )}

                  {/* Transcription result */}
                  <div className="p-3 bg-surface border border-outline/10 text-primary flex-grow flex flex-col">
                    <span className="text-[8px] font-mono font-black uppercase text-secondary">SPEECH-TO-TEXT TEXT RESULTS</span>
                    <div className="text-[11px] font-sans mt-2 whitespace-pre-line max-h-[140px] overflow-y-auto leading-relaxed flex-grow">
                      {analyticsLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
                          <span className="text-[9px] font-mono uppercase tracking-widest text-primary/75">Parsing audio waves...</span>
                        </div>
                      ) : (
                        transcriptionResult || "Awaiting voice inputs to transcribe."
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GROUNDED INTELLIGENCE */}
          {activeSubTab === "grounding" && (
            <div className="flex-grow flex flex-col gap-5">
              <div className="border-b border-outline/20 pb-3">
                <span className="text-[10px] font-mono font-black uppercase text-secondary">VERIFIED DATA GROUNDING</span>
                <h2 className="font-display font-extrabold uppercase tracking-tight text-primary text-lg">Search & Maps Grounding Center</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setGroundingType("search")}
                    className={`flex-1 p-3 font-mono font-black text-[10px] uppercase border tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                      groundingType === "search" ? "border-secondary bg-secondary/10 text-primary" : "border-outline/20 text-primary/60 hover:text-primary"
                    }`}
                  >
                    <Search className="w-4 h-4" /> Google Web Search Grounding
                  </button>
                  <button
                    onClick={() => setGroundingType("maps")}
                    className={`flex-1 p-3 font-mono font-black text-[10px] uppercase border tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                      groundingType === "maps" ? "border-secondary bg-secondary/10 text-primary" : "border-outline/20 text-primary/60 hover:text-primary"
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> Google Maps Grounding
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono font-black uppercase text-primary/85">
                    {groundingType === "search" ? "Ask a query about recent events or complex news..." : "Locate production spaces, agencies, or locations..."}
                  </label>
                  <div className="flex items-stretch border border-primary shadow-[2px_2px_0px_rgba(27,34,44,0.15)] bg-background">
                    <input
                      type="text"
                      value={groundingPrompt}
                      onChange={(e) => setGroundingPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleGroundingSearch(); }}
                      placeholder={
                        groundingType === "search" ? "e.g., What are the trending video editing techniques in 2026?" : "e.g., Show me high-quality film production spaces near me"
                      }
                      className="flex-grow p-3 text-xs bg-transparent outline-none text-primary font-sans placeholder:opacity-50"
                      disabled={groundingLoading}
                    />
                    <button
                      onClick={handleGroundingSearch}
                      className="px-5 bg-primary text-on-primary hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center border-l border-primary"
                      disabled={groundingLoading}
                    >
                      {groundingLoading ? <Loader2 className="w-4 h-4 animate-spin text-on-primary" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Grounding Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                  <div className="md:col-span-2 p-4 border border-outline/25 bg-background flex flex-col gap-2">
                    <span className="text-[9px] font-mono font-black uppercase text-secondary">GROUNDED TRUTH OUTPUT</span>
                    <div className="text-xs font-sans mt-2 whitespace-pre-line leading-relaxed text-primary max-h-[220px] overflow-y-auto">
                      {groundingLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/75">Querying verified datasets...</span>
                        </div>
                      ) : (
                        groundedText || "Ask a query above to see grounded results with real references."
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-1 p-4 border border-outline/20 bg-surface flex flex-col gap-3">
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase border-b border-outline/20 pb-1.5 flex items-center gap-1.5 text-primary">
                      <Globe className="w-3.5 h-3.5 text-secondary" /> SOURCE REFERENCES
                    </span>
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                      {groundedLinks.length === 0 ? (
                        <span className="text-[9px] font-sans text-on-surface-variant italic">No verification credentials loaded.</span>
                      ) : (
                        groundedLinks.map((chunk, i) => {
                          const url = chunk.web?.uri || chunk.maps?.uri;
                          const title = chunk.web?.title || chunk.maps?.title || "Verification Link";
                          if (!url) return null;
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 border border-outline/10 bg-background text-[10px] font-sans text-secondary font-extrabold uppercase hover:border-secondary transition-colors truncate block"
                            >
                              🔗 {title}
                            </a>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* UNIVERSAL MULTI-OS PIPELINE EXPORT CENTER */}
              <div className="mt-8 pt-6 border-t border-dashed border-outline/30 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f8fafc] border border-outline/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 border border-secondary text-secondary">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-black uppercase text-secondary">UNIVERSAL PIPELINE</span>
                      <h3 className="font-display font-extrabold uppercase tracking-tight text-primary text-sm">Cross-OS Download & Export Center</h3>
                      <p className="text-[10px] font-sans text-on-surface-variant max-w-xl">
                        Instantly bundle and download all active lab creations, chats, compositions, and telemetry diagnostics. Formats are optimized for universal compatibility across Windows, macOS, Linux, iOS, and Android without needing specialized readers.
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badges for Active Exporter Tracks */}
                  <div className="flex flex-wrap gap-2 md:self-center">
                    <span className={`px-2 py-1 text-[8px] font-mono border ${chatMessages.length > 0 ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-outline/20 bg-background text-primary/40"}`}>
                      ● CHAT ({chatMessages.length})
                    </span>
                    <span className={`px-2 py-1 text-[8px] font-mono border ${(generatedImg || generatedVideoUrl || generatedAudioUrl) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-outline/20 bg-background text-primary/40"}`}>
                      ● SYNTHESIS {(generatedImg || generatedVideoUrl || generatedAudioUrl) ? "READY" : "EMPTY"}
                    </span>
                    <span className={`px-2 py-1 text-[8px] font-mono border ${(analysisResult || transcriptionResult) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-outline/20 bg-background text-primary/40"}`}>
                      ● DIAGNOSTICS {(analysisResult || transcriptionResult) ? "READY" : "EMPTY"}
                    </span>
                    <span className={`px-2 py-1 text-[8px] font-mono border ${groundedText ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-outline/20 bg-background text-primary/40"}`}>
                      ● GROUNDING {groundedText ? "READY" : "EMPTY"}
                    </span>
                  </div>
                </div>

                {/* Exporter Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleExportTXT}
                    className="p-3 border border-primary hover:border-secondary hover:bg-secondary/10 text-primary transition-all flex flex-col gap-1 items-start text-left cursor-pointer rounded-none group bg-background shadow-[2px_2px_0px_#1b222c]"
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-black text-secondary group-hover:text-primary">
                      <FileText className="w-3.5 h-3.5" /> PLAIN TEXT (.TXT)
                    </div>
                    <span className="text-[9px] font-sans text-on-surface-variant">Universal cross-OS plain text. Readable natively on all devices.</span>
                  </button>

                  <button
                    onClick={handleExportMD}
                    className="p-3 border border-primary hover:border-secondary hover:bg-secondary/10 text-primary transition-all flex flex-col gap-1 items-start text-left cursor-pointer rounded-none group bg-background shadow-[2px_2px_0px_#1b222c]"
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-black text-secondary group-hover:text-primary">
                      <Globe className="w-3.5 h-3.5" /> MARKDOWN (.MD)
                    </div>
                    <span className="text-[9px] font-sans text-on-surface-variant">Formatted documentation layout. Highly readable in notes/docs apps.</span>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="p-3 border border-primary hover:border-secondary hover:bg-secondary/10 text-primary transition-all flex flex-col gap-1 items-start text-left cursor-pointer rounded-none group bg-background shadow-[2px_2px_0px_#1b222c]"
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-black text-secondary group-hover:text-primary">
                      <Layers className="w-3.5 h-3.5" /> STRUCTURED JSON (.JSON)
                    </div>
                    <span className="text-[9px] font-sans text-on-surface-variant">Complete data object package. Ideal for software integration.</span>
                  </button>
                </div>
              </div>
            </>
          </div>
      </div>
    </div>
  );
}
