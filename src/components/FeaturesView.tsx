import { useState, useEffect, FormEvent, ClipboardEvent } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Link2, 
  Download, 
  Tv, 
  Volume2, 
  Zap, 
  ShieldCheck, 
  PlayCircle, 
  Music, 
  FileVideo, 
  FileImage,
  FileText,
  CheckCircle2, 
  AlertCircle,
  Loader2,
  History,
  Trash2,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Monitor,
  Info,
  Plus,
  ListPlus,
  Play,
  Sparkles
} from "lucide-react";
import { ExtractedMedia, ActiveTab } from "../types";
import { jsPDF } from "jspdf";
import VideoPreviewSimulator from "./VideoPreviewSimulator";
import MediaWorkspace from "./MediaWorkspace";
import ExtractionProgressBar from "./ExtractionProgressBar";
import AiCreativeLab from "./AiCreativeLab";
import UniversalExportModal from "./UniversalExportModal";

interface QueuedTask {
  id: string;
  url: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnailUrl: string;
  status: "staged" | "queued" | "parsing" | "completed" | "failed";
  progress: number;
  error?: string;
}

interface FeaturesViewProps {
  onOpenWebsite?: (url: string) => void;
  onTriggerAlert?: (title: string, message: string) => void;
  user: any;
  authLoading: boolean;
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function FeaturesView({ onOpenWebsite, onTriggerAlert, user, authLoading, setActiveTab }: FeaturesViewProps) {
  const [url, setUrl] = useState(() => {
    return localStorage.getItem("extractile_temp_url") || "";
  });
  const [urlInputMode, setUrlInputMode] = useState<"single" | "bulk">("single");
  const [bulkUrls, setBulkUrls] = useState(() => {
    return localStorage.getItem("extractile_temp_bulk_urls") || "";
  });
  const [queue, setQueue] = useState<QueuedTask[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [status, setStatus] = useState<"idle" | "parsing" | "results" | "downloading" | "complete">("idle");
  const [selectedVideo, setSelectedVideo] = useState("1080p");
  const [selectedAudio, setSelectedAudio] = useState("320kbps");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-copy to clipboard toggle state
  const [autoCopy, setAutoCopy] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Extractor chosen format options
  const [videoFormat, setVideoFormat] = useState<"MP4" | "WEBM" | "MKV" | "MOV" | "MP3">("MP4");
  const [photoFormat, setPhotoFormat] = useState<"PNG" | "WEBP" | "JPEG">("JPEG");
  const [photoResolution, setPhotoResolution] = useState<"4K" | "2K" | "1080P" | "720P">("4K");
  const [postFormat, setPostFormat] = useState<"PDF" | "TXT" | "JSON">("PDF");
  const [extractionFormat, setExtractionFormat] = useState<"MP4" | "MOV" | "MP3">("MP4");
  const [extractionMode, setExtractionMode] = useState<"media" | "photo" | "post">("media");
  const [selectedOS, setSelectedOS] = useState<"android" | "ios" | "windows">("android");

  // Cross-OS Universal Export Modal States
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalData, setExportModalData] = useState<{
    title: string;
    filename: string;
    mimeType: string;
    content: string;
    imageUrl?: string;
    type: "video" | "photo" | "post" | "ai_lab";
  }>({
    title: "",
    filename: "",
    mimeType: "",
    content: "",
    type: "photo"
  });

  // Real-time Visual Editor States linked directly to previewer and workspace
  const [videoFilter, setVideoFilter] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [watermarkText, setWatermarkText] = useState("");
  const [aiPhotoEffect, setAiPhotoEffect] = useState("");

  const [history, setHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem("extractile_history");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "hist-1",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Rick Astley - Never Gonna Give You Up (Official Video)",
        channel: "Rick Astley Archive",
        views: "1.4B",
        duration: "3:32",
        thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
        timestamp: "Jun 25, 09:15 PM"
      },
      {
        id: "hist-2",
        url: "https://www.youtube.com/watch?v=lofi-beats",
        title: "Lofi Hip Hop Radio - Beats to Study / Work to",
        channel: "The Lofi Society",
        views: "320M",
        duration: "LIVE",
        thumbnailUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=800&q=80",
        timestamp: "Jun 25, 06:40 PM"
      },
      {
        id: "hist-3",
        url: "https://www.youtube.com/watch?v=rust-physics-engine",
        title: "Build a Quantum Physics Engine in Rust - Monograph 45",
        channel: "DevForge Laboratory",
        views: "450K",
        duration: "45:10",
        thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        timestamp: "Jun 25, 02:12 PM"
      }
    ];
  });

  const [activeSegment, setActiveSegment] = useState<"capture" | "history" | "ai_lab">("capture");

  useEffect(() => {
    localStorage.setItem("extractile_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("extractile_temp_url", url);
  }, [url]);

  useEffect(() => {
    localStorage.setItem("extractile_temp_bulk_urls", bulkUrls);
  }, [bulkUrls]);

  // Auto-parse URL from share query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("url");
    if (sharedUrl) {
      try {
        const decoded = decodeURIComponent(sharedUrl);
        setUrl(decoded);
        
        // Auto-extract metadata and transition to results view
        const finalData = parseUrlHeuristic(decoded);
        setExtractedData({
          title: finalData.title,
          channel: finalData.channel,
          views: finalData.views,
          duration: finalData.duration,
          thumbnailUrl: finalData.thumbnailUrl,
          videoOptions: [
            { id: "1080p", label: "1080p Premium Scaled", size: "450 MB" },
            { id: "720p", label: "720p Standard Print", size: "210 MB" },
            { id: "480p", label: "480p Reference Draft", size: "85 MB" },
          ],
          audioOptions: [
            { id: "320kbps", label: "320kbps Master FLAC", size: "12 MB" },
            { id: "256kbps", label: "256kbps Studio AAC", size: "9 MB" },
          ]
        });
        setStatus("results");
        
        // Fetch oEmbed details in the background if possible
        fetch(`https://noembed.com/embed?url=${encodeURIComponent(decoded)}`)
          .then(res => {
            if (res.ok) return res.json();
          })
          .then(json => {
            if (json && json.title) {
              setExtractedData(prev => ({
                ...prev,
                title: json.title,
                channel: json.author_name || json.provider_name || prev.channel,
                thumbnailUrl: json.thumbnail_url || prev.thumbnailUrl
              }));
            }
          })
          .catch(err => console.warn("Share link oEmbed fetch failed:", err));
      } catch (err) {
        console.error("Auto-parse shared URL failed", err);
      }
    }
  }, []);

  const [extractedData, setExtractedData] = useState<ExtractedMedia>({
    title: "Advanced Data Visualization Techniques in WebGL - Masterclass 2024",
    channel: "TechInsights",
    views: "1.2M",
    duration: "12:45",
    thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    videoOptions: [
      { id: "1080p", label: "1080p Premium", size: "450 MB" },
      { id: "720p", label: "720p Standard", size: "210 MB" },
      { id: "480p", label: "480p Basic", size: "85 MB" },
    ],
    audioOptions: [
      { id: "320kbps", label: "320kbps MP3", size: "12 MB" },
      { id: "256kbps", label: "256kbps AAC", size: "9 MB" },
    ]
  });

  // Video trimming states
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState("00:00");
  const [trimEnd, setTrimEnd] = useState("");

  // Auto-set trimEnd on media update
  useEffect(() => {
    if (extractedData && extractedData.duration && extractedData.duration !== "POST" && extractedData.duration !== "LIVE") {
      setTrimEnd(extractedData.duration);
    } else {
      setTrimEnd("05:00");
    }
  }, [extractedData]);

  // Synchronize active tasks (both bulk queue items and single upscales) to localStorage
  useEffect(() => {
    const activeQueueItems = queue
      .filter((t) => t.status === "queued" || t.status === "parsing")
      .map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title || "Bulk Target Extraction",
        channel: t.channel || "Source Creator",
        views: t.views || "1.2M",
        duration: t.duration || "5:20",
        thumbnailUrl: t.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
        progress: t.progress || 0,
        status: t.status,
        type: "bulk",
        timestamp: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      }));

    const activeSingleItems: any[] = [];
    if (status === "downloading") {
      activeSingleItems.push({
        id: `single-${url}`,
        url: url,
        title: extractedData?.title || "Single Video Scale",
        channel: extractedData?.channel || "Source Creator",
        views: extractedData?.views || "1.2M",
        duration: extractedData?.duration || "5:20",
        thumbnailUrl: extractedData?.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
        progress: downloadProgress,
        status: "downloading",
        type: "single",
        timestamp: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      });
    }

    const mergedActive = [...activeQueueItems, ...activeSingleItems];

    if (mergedActive.length > 0) {
      localStorage.setItem("extractile_active_tasks", JSON.stringify(mergedActive));
    } else {
      localStorage.removeItem("extractile_active_tasks");
    }
  }, [queue, status, downloadProgress, url, extractedData]);

  const parseUrlHeuristic = (urlStr: string) => {
    try {
      const trimmed = urlStr.trim();
      let parseable = trimmed;
      if (!/^https?:\/\//i.test(parseable)) {
        parseable = "https://" + parseable;
      }
      const urlObj = new URL(parseable);
      const lower = parseable.toLowerCase();
      let channel = "Media Network";
      
      if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
        channel = "YouTube";
      } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
        channel = "Instagram Creator";
      } else if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com")) {
        channel = "Facebook Media";
      } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
        channel = "X / Twitter Post";
      } else if (lower.includes("linkedin.com")) {
        channel = "LinkedIn Post";
      } else if (lower.includes("pinterest.com") || lower.includes("pin.it")) {
        channel = "Pinterest Pin";
      } else if (lower.includes("vimeo.com")) {
        channel = "Vimeo Studio";
      } else if (lower.includes("tiktok.com")) {
        channel = "TikTok Creator";
      } else {
        let hostname = urlObj.hostname.replace("www.", "");
        let domain = hostname.split(".")[0];
        channel = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Media`;
      }

      let title = "";
      
      // Try to extract from common parameters
      const params = ["v", "title", "q", "name", "id", "video"];
      for (const p of params) {
        const val = urlObj.searchParams.get(p);
        if (val && val.length > 3 && !/^[a-zA-Z0-9_-]{10,12}$/.test(val)) {
          title = decodeURIComponent(val).replace(/[-_+]/g, " ");
          break;
        }
      }

      if (!title) {
        // Try parsing slug from path
        const segments = urlObj.pathname.split("/").filter(s => s && s.length > 2);
        if (segments.length > 0) {
          const slug = segments.reduce((a, b) => a.length > b.length ? a : b);
          if (slug.length > 3 && !/^[0-9]+$/.test(slug) && !/^[a-zA-Z0-9_-]{10,12}$/.test(slug)) {
            title = decodeURIComponent(slug).replace(/[-_+]/g, " ");
          }
        }
      }

      if (!title) {
        if (lower.includes("twitter.com") || lower.includes("x.com")) {
          title = "The future of generative AI scaling and real-time canvas architectures";
        } else if (lower.includes("linkedin.com")) {
          title = "How we scaled our real-time media ingestion system to process 10M stream packages daily";
        } else if (lower.includes("pinterest.com") || lower.includes("pin.it")) {
          title = "Aesthetic Retro-Futuristic Slate Desk Setup Inspiration";
        } else {
          title = "Pristine Media Stream Package";
        }
      } else {
        // Capitalize words nicely
        title = title.split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      // Views range
      let views = "1.2M";
      if (lower.includes("twitter.com") || lower.includes("x.com")) {
        views = "142K Views";
      } else if (lower.includes("linkedin.com")) {
        views = "1.2K Reactions";
      } else if (lower.includes("pinterest.com") || lower.includes("pin.it")) {
        views = "5.4K Saves";
      } else {
        const viewsList = ["1.4M", "320K", "890K", "2.1M", "450K", "1.2M", "5.4M"];
        views = viewsList[Math.abs(urlStr.length) % viewsList.length];
      }

      // Duration range
      let duration = "5:22";
      if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("linkedin.com") || lower.includes("pinterest.com") || lower.includes("pin.it") || lower.includes("post")) {
        duration = "POST";
      } else {
        const durationList = ["4:32", "12:45", "3:10", "45:10", "0:59", "2:30", "8:15", "5:22"];
        duration = durationList[Math.abs(urlStr.length) % durationList.length];
      }

      // Clean category high-quality thumbnail
      let thumbnail = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
      
      if (lower.includes("music") || lower.includes("song") || lower.includes("audio")) {
        thumbnail = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80";
      } else if (lower.includes("code") || lower.includes("dev") || lower.includes("program") || lower.includes("rust") || lower.includes("react")) {
        thumbnail = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80";
      } else if (lower.includes("lofi") || lower.includes("relax")) {
        thumbnail = "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=800&q=80";
      } else if (lower.includes("space") || lower.includes("nasa") || lower.includes("sky")) {
        thumbnail = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80";
      } else if (lower.includes("nature") || lower.includes("travel") || lower.includes("drone") || lower.includes("dolomites")) {
        thumbnail = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";
      }

      return { title, channel, views, duration, thumbnailUrl: thumbnail };
    } catch (e) {
      return {
        title: "Pristine Media Stream Package",
        channel: "Media Network",
        views: "1.2M",
        duration: "5:10",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
      };
    }
  };

  const downloadPhotoAsFormat = async (imgUrl: string, titleStr: string, format: string, resolution: "4K" | "2K" | "1080P" | "720P" = "4K") => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      img.src = imgUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        // Define target dimensions based on selected high quality resolution
        let width = 3840;
        let height = 2160;
        if (resolution === "2K") {
          width = 2560;
          height = 1440;
        } else if (resolution === "1080P") {
          width = 1920;
          height = 1080;
        } else if (resolution === "720P") {
          width = 1280;
          height = 720;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Enable maximum bi-linear smoothing for pristine upscaled output
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let mimeType = "image/jpeg";
          let ext = "jpg";
          if (format === "PNG") {
            mimeType = "image/png";
            ext = "png";
          } else if (format === "WEBP") {
            mimeType = "image/webp";
            ext = "webp";
          }
          canvas.toBlob((blob) => {
            if (blob) {
              const urlBlob = window.URL.createObjectURL(blob);
              setExportModalData({
                title: `Extracted Photo Artifact (${resolution})`,
                filename: `${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${resolution.toLowerCase()}.${ext}`,
                mimeType: mimeType,
                content: urlBlob,
                imageUrl: urlBlob,
                type: "photo"
              });
              setExportModalOpen(true);
            }
          }, mimeType, 0.98); // High quality compression
        }
      };
      img.onerror = () => {
        setExportModalData({
          title: "Extracted Photo Artifact",
          filename: `${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cover.${format.toLowerCase() === "jpeg" ? "jpg" : format.toLowerCase()}`,
          mimeType: format === "PNG" ? "image/png" : format === "WEBP" ? "image/webp" : "image/jpeg",
          content: imgUrl,
          imageUrl: imgUrl,
          type: "photo"
        });
        setExportModalOpen(true);
      };
    } catch (err) {
      setExportModalData({
        title: "Extracted Photo Artifact",
        filename: `${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cover.${format.toLowerCase() === "jpeg" ? "jpg" : format.toLowerCase()}`,
        mimeType: format === "PNG" ? "image/png" : format === "WEBP" ? "image/webp" : "image/jpeg",
        content: imgUrl,
        imageUrl: imgUrl,
        type: "photo"
      });
      setExportModalOpen(true);
    }
  };

  const downloadPostNarrative = (titleStr: string, textStr: string, format: "PDF" | "TXT" | "JSON") => {
    try {
      const cleanTitleStr = titleStr.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const filename = `${cleanTitleStr || "extracted-post"}-narrative.${format.toLowerCase()}`;
      
      if (format === "TXT") {
        setExportModalData({
          title: "Extracted Narrative Post (TXT)",
          filename: filename,
          mimeType: "text/plain;charset=utf-8",
          content: textStr,
          type: "post"
        });
        setExportModalOpen(true);
      } else if (format === "JSON") {
        const jsonPayload = JSON.stringify({
          title: titleStr,
          channel: extractedData.channel,
          views: extractedData.views,
          duration: extractedData.duration,
          url: url,
          timestamp: new Date().toISOString(),
          narrative_content: textStr
        }, null, 2);
        
        setExportModalData({
          title: "Extracted Narrative Metadata (JSON)",
          filename: filename,
          mimeType: "application/json;charset=utf-8",
          content: jsonPayload,
          type: "post"
        });
        setExportModalOpen(true);
      } else if (format === "PDF") {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });
        
        const pageHeight = 297;
        const pageWidth = 210;
        const marginX = 20;
        let y = 20;
        
        // Header Banner
        doc.setFillColor(27, 34, 44);
        doc.rect(0, 0, pageWidth, 40, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("EXTRACTILE POST NARRATIVE", marginX, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(244, 164, 96);
        doc.text("HIGH-FIDELITY STREAM ARCHIVE & PARSER ENGINE", marginX, 26);
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, marginX, 32);
        
        // Main Metadata
        y = 52;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(27, 34, 44);
        
        const asciiTitle = titleStr.replace(/[^\x00-\x7F]/g, "");
        const titleLines = doc.splitTextToSize(asciiTitle, pageWidth - (marginX * 2));
        doc.text(titleLines, marginX, y);
        y += (titleLines.length * 6) + 4;
        
        doc.setDrawColor(218, 226, 236);
        doc.setLineWidth(0.5);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(27, 34, 44);
        doc.text("SOURCE STREAM METADATA:", marginX, y);
        y += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(74, 85, 104);
        doc.text(`• Channel / Creator: ${extractedData.channel.replace(/[^\x00-\x7F]/g, "")}`, marginX + 4, y);
        y += 5;
        doc.text(`• Total Video Views: ${extractedData.views}`, marginX + 4, y);
        y += 5;
        doc.text(`• Duration Length: ${extractedData.duration}`, marginX + 4, y);
        y += 5;
        
        const shortUrl = url.length > 70 ? url.substring(0, 67) + "..." : url;
        doc.text(`• Resource URL Link: ${shortUrl}`, marginX + 4, y);
        y += 10;
        
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 10;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(27, 34, 44);
        doc.text("POST NARRATIVE & CONTENTS:", marginX, y);
        y += 7;
        
        const asciiText = textStr.replace(/[^\x00-\x7F]/g, "");
        const paragraphs = asciiText.split("\n");
        
        paragraphs.forEach((p) => {
          if (!p.trim()) {
            y += 4;
            return;
          }
          
          const pLines = doc.splitTextToSize(p.trim(), pageWidth - (marginX * 2));
          
          pLines.forEach((line: string) => {
            if (y > pageHeight - 20) {
              doc.addPage();
              doc.setFillColor(27, 34, 44);
              doc.rect(0, 0, pageWidth, 15, "F");
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(255, 255, 255);
              doc.text(`ARCHIVAL CONTINUATION - ${titleStr.substring(0, 40).replace(/[^\x00-\x7F]/g, "")}...`, marginX, 10);
              y = 25;
            }
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(45, 55, 72);
            doc.text(line, marginX, y);
            y += 5;
          });
          y += 2.5;
        });
        
        const pdfBlob = doc.output('blob');
        const urlBlob = window.URL.createObjectURL(pdfBlob);
        
        setExportModalData({
          title: "Extracted Narrative (Universal PDF Document)",
          filename: filename,
          mimeType: "application/pdf",
          content: urlBlob,
          imageUrl: undefined,
          type: "post"
        });
        setExportModalOpen(true);
      }
    } catch (err: any) {
      console.error("Narrative generation failed:", err);
      onTriggerAlert?.("Export Error", "Failed to compile narrative document.");
    }
  };

  const ensureProtocol = (inputUrl: string): string => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return trimmed;
    // Check if it already has a protocol scheme
    if (/^[a-zA-Z0-9+-.]+:\/\//.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleUrlPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      e.preventDefault();
      const sanitized = ensureProtocol(pastedText);
      setUrl(sanitized);
    }
  };

  const handleBulkPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      e.preventDefault();
      const lines = pastedText.split(/\n/);
      const sanitizedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        return ensureProtocol(trimmed);
      });
      setBulkUrls(sanitizedLines.join("\n"));
    }
  };

  const handleExtract = async (e: FormEvent) => {
    e.preventDefault();
    const sanitizedUrl = ensureProtocol(url);
    if (!sanitizedUrl) {
      setErrorMsg("Please enter a valid YouTube, Facebook, or Instagram URL (or other supported platform links).");
      return;
    }
    setUrl(sanitizedUrl);
    setErrorMsg("");
    setStatus("parsing");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: sanitizedUrl, 
          format: extractionFormat, 
          extractionMode: extractionMode 
        })
      });

      if (!response.ok) {
        throw new Error("Backend extraction error");
      }

      const data = await response.json();

      // Sync the default download format to match the initially extracted format
      setVideoFormat(data.format);

      // Simulation parser transition delay for visual rhythm
      setTimeout(() => {
        setExtractedData({
          title: data.title,
          channel: data.channel,
          views: data.views,
          duration: data.duration,
          thumbnailUrl: data.thumbnailUrl,
          postContent: data.postContent,
          videoOptions: [
            { id: "1080p", label: "1080p Premium Scaled", size: "450 MB" },
            { id: "720p", label: "720p Standard Print", size: "210 MB" },
            { id: "480p", label: "480p Reference Draft", size: "85 MB" },
          ],
          audioOptions: [
            { id: "320kbps", label: "320kbps Master FLAC", size: "12 MB" },
            { id: "256kbps", label: "256kbps Studio AAC", size: "9 MB" },
          ]
        });

        // Save to history list
        const newItem = {
          id: `hist-${Date.now()}`,
          url: sanitizedUrl,
          title: data.title,
          channel: data.channel,
          views: data.views,
          duration: data.duration,
          thumbnailUrl: data.thumbnailUrl,
          postContent: data.postContent,
          timestamp: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        };

        setHistory((prev) => {
          const filtered = prev.filter(item => item.url.toLowerCase() !== sanitizedUrl.toLowerCase());
          return [newItem, ...filtered];
        });

        setStatus("results");
      }, 1500);

    } catch (err) {
      console.warn("Backend extraction failed, falling back to secure client-side pristine engine:", err);
      
      // Local client-side fallback parsing
      const fallbackData = parseUrlHeuristic(sanitizedUrl);
      let simulatedPostContent: string | undefined = undefined;
      
      if (extractionMode === "post") {
        simulatedPostContent = `🚨 [EXTRACTION BREAKING] New comprehensive high-fidelity narrative analysis published for "${fallbackData.title}". This stream container has been completely mapped, with 1080p video slices, pristine mono-isolated audio stems, and custom metadata tables. Discover more inside the active workspace sandbox.\n\nSource: ${sanitizedUrl}\nOperator: ${user?.email || "Guest Extractor"}\nArchive Signature: ET-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      setVideoFormat(extractionFormat || "mp4");

      setTimeout(() => {
        setExtractedData({
          title: fallbackData.title,
          channel: fallbackData.channel,
          views: fallbackData.views,
          duration: fallbackData.duration,
          thumbnailUrl: fallbackData.thumbnailUrl,
          postContent: simulatedPostContent,
          videoOptions: [
            { id: "1080p", label: "1080p Premium Scaled", size: "450 MB" },
            { id: "720p", label: "720p Standard Print", size: "210 MB" },
            { id: "480p", label: "480p Reference Draft", size: "85 MB" },
          ],
          audioOptions: [
            { id: "320kbps", label: "320kbps Master FLAC", size: "12 MB" },
            { id: "256kbps", label: "256kbps Studio AAC", size: "9 MB" },
          ]
        });

        // Save to history list
        const newItem = {
          id: `hist-${Date.now()}`,
          url: sanitizedUrl,
          title: fallbackData.title,
          channel: fallbackData.channel,
          views: fallbackData.views,
          duration: fallbackData.duration,
          thumbnailUrl: fallbackData.thumbnailUrl,
          postContent: simulatedPostContent,
          timestamp: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        };

        setHistory((prev) => {
          const filtered = prev.filter(item => item.url.toLowerCase() !== sanitizedUrl.toLowerCase());
          return [newItem, ...filtered];
        });

        setStatus("results");
      }, 1500);
    }
  };

  const handleBulkExtractSubmit = (e: FormEvent) => {
    e.preventDefault();
    const urls = bulkUrls
      .split(/\n|,/)
      .map(u => u.trim())
      .filter(u => u.length > 0)
      .map(u => ensureProtocol(u));

    if (urls.length === 0) {
      setErrorMsg("Please enter at least one valid URL for bulk extraction.");
      return;
    }
    setErrorMsg("");

    const newTasks: QueuedTask[] = urls.map((u, i) => {
      const heuristic = parseUrlHeuristic(u);
      return {
        id: `task-${Date.now()}-${i}`,
        url: u,
        title: heuristic.title,
        channel: heuristic.channel,
        views: heuristic.views,
        duration: heuristic.duration,
        thumbnailUrl: heuristic.thumbnailUrl,
        status: "staged",
        progress: 0
      };
    });

    setQueue(prev => [...prev, ...newTasks]);
    setBulkUrls("");
  };

  const handleRemoveTask = (taskId: string) => {
    setQueue(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStartBulkExtraction = () => {
    setQueue(prev => prev.map(t => t.status === "staged" ? { ...t, status: "queued" } : t));
  };

  const handleDownloadTaskDirect = (task: QueuedTask) => {
    try {
      const fileContent = `=========================================
EXTRACTILE HIGH-FIDELITY ARCHIVAL REPORT (BULK)
=========================================
Timestamp: ${new Date().toLocaleString()}
Source Target: ${task.url}
Media Title: ${task.title}
Source Creator/Channel: ${task.channel}
Playback Views: ${task.views}
Playback Duration: ${task.duration}

Downloaded Package Specs:
- Video Resolution: 1080p Premium Scaled
- Video Export Format: MP4 (.mp4)
- Audio Preservation: 320kbps Master FLAC
- Photo Resolution: HD Original Artwork Capture
- Photo Export Format: JPEG (.jpg)

System Status: Certified Reconstructed Byte Stream Envelopes Sealed
License: Free & Open Archival Copy. Bypassed CDN protocol overhead.
=========================================`;

      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
      const fileUrl = window.URL.createObjectURL(blob);
      
      const aReport = document.createElement('a');
      aReport.href = fileUrl;
      aReport.download = `extractile-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.txt`;
      document.body.appendChild(aReport);
      aReport.click();
      document.body.removeChild(aReport);

      const aVideo = document.createElement('a');
      aVideo.href = fileUrl;
      aVideo.download = `extractile-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
      document.body.appendChild(aVideo);
      aVideo.click();
      document.body.removeChild(aVideo);

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Direct download failed:", err);
    }
  };

  useEffect(() => {
    const nextTask = queue.find((t) => t.status === "queued");
    if (nextTask && !isProcessingQueue) {
      setIsProcessingQueue(true);
      
      // Update task to parsing
      setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: "parsing", progress: 10 } : t));
      
      fetch(`https://noembed.com/embed?url=${encodeURIComponent(nextTask.url)}`)
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(json => {
          const finalTitle = json && json.title ? json.title : nextTask.title;
          const finalChannel = json && (json.author_name || json.provider_name) ? (json.author_name || json.provider_name) : nextTask.channel;
          const finalThumb = json && json.thumbnail_url ? json.thumbnail_url : nextTask.thumbnailUrl;
          
          let currentProg = 10;
          const interval = setInterval(() => {
            currentProg += Math.floor(Math.random() * 25) + 15;
            if (currentProg >= 100) {
              clearInterval(interval);
              
              setQueue(prev => prev.map(t => t.id === nextTask.id ? {
                ...t,
                title: finalTitle,
                channel: finalChannel,
                thumbnailUrl: finalThumb,
                status: "completed",
                progress: 100
              } : t));
              
              const historyItem = {
                id: `hist-${Date.now()}-${nextTask.id}`,
                url: nextTask.url,
                title: finalTitle,
                channel: finalChannel,
                views: nextTask.views,
                duration: nextTask.duration,
                thumbnailUrl: finalThumb,
                timestamp: new Date().toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              };
              
              setHistory(prev => {
                const filtered = prev.filter(item => item.url.toLowerCase() !== nextTask.url.toLowerCase());
                return [historyItem, ...filtered];
              });
              
              setIsProcessingQueue(false);
            } else {
              setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, progress: currentProg } : t));
            }
          }, 250);
        })
        .catch(err => {
          console.warn("Bulk queue oEmbed failed:", err);
          // Fallback to complete with heuristic
          setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: "completed", progress: 100 } : t));
          setIsProcessingQueue(false);
        });
    }
  }, [queue, isProcessingQueue]);

  const handleDownload = () => {
    setStatus("downloading");
    setDownloadProgress(0);
    setCopiedLink(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "downloading") {
      interval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus("complete");
            
            // Trigger actual download of metadata report text file and mock container file
            try {
              const fileContent = `=========================================
EXTRACTILE HIGH-FIDELITY ARCHIVAL REPORT
=========================================
Timestamp: ${new Date().toLocaleString()}
Source Target: ${url}
Media Title: ${extractedData.title}
Source Creator/Channel: ${extractedData.channel}
Playback Views: ${extractedData.views}
Playback Duration: ${extractedData.duration}

Downloaded Package Specs:
- Video Resolution: ${selectedVideo === "1080p" ? "1080p Premium Scaled" : selectedVideo === "720p" ? "720p Standard Print" : "480p Reference Draft"}
- Video Export Format: ${videoFormat} (.${videoFormat.toLowerCase()})
- Audio Preservation: ${selectedAudio === "320kbps" ? "320kbps Master FLAC" : "256kbps Studio AAC"}
- Photo Resolution: HD Original Artwork Capture
- Photo Export Format: ${photoFormat} (.${photoFormat.toLowerCase() === "jpeg" ? "jpg" : photoFormat.toLowerCase()})
${enableTrim ? `- Segment Trim Selected: [Start: ${trimStart} -> End: ${trimEnd}] (Custom Trim Active)\n` : "- Segment Trim: Full Stream Capture (No Trim Applied)\n"}
System Status: Certified Reconstructed Byte Stream Envelopes Sealed
License: Free & Open Archival Copy. Bypassed CDN protocol overhead.
=========================================`;

              setExportModalData({
                title: `Extracted Media Archival Package (${videoFormat})`,
                filename: `extractile-${extractedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${videoFormat.toLowerCase()}`,
                mimeType: "text/plain;charset=utf-8",
                content: fileContent,
                imageUrl: undefined,
                type: "video"
              });
              setExportModalOpen(true);
            } catch (err) {
              console.error("Txt download trigger error:", err);
            }

            // Auto-copy link to clipboard if enabled
            if (autoCopy) {
              try {
                const safeTitle = extractedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const assetLink = `https://extractile.app/download/extractile-${safeTitle}.${videoFormat.toLowerCase()}`;
                navigator.clipboard.writeText(assetLink)
                  .then(() => {
                    setCopiedLink(true);
                    onTriggerAlert?.("Auto-Copied to Clipboard", "The link to your extracted asset has been copied automatically.");
                  })
                  .catch((err) => {
                    console.error("Auto-copy failed:", err);
                  });
              } catch (copyErr) {
                console.error("Copy error:", copyErr);
              }
            }

            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [status, extractedData, url, selectedVideo, selectedAudio, autoCopy, videoFormat, onTriggerAlert, enableTrim, trimStart, trimEnd]);

  const handleReset = () => {
    setStatus("idle");
    setUrl("");
    setDownloadProgress(0);
    setVideoFilter("");
    setAspectRatio("16:9");
    setWatermarkText("");
    setAiPhotoEffect("");
    setVideoFormat("MP4");
    setPhotoFormat("JPEG");
    setCopiedLink(false);
  };

  const handleLoadHistoryItem = (item: any) => {
    setUrl(item.url);
    setExtractedData({
      title: item.title,
      channel: item.channel,
      views: item.views,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      videoOptions: [
        { id: "1080p", label: "1080p Premium Scaled", size: "450 MB" },
        { id: "720p", label: "720p Standard Print", size: "210 MB" },
        { id: "480p", label: "480p Reference Draft", size: "85 MB" },
      ],
      audioOptions: [
        { id: "320kbps", label: "320kbps Master FLAC", size: "12 MB" },
        { id: "256kbps", label: "256kbps Studio AAC", size: "9 MB" },
      ]
    });
    setStatus("results");
  };

  useEffect(() => {
    const pendingRestore = localStorage.getItem("extractile_restore_pending");
    if (pendingRestore) {
      try {
        const item = JSON.parse(pendingRestore);
        handleLoadHistoryItem(item);
        localStorage.removeItem("extractile_restore_pending");
      } catch (err) {
        console.error("Failed to parse pending restore item:", err);
      }
    }
  }, []);

  const handleDeleteHistoryItem = (e: any, id: string) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  return (
    <div className="w-full relative py-6">
      <div className="aura-bg w-[500px] h-[500px] bg-secondary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5" />

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-10"
          >
            {/* Hero Headers */}
            <div className="text-center space-y-5 max-w-4xl">
              <span className="text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary block">
                EXTRACTILE ARCHIVAL DIVISION
              </span>
              <h1 className="font-serif font-normal text-4xl md:text-7xl text-primary tracking-tight leading-[0.95] max-w-3xl mx-auto">
                High-Fidelity Social <br/>
                <span className="italic font-normal text-secondary">Media Extraction.</span>
              </h1>
              <p className="text-[14px] md:text-[15px] text-on-surface-variant max-w-xl mx-auto leading-relaxed italic font-serif">
                A study in digital preservation. Capture lossless audio and reconstructed 1080p stream packages via sand-isolated secure pipelines.
              </p>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center justify-center gap-2 border-b border-primary/20 pb-0.5 w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setActiveSegment("capture")}
                className={`px-6 py-3.5 text-[11px] font-sans font-bold uppercase tracking-[0.2em] transition-all cursor-pointer relative ${
                  activeSegment === "capture"
                    ? "text-primary font-black"
                    : "text-on-surface-variant/60 hover:text-primary"
                }`}
              >
                <span>CAPTURE STREAM</span>
                {activeSegment === "capture" && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-secondary"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment("ai_lab")}
                className={`px-6 py-3.5 text-[11px] font-sans font-bold uppercase tracking-[0.2em] transition-all cursor-pointer relative flex items-center gap-2 ${
                  activeSegment === "ai_lab"
                    ? "text-primary font-black"
                    : "text-on-surface-variant/60 hover:text-primary"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                <span>AI MAGIC LAB ✨</span>
                {activeSegment === "ai_lab" && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-secondary"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment("history")}
                className={`px-6 py-3.5 text-[11px] font-sans font-bold uppercase tracking-[0.2em] transition-all cursor-pointer relative flex items-center gap-2 ${
                  activeSegment === "history"
                    ? "text-primary font-black"
                    : "text-on-surface-variant/60 hover:text-primary"
                }`}
              >
                <History className="w-3.5 h-3.5 text-secondary" />
                <span>ARCHIVAL HISTORY ({history.length})</span>
                {activeSegment === "history" && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-secondary"
                  />
                )}
              </button>
            </div>

            {activeSegment === "capture" ? (
              <div className="w-full flex flex-col items-center gap-12">
                {/* Link Input Card */}
                <div className="w-full max-w-3xl space-y-4">
                  {/* Selector Tabs & Extraction Mode Toggles */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#e4eaf0] dark:bg-surface-container p-2.5 border border-primary/25 shadow-[2px_2px_0px_rgba(27,34,44,0.05)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-1 bg-background/60 dark:bg-surface-lowest p-1.5 border border-primary/10 w-fit">
                      <button
                        type="button"
                        onClick={() => setUrlInputMode("single")}
                        className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                          urlInputMode === "single"
                            ? "bg-primary text-on-primary font-black shadow-[2px_2px_0px_#1b222c] dark:shadow-[2px_2px_0px_#ffffff]"
                            : "text-on-surface-variant/80 hover:text-primary dark:text-on-surface-variant/70 dark:hover:text-primary"
                        }`}
                      >
                        Single Target
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlInputMode("bulk")}
                        className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                          urlInputMode === "bulk"
                            ? "bg-primary text-on-primary font-black shadow-[2px_2px_0px_#1b222c] dark:shadow-[2px_2px_0px_#ffffff]"
                            : "text-on-surface-variant/80 hover:text-primary dark:text-on-surface-variant/70 dark:hover:text-primary"
                        }`}
                      >
                        Bulk Queue
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 bg-[#dcd9f0] dark:bg-surface-lowest p-1.5 border border-primary/20 w-fit">
                      <span className="text-[9px] font-mono font-bold text-primary/70 dark:text-primary/90 uppercase px-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
                        <span>PRO EXTRACTIONS:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setExtractionMode("media")}
                        className={`px-3.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none flex items-center gap-1.5 ${
                          extractionMode === "media"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-[2px_2px_0px_#1b222c] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.4)] border border-blue-400"
                            : "text-on-surface-variant hover:text-blue-600 dark:hover:text-blue-400 bg-background dark:bg-surface-container hover:bg-[#faf9ff] dark:hover:bg-surface-container-high border border-primary/10"
                        }`}
                      >
                        <FileVideo className="w-3.5 h-3.5" />
                        <span>Video & Audio</span>
                        <span className="text-[7px] font-mono bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-1 py-0.2 rounded-none font-extrabold">PRO</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExtractionMode("photo")}
                        className={`px-3.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none flex items-center gap-1.5 ${
                          extractionMode === "photo"
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-[2px_2px_0px_#1b222c] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.4)] border border-emerald-400"
                            : "text-on-surface-variant hover:text-emerald-600 dark:hover:text-emerald-400 bg-background dark:bg-surface-container hover:bg-[#faf9ff] dark:hover:bg-surface-container-high border border-primary/10"
                        }`}
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Photo / Cover</span>
                        <span className="text-[7px] font-mono bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded-none font-extrabold">PRO</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExtractionMode("post")}
                        className={`px-3.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none flex items-center gap-1.5 ${
                          extractionMode === "post"
                            ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-black shadow-[2px_2px_0px_#1b222c] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.4)] border border-pink-400"
                            : "text-on-surface-variant hover:text-fuchsia-600 dark:hover:text-fuchsia-400 bg-background dark:bg-surface-container hover:bg-[#faf9ff] dark:hover:bg-surface-container-high border border-primary/10"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Posts</span>
                        <span className="text-[7px] font-mono bg-fuchsia-100 dark:bg-fuchsia-950/50 text-fuchsia-800 dark:text-fuchsia-300 px-1 py-0.2 rounded-none font-extrabold">PRO</span>
                      </button>
                    </div>
                  </div>

                  {urlInputMode === "single" ? (
                    <form 
                      onSubmit={handleExtract}
                      className="bg-[#e4eaf0] dark:bg-surface-container border border-primary p-3 shadow-[6px_6px_0px_#1b222c] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.15)] transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                        <div className="relative w-full flex-grow">
                          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                          <input
                            type="url"
                            required
                            placeholder={
                              extractionMode === "post"
                                ? "Paste YouTube, Facebook, Instagram, LinkedIn, X/Twitter, or Pinterest URL here to extract post content..."
                                : extractionMode === "photo"
                                ? "Paste YouTube, Facebook, Instagram, or any video/post URL here to extract its cover photo/thumbnail..."
                                : "Paste YouTube, Facebook, or Instagram URL here to extract video & audio..."
                            }
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onPaste={handleUrlPaste}
                            onBlur={() => setUrl(ensureProtocol(url))}
                            className="w-full py-3.5 pl-11 pr-4 bg-background border border-outline-variant rounded-none text-on-surface placeholder:text-on-surface-variant/50 text-sm font-mono focus:border-primary focus:outline-none transition-all h-full"
                          />
                        </div>

                        {/* Output Format Dropdown */}
                        <div className="w-full lg:w-56 shrink-0 flex flex-col justify-center">
                          {extractionMode === "media" && (
                            <select
                              value={extractionFormat}
                              onChange={(e) => setExtractionFormat(e.target.value as "MP4" | "MOV" | "MP3")}
                              className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-3.5 focus:border-primary focus:outline-none cursor-pointer rounded-none h-full"
                            >
                              <option value="MP4">MP4 Video (.mp4)</option>
                              <option value="MOV">MOV Video (.mov)</option>
                              <option value="MP3">MP3 Audio (.mp3)</option>
                            </select>
                          )}
                          {extractionMode === "photo" && (
                            <select
                              value={photoFormat}
                              onChange={(e) => setPhotoFormat(e.target.value as "PNG" | "WEBP" | "JPEG")}
                              className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-3.5 focus:border-primary focus:outline-none cursor-pointer rounded-none h-full"
                            >
                              <option value="JPEG">JPEG Photo (.jpg)</option>
                              <option value="PNG">PNG Lossless (.png)</option>
                              <option value="WEBP">WEBP Modern (.webp)</option>
                            </select>
                          )}
                          {extractionMode === "post" && (
                            <select
                              value={postFormat}
                              onChange={(e) => setPostFormat(e.target.value as "PDF" | "TXT" | "JSON")}
                              className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-3.5 focus:border-primary focus:outline-none cursor-pointer rounded-none h-full"
                            >
                              <option value="PDF">PDF Document (.pdf)</option>
                              <option value="TXT">TXT Clean Transcript (.txt)</option>
                              <option value="JSON">JSON Post Metadata (.json)</option>
                            </select>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full lg:w-auto px-8 py-4 bg-primary hover:bg-secondary text-on-primary font-bold text-[11px] tracking-[0.18em] uppercase rounded-none cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-h-touch min-w-touch shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>EXTRACT NOW</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form 
                      onSubmit={handleBulkExtractSubmit}
                      className="bg-[#e4eaf0] dark:bg-surface-container border border-primary p-4 shadow-[6px_6px_0px_#1b222c] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.15)] transition-all duration-300 space-y-3"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
                          Bulk URL Entry (One HTTP/HTTPS address per line)
                        </label>
                        <textarea
                          rows={4}
                          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ&#10;https://www.youtube.com/watch?v=lofi-beats&#10;https://www.instagram.com/p/C7rX8y..."
                          value={bulkUrls}
                          onChange={(e) => setBulkUrls(e.target.value)}
                          onPaste={handleBulkPaste}
                          onBlur={() => {
                          const lines = bulkUrls.split(/\n/);
                          const sanitized = lines.map(l => {
                            const t = l.trim();
                            return t ? ensureProtocol(t) : "";
                          }).join("\n");
                          setBulkUrls(sanitized);
                        }}
                        className="w-full p-3.5 bg-background border border-outline-variant rounded-none text-on-surface placeholder:text-on-surface-variant/40 text-sm font-mono focus:border-primary focus:outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-[10px] font-mono text-on-surface-variant/80 uppercase font-semibold">
                        Staging lines: {bulkUrls.split('\n').filter(l => l.trim()).length} target(s)
                      </span>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 bg-secondary text-on-secondary font-bold text-[11px] tracking-[0.18em] uppercase rounded-none cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border border-primary/20 hover:bg-primary hover:text-on-primary"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>STAGE TARGETS IN QUEUE</span>
                      </button>
                    </div>
                  </form>
                  )}

                  {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 text-rose-800 text-xs font-mono justify-center">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Live Bulk Extraction Queue summary */}
                {queue.length > 0 && (
                  <div className="w-full max-w-3xl bg-[#e4eaf0] dark:bg-surface-container border border-primary p-6 shadow-[6px_6px_0px_#1b222c] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.15)] space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/20 pb-3 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-secondary animate-pulse" />
                          <h3 className="font-serif font-bold text-base text-on-surface">Live Bulk Extraction Desk</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-on-surface-variant uppercase tracking-wider font-bold">
                          <span className="bg-[#edeae4] text-on-surface border border-primary/25 px-1.5 py-0.5">
                            Staged: {queue.filter(t => t.status === "staged").length}
                          </span>
                          <span className="bg-amber-100 text-amber-800 border border-amber-300/50 px-1.5 py-0.5">
                            Processing: {queue.filter(t => t.status === "queued" || t.status === "parsing").length}
                          </span>
                          <span className="bg-green-100 text-green-800 border border-green-300/50 px-1.5 py-0.5">
                            Completed: {queue.filter(t => t.status === "completed").length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setQueue([]);
                            setErrorMsg("");
                          }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[9px] font-bold tracking-wider uppercase border border-rose-300/40 cursor-pointer transition-all rounded-none"
                        >
                          CLEAR ALL
                        </button>
                      </div>
                    </div>

                    {/* Staged Tasks Prompt Panel */}
                    {queue.some(t => t.status === "staged") && (
                      <div className="bg-[#edeae4] border-2 border-dashed border-[#4f5e7c]/60 p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background border border-primary text-secondary shrink-0">
                            <Info className="w-5 h-5 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-primary">
                              Queue Configuration Active ({queue.filter(t => t.status === "staged").length} Staged)
                            </h4>
                            <p className="text-[10px] font-mono text-on-surface-variant leading-tight">
                              You have added targets to your queue buffer. Click below to start concurrent extractions.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartBulkExtraction}
                          className="w-full md:w-auto px-6 py-3 bg-[#4f5e7c] hover:bg-primary text-white hover:text-on-primary font-mono text-xs font-black tracking-widest uppercase rounded-none border-2 border-primary cursor-pointer transition-all shadow-[3px_3px_0px_#1b222c] flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>START BULK EXTRACTION</span>
                        </button>
                      </div>
                    )}
                    {/* Queue Items list */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {queue.map((task) => (
                        <div 
                          key={task.id}
                          className="bg-background border border-primary/20 p-3.5 flex flex-col gap-3 relative overflow-hidden transition-all hover:border-primary/50 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-grow w-full sm:w-auto">
                              <div className="w-14 h-8 bg-neutral-900 border border-primary overflow-hidden relative flex-shrink-0">
                                <img 
                                  src={task.thumbnailUrl} 
                                  alt="" 
                                  className="w-full h-full object-cover filter grayscale contrast-120"
                                />
                                <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono bg-background text-on-surface px-0.5 border border-primary/35">
                                  {task.duration}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow">
                                <h4 className="font-serif font-semibold text-xs text-primary truncate">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[8px] font-mono text-on-surface-variant uppercase tracking-wider mt-0.5">
                                  <span className="font-bold">{task.channel}</span>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenWebsite?.(task.url)}
                                    className="text-secondary hover:text-primary hover:underline transition-all truncate max-w-[150px] sm:max-w-xs text-left cursor-pointer flex items-center gap-0.5 font-bold"
                                    title="Open website with animation sandbox"
                                  >
                                    <Link2 className="w-2.5 h-2.5 shrink-0" />
                                    <span>{task.url}</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0">
                              {/* Status indicator & progress */}
                              <div className="flex items-center gap-2">
                                {task.status === "staged" && (
                                  <span className="px-2 py-0.5 bg-neutral-100 border border-primary/20 text-on-surface-variant font-mono text-[8px] uppercase tracking-wider font-bold">
                                    Staged
                                  </span>
                                )}
                                {task.status === "queued" && (
                                  <span className="px-2 py-0.5 bg-[#dae2ec] border border-neutral-400 text-neutral-700 font-mono text-[8px] uppercase tracking-wider font-bold animate-pulse">
                                    In Queue
                                  </span>
                                )}
                                {task.status === "parsing" && (
                                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300/60 px-2 py-0.5">
                                    <Loader2 className="w-2.5 h-2.5 text-amber-700 animate-spin" />
                                    <span className="text-amber-800 font-mono text-[8px] uppercase tracking-wider font-bold animate-pulse">
                                      Decrypting {task.progress}%
                                    </span>
                                  </div>
                                )}
                                {task.status === "completed" && (
                                  <span className="px-2 py-0.5 bg-[#e1eae2] border border-[#4f5e7c]/35 text-[#4f5e7c] font-mono text-[8px] uppercase tracking-wider font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Verified
                                  </span>
                                )}
                              </div>

                              {/* Quick Actions */}
                              <div className="flex items-center gap-1.5">
                                {task.status === "completed" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleLoadHistoryItem(task)}
                                      className="px-2.5 py-1 bg-primary text-on-primary font-mono text-[9px] font-bold tracking-wider uppercase hover:bg-secondary cursor-pointer transition-all rounded-none"
                                      title="Open in full Interactive Workspace & Editors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadTaskDirect(task)}
                                      className="p-1.5 border border-primary/20 text-secondary hover:bg-primary hover:text-on-primary transition-all cursor-pointer rounded-none"
                                      title="Direct Download packaged assets"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                
                                {/* Option to remove individual items from queue */}
                                {(task.status === "staged" || task.status === "completed") && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(task.id)}
                                    className="p-1 border border-rose-300 hover:bg-rose-100 text-rose-800 hover:text-rose-950 transition-all cursor-pointer rounded-none"
                                    title="Remove from queue"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Subtle progress bar with animated fill state */}
                          <div className="w-full bg-[#dae2ec] h-1 border border-primary/10 relative overflow-hidden">
                            <motion.div 
                              className={`h-full ${
                                task.status === "completed" 
                                  ? "bg-[#4f5e7c]" 
                                  : task.status === "parsing" 
                                    ? "bg-secondary" 
                                    : "bg-neutral-300"
                              }`}
                              initial={{ width: "0%" }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newly Added Advanced Features section in place of the idle stream preview simulator */}
                <div className="w-full max-w-7xl space-y-6 mt-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-secondary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                        <span>System Protocol v1.5 Release</span>
                      </span>
                      <h2 className="font-serif font-normal text-2xl md:text-3xl text-primary tracking-tight">
                        Newly Integrated <span className="italic font-normal text-secondary">Pro Capabilities</span>
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono max-w-md md:text-right leading-relaxed italic">
                      These newly engineered pipelines are fully active and available. Paste any URL above to enable real-time stream previewing and active customization tools.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1: Showcase Pinboard */}
                    <div className="bg-rose-500/[0.04] dark:bg-rose-950/10 border border-rose-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-rose-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(244,63,94,0.08)] hover:shadow-[4px_4px_0px_#f43f5e] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                            <Sparkles className="w-4 h-4 text-rose-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 border border-rose-500/25">
                            CURATED ARCHIVE
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-rose-700 dark:text-rose-400">Pinterest Premium Showcase</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Discover the ultimate gallery of upscaled artwork, lossless cover preserves, and digital archives with resolution overlays.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-rose-500/10">
                        <button
                          type="button"
                          onClick={() => setActiveTab?.("showcase")}
                          className="w-full py-2.5 bg-rose-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-rose-700 cursor-pointer transition-all duration-150 rounded-none shadow-[2px_2px_0px_#9f1239] hover:shadow-none flex items-center justify-center gap-1.5"
                        >
                          <span>Explore Showcase Board</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>

                    {/* Feature 2: Social Broadcast Matrix */}
                    <div className="bg-sky-500/[0.04] dark:bg-sky-950/10 border border-sky-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-sky-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(14,165,233,0.08)] hover:shadow-[4px_4px_0px_#0ea5e9] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
                            <Zap className="w-4 h-4 text-sky-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-sky-600 dark:text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 border border-sky-500/25">
                            DIRECT BROADCAST
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-sky-700 dark:text-sky-400">Social Media Sharing Matrix</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Dispatch your high-fidelity captures straight to Twitter/X and LinkedIn directly from the post-extraction details with auto-generated text copy.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 text-[9px] font-mono font-semibold text-sky-600 dark:text-sky-400 italic flex items-center gap-1.5 border-t border-sky-500/10 pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block animate-pulse"></span>
                        <span>Fully integrated in results drawer</span>
                      </div>
                    </div>

                    {/* Feature 3: Visual Customization Sandbox */}
                    <div className="bg-amber-500/[0.04] dark:bg-amber-950/10 border border-amber-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-amber-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(245,158,11,0.08)] hover:shadow-[4px_4px_0px_#f59e0b] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                            <Tv className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 border border-amber-500/25">
                            ACTIVE WORKSPACE
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-amber-700 dark:text-amber-400">Visual Sandbox & Editors</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Modify media streams on-the-fly. Select precise crop bounds (16:9, 9:16, 1:1), add visual watermarks, and overlay cinema-grade monochrome/noir filters.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 text-[9px] font-mono font-semibold text-amber-600 dark:text-amber-400 italic flex items-center gap-1.5 border-t border-amber-500/10 pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>Locks onto stream container after paste</span>
                      </div>
                    </div>

                    {/* Feature 4: Multi-Format Document Exporter */}
                    <div className="bg-emerald-500/[0.04] dark:bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-emerald-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(16,185,129,0.08)] hover:shadow-[4px_4px_0px_#10b981] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                            <Download className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/25">
                            LOSSLESS FORMATS
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-emerald-700 dark:text-emerald-400">Formatted Document Suite</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Convert stream captions and visual descriptions into elegantly structured PDF narrative documents, clean plain text files, or raw JSON metadata logs.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 italic flex items-center gap-1.5 border-t border-emerald-500/10 pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Available in single target detail view</span>
                      </div>
                    </div>

                    {/* Feature 5: Offline Preservation Cache */}
                    <div className="bg-purple-500/[0.04] dark:bg-purple-950/10 border border-purple-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-purple-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(168,85,247,0.08)] hover:shadow-[4px_4px_0px_#a855f7] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
                            <History className="w-4 h-4 text-purple-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 border border-purple-500/25">
                            PERSISTENCE ENGINE
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-purple-700 dark:text-purple-400">Offline Resilient Storage Cache</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Never lose a high-fidelity capture. Staged bulk targets, completed extractions, and user histories automatically persist to client-side storage cache vaults.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 text-[9px] font-mono font-semibold text-purple-600 dark:text-purple-400 italic flex items-center gap-1.5 border-t border-purple-500/10 pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse"></span>
                        <span>Synchronized automatically</span>
                      </div>
                    </div>

                    {/* Feature 6: Google Secure Cloud Profiles */}
                    <div className="bg-indigo-500/[0.04] dark:bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-none relative overflow-hidden flex flex-col justify-between hover:border-indigo-500 transition-all duration-300 shadow-[4px_4px_0px_rgba(99,102,241,0.08)] hover:shadow-[4px_4px_0px_#6366f1] group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="text-[8px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/25">
                            USER ACCOUNTS
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-base text-indigo-700 dark:text-indigo-400">Secure Cloud Synchronizer</h3>
                          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                            Sign in with Google to enable permanent multi-device history, active support bot triage lines, and personalized visual themes saved to Firestore.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 text-[9px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 italic flex items-center gap-1.5 border-t border-indigo-500/10 pt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                        <span>Google Sign-In ready in top-right corner</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Bento Cards Grid */}
                <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                  {/* Card 1 */}
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-outline p-6 rounded-none relative overflow-hidden group hover:border-primary transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-background border border-outline flex items-center justify-center text-secondary">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-on-surface-variant font-semibold">PLATE 104</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-on-surface mb-2">Pristine Audio</h3>
                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                      Extract lossless audio streams directly from raw CDN storage container blocks without transcoding.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-outline p-6 rounded-none relative overflow-hidden group hover:border-primary transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-background border border-outline flex items-center justify-center text-secondary">
                        <Tv className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-on-surface-variant font-semibold">PLATE 105</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-on-surface mb-2">1080p Frame Scale</h3>
                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                      Capture high bitrate video up to 1080p, preserving fine textural grain, frame timing, and reference keyframes.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-outline p-6 rounded-none relative overflow-hidden group hover:border-primary transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-background border border-outline flex items-center justify-center text-secondary">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-on-surface-variant font-semibold">PLATE 106</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-on-surface mb-2">Monastic Efficiency</h3>
                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                      Bypassing protocol overhead. Highly concurrent pipeline delivers immediate stream packet downloads.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-outline p-6 rounded-none relative overflow-hidden group hover:border-primary transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-background border border-outline flex items-center justify-center text-secondary">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-on-surface-variant font-semibold">PLATE 107</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-on-surface mb-2">Pristine Isolation</h3>
                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                      No trace cookies. Your extraction session lives entirely in ephemeral memory and is wiped clean upon completion.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeSegment === "history" ? (
              <div className="w-full max-w-4xl flex flex-col gap-6">
                {/* History Header & Utilities */}
                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-semibold text-lg text-on-surface">Archived Preservations</h3>
                    <p className="text-[10px] font-mono text-on-surface-variant">Trace logs of previously run extraction cycles</p>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold tracking-wider uppercase border border-rose-300/45 transition-all cursor-pointer rounded-none"
                    >
                      CLEAR ALL HISTORY
                    </button>
                  )}
                </div>

                {/* History Items List */}
                {history.length === 0 ? (
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-dashed border-primary/30 p-12 text-center rounded-none space-y-4">
                    <div className="flex justify-center">
                      <History className="w-10 h-10 text-on-surface-variant/30 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-semibold text-sm text-on-surface">No Trace Logs Available</h4>
                      <p className="text-xs text-on-surface-variant font-mono max-w-sm mx-auto leading-normal">
                        No extraction history detected. Return to CAPTURE STREAM to execute your first capture.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleLoadHistoryItem(item)}
                        className="bg-[#e4eaf0] dark:bg-surface-container border border-primary p-4 shadow-[4px_4px_0px_#1b222c] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)] flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-[6px_6px_0px_#1b222c] hover:bg-surface-container-high transition-all cursor-pointer rounded-none group"
                      >
                        <div className="flex items-center gap-4 w-full md:w-3/4">
                          <div className="w-20 h-12 bg-neutral-900 border border-primary overflow-hidden relative flex-shrink-0">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover filter grayscale contrast-115 group-hover:grayscale-0 transition-all"
                            />
                            <div className="absolute bottom-1 right-1 bg-neutral-900 text-[8px] font-mono text-white px-1 border border-neutral-700">
                              {item.duration}
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0 flex-grow">
                            <h4 className="font-serif font-semibold text-sm text-primary line-clamp-1 group-hover:text-secondary transition-all">
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
                              <span className="font-bold">{item.channel}</span>
                              <span>•</span>
                              <span>{item.views} PLAYS</span>
                              <span>•</span>
                              <span className="text-secondary">{item.timestamp}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenWebsite?.(item.url);
                              }}
                              className="text-[9px] font-mono text-on-surface-variant/60 hover:text-secondary hover:underline transition-all truncate block max-w-xl text-left cursor-pointer flex items-center gap-0.5"
                              title="Open website with animation sandbox"
                            >
                              <Link2 className="w-2.5 h-2.5 shrink-0" />
                              <span>{item.url}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleLoadHistoryItem(item)}
                            className="px-4 py-2 bg-primary text-on-primary font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-secondary cursor-pointer transition-all rounded-none"
                          >
                            RESTORE RECORD
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                            className="p-2 border border-primary/20 text-rose-800 hover:text-rose-950 hover:bg-rose-100 transition-all cursor-pointer rounded-none"
                            title="Delete trace log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <AiCreativeLab onTriggerAlert={onTriggerAlert} user={user} authLoading={authLoading} />
              </div>
            )}
          </motion.div>
        )}

        {status === "parsing" && (
          <motion.div
            key="parsing-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl flex flex-col items-center justify-center py-24 space-y-6 mx-auto"
          >
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-secondary animate-spin" />
              <Download className="absolute text-secondary w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="font-serif font-normal text-2xl text-on-surface">Decrypting Stream Package...</h2>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-sans font-bold">Connecting Secure Mirror Nodes</p>
            </div>
          </motion.div>
        )}

        {(status === "results" || status === "downloading" || status === "complete") && (
          <motion.div
            key="results-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl flex flex-col gap-8 mx-auto"
          >
            {/* Reset Button */}
            <div className="flex justify-start">
              <button 
                onClick={handleReset}
                className="px-5 py-2.5 text-[10px] tracking-[0.15em] font-bold uppercase rounded-none border border-primary text-on-surface hover:bg-surface-container transition-all cursor-pointer font-sans"
              >
                ← EXTRACT ANOTHER RECORD
              </button>
            </div>

            {/* Video Info Panel Card */}
            <div className="bg-[#e4eaf0] dark:bg-surface-container rounded-none p-6 flex flex-col md:flex-row gap-8 items-stretch border border-primary">
              <div className="w-full md:w-1/3 aspect-video rounded-none overflow-hidden relative border border-primary bg-background flex-shrink-0">
                <img 
                  alt={extractedData.title} 
                  src={extractedData.thumbnailUrl}
                  className="w-full h-full object-cover filter grayscale contrast-110"
                />
                <div className="absolute bottom-2 right-2 bg-background px-2 py-0.5 rounded-none text-[10px] font-mono text-on-surface border border-primary">
                  {extractedData.duration}
                </div>
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-secondary text-[10px] font-sans font-bold tracking-wider uppercase">
                    <PlayCircle className="w-4 h-4 text-secondary" />
                    <span>RECORD MATCHED</span>
                  </div>
                  <h2 className="font-serif font-normal text-2xl md:text-3xl text-primary leading-tight">
                    {extractedData.title}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono text-on-surface-variant uppercase tracking-wider">
                    <span>Source: {extractedData.channel} • {extractedData.views} Plays</span>
                    <span className="hidden sm:inline">•</span>
                    <button
                      type="button"
                      onClick={() => onOpenWebsite?.(url)}
                      className="text-secondary hover:text-primary hover:underline transition-all truncate max-w-sm text-left cursor-pointer flex items-center gap-1 font-bold lowercase"
                      title="Open website with animation sandbox"
                    >
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span>{url}</span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">
                    4K MASTER
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/25 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">
                    FLAC AUDIO
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Stream Simulator Loaded with the exact user URL result */}
            {extractionMode !== "post" && (
              <VideoPreviewSimulator 
                url={url}
                title={extractedData.title}
                thumbnailUrl={extractedData.thumbnailUrl}
                channel={extractedData.channel}
                views={extractedData.views}
                duration={extractedData.duration}
                videoFilter={videoFilter}
                aspectRatio={aspectRatio}
                watermarkText={watermarkText}
                aiPhotoEffect={aiPhotoEffect}
              />
            )}

            {/* Dynamic Preservative Workspace Editors */}
            {status === "results" && extractionMode !== "post" && (
              <MediaWorkspace 
                url={url}
                title={extractedData.title}
                thumbnailUrl={extractedData.thumbnailUrl}
                channel={extractedData.channel}
                duration={extractedData.duration}
                onFilterChange={setVideoFilter}
                onCropChange={setAspectRatio}
                onWatermarkChange={setWatermarkText}
                onAiPhotoEffectChange={setAiPhotoEffect}
                videoFormat={videoFormat}
                photoFormat={photoFormat}
                extractionMode={extractionMode}
              />
            )}

            {/* Download Options Block */}
            {status === "results" && (
              <div className={`grid grid-cols-1 ${
                extractionMode === "media" 
                  ? "md:grid-cols-2" 
                  : "max-w-2xl mx-auto w-full"
              } gap-6`}>
                {/* Video Checkbox Panel */}
                {extractionMode === "media" && (
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-primary rounded-none p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-3">
                        <FileVideo className="text-secondary w-4 h-4" />
                        <h3 className="font-serif font-semibold text-base text-on-surface">Video Plate Options</h3>
                      </div>
                      <div className="space-y-2">
                        {extractedData.videoOptions.map((opt) => (
                          <label 
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-none border cursor-pointer transition-all ${
                              selectedVideo === opt.id 
                                ? "bg-background border-primary shadow-[2px_2px_0px_#1b222c]" 
                                : "border-transparent hover:bg-background/50 hover:border-outline-variant"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="video_opt"
                                checked={selectedVideo === opt.id}
                                onChange={() => setSelectedVideo(opt.id)}
                                className="w-4 h-4 text-primary accent-primary cursor-pointer rounded-none"
                              />
                              <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">{opt.label}</span>
                            </div>
                            <span className="text-xs font-mono text-on-surface-variant">{opt.size}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                        Target Export Format
                      </label>
                      <select
                        value={videoFormat}
                        onChange={(e) => setVideoFormat(e.target.value as "MP4" | "WEBM" | "MKV" | "MOV" | "MP3")}
                        className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer rounded-none"
                      >
                        <option value="MP4">MP4 Video Container (.mp4)</option>
                        <option value="MOV">MOV QuickTime Video (.mov)</option>
                        <option value="MP3">MP3 Audio Stream (.mp3)</option>
                        <option value="WEBM">WEBM Web Media (.webm)</option>
                        <option value="MKV">MKV Matroska Stream (.mkv)</option>
                      </select>
                    </div>

                    {/* High-Fidelity Custom Range Trim Interface */}
                    <div className="mt-4 pt-4 border-t border-primary/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block font-bold">
                          Video Segment Trimmer
                        </label>
                        <span className="text-[8px] font-mono bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-none font-bold">PRECISION</span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={enableTrim}
                          onChange={(e) => setEnableTrim(e.target.checked)}
                          className="w-4 h-4 accent-secondary cursor-pointer rounded-none"
                        />
                        <span className="text-xs font-mono text-on-surface uppercase font-bold tracking-wide">Enable Custom Range</span>
                      </label>

                      {enableTrim && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-3 pt-1 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono uppercase text-on-surface-variant block font-bold">Start Frame</label>
                              <input 
                                type="text" 
                                value={trimStart}
                                onChange={(e) => setTrimStart(e.target.value)}
                                placeholder="00:00"
                                className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-2.5 py-2 focus:border-primary focus:outline-none rounded-none text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono uppercase text-on-surface-variant block font-bold">End Frame</label>
                              <input 
                                type="text" 
                                value={trimEnd}
                                onChange={(e) => setTrimEnd(e.target.value)}
                                placeholder="02:30"
                                className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-2.5 py-2 focus:border-primary focus:outline-none rounded-none text-center"
                              />
                            </div>
                          </div>
                          <p className="text-[9px] font-mono text-on-surface-variant/70 uppercase leading-snug">
                            Format matches video timeline index (e.g. 01:15 or 12:45). Limits stream buffer prior to sealing.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Checkbox Panel */}
                {extractionMode === "media" && (
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-primary rounded-none p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-3">
                        <Music className="text-secondary w-4 h-4" />
                        <h3 className="font-serif font-semibold text-base text-on-surface">Audio Preservation</h3>
                      </div>
                      <div className="space-y-2">
                        {extractedData.audioOptions.map((opt) => (
                          <label 
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-none border cursor-pointer transition-all ${
                              selectedAudio === opt.id 
                                ? "bg-background border-secondary shadow-[2px_2px_0px_#4f5e7c]" 
                                : "border-transparent hover:bg-background/50 hover:border-outline-variant"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="audio_opt"
                                checked={selectedAudio === opt.id}
                                onChange={() => setSelectedAudio(opt.id)}
                                className="w-4 h-4 text-secondary accent-secondary cursor-pointer"
                              />
                              <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">{opt.label}</span>
                            </div>
                            <span className="text-xs font-mono text-on-surface-variant">{opt.size}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                        Codec Bitrate Format
                      </label>
                      <select
                        value={selectedAudio}
                        onChange={(e) => setSelectedAudio(e.target.value)}
                        className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer rounded-none"
                      >
                        <option value="320kbps">MP3 Format - 320kbps Lossy</option>
                        <option value="256kbps">AAC Format - 256kbps Studio</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Photo Downloader Panel */}
                {extractionMode === "photo" && (
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-primary rounded-none p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-3">
                        <FileImage className="text-secondary w-4 h-4" />
                        <h3 className="font-serif font-semibold text-base text-on-surface">Photo Downloader</h3>
                      </div>
                      <p className="text-xs font-mono text-on-surface-variant mb-4 leading-normal">
                        Extract high-definition video cover arts, profiles, or static graphics instantly from URL source targets with custom premium resolution scaling.
                      </p>
                      
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                            Target Export Format
                          </label>
                          <select
                            value={photoFormat}
                            onChange={(e) => setPhotoFormat(e.target.value as "PNG" | "WEBP" | "JPEG")}
                            className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer rounded-none"
                          >
                            <option value="JPEG">JPEG Image Standard (.jpg)</option>
                            <option value="PNG">PNG Lossless Transparency (.png)</option>
                            <option value="WEBP">WEBP Modern Compress (.webp)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                            Premium Scale & Quality
                          </label>
                          <select
                            value={photoResolution}
                            onChange={(e) => setPhotoResolution(e.target.value as "4K" | "2K" | "1080P" | "720P")}
                            className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer rounded-none"
                          >
                            <option value="4K">4K Ultra HD (3840 x 2160) [AI Master]</option>
                            <option value="2K">2K Quad HD (2560 x 1440) [Premium]</option>
                            <option value="1080P">Full HD (1920 x 1080) [High Res]</option>
                            <option value="720P">Standard HD (1280 x 720) [Standard]</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => downloadPhotoAsFormat(extractedData.thumbnailUrl, extractedData.title, photoFormat, photoResolution)}
                        className="w-full py-3 bg-secondary hover:bg-primary text-white hover:text-on-primary font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer text-center rounded-none shadow-[2px_2px_0px_#1b222c] flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD {photoResolution} PHOTO ({photoFormat})</span>
                      </button>
                      <span className="text-[9px] font-mono text-on-surface-variant/70 text-center block">
                        {photoFormat === "JPEG" ? "JPEG Format" : photoFormat === "PNG" ? "PNG Format" : "WEBP Format"} • {photoResolution === "4K" ? "3840x2160" : photoResolution === "2K" ? "2560x1440" : photoResolution === "1080P" ? "1920x1080" : "1280x720"} Grid Native • 100% Free
                      </span>
                    </div>
                  </div>
                )}

                {/* Post Narrative Downloader Panel */}
                {extractionMode === "post" && (
                  <div className="bg-[#e4eaf0] dark:bg-surface-container border border-primary rounded-none p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-3">
                        <FileText className="text-secondary w-4 h-4" />
                        <h3 className="font-serif font-semibold text-base text-on-surface">Post Narrative</h3>
                      </div>
                      <p className="text-xs font-mono text-on-surface-variant mb-4 leading-normal">
                        Export full post narrative text, AI transcript summaries, hashtags, and engagement logs to universally compatible documents.
                      </p>

                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                            Document Export Format
                          </label>
                          <select
                            value={postFormat}
                            onChange={(e) => setPostFormat(e.target.value as "PDF" | "TXT" | "JSON")}
                            className="w-full bg-background text-on-surface border border-outline-variant font-mono text-xs px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer rounded-none"
                          >
                            <option value="PDF">Universal PDF Document (.pdf)</option>
                            <option value="TXT">Plain Text Clean Transcript (.txt)</option>
                            <option value="JSON">Structured JSON Metadata (.json)</option>
                          </select>
                        </div>

                        {extractedData.postContent && (
                          <div>
                            <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold flex justify-between">
                              <span>Live Content Preview</span>
                              <span className="text-[9px] text-[#2c3e50]/60 normal-case">(Editable)</span>
                            </label>
                            <textarea
                              value={extractedData.postContent}
                              onChange={(e) => setExtractedData(prev => ({ ...prev, postContent: e.target.value }))}
                              className="w-full h-24 bg-background border border-outline-variant rounded-none p-2 font-mono text-[9px] leading-normal text-on-surface focus:outline-none focus:border-primary resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => downloadPostNarrative(extractedData.title, extractedData.postContent || "", postFormat)}
                        className="w-full py-3 bg-secondary hover:bg-primary text-white hover:text-on-primary font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer text-center rounded-none shadow-[2px_2px_0px_#1b222c] flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD {postFormat} DOCUMENT</span>
                      </button>
                      <span className="text-[9px] font-mono text-on-surface-variant/70 text-center block">
                        Cross-Platform Compatible • No Watermarks • {postFormat === "PDF" ? "ISO standard layout" : postFormat === "TXT" ? "Universal Text" : "Standard Metadata Object"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Operating System Compatibility & Native Preset Selector */}
            {status === "results" && extractionMode === "media" && (
              <div className="bg-[#e4eaf0] dark:bg-surface-container border border-primary p-6 mt-6 shadow-[4px_4px_0px_rgba(26,26,26,0.15)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.05)] text-left">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-primary/20 pb-4 mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-primary uppercase tracking-tight flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-secondary" />
                      Operating System Compatibility Engine
                    </h3>
                    <p className="text-xs font-mono text-on-surface-variant/80 mt-1 uppercase">
                      Select your target device to automatically optimize the video/audio container formatting
                    </p>
                  </div>
                  
                  {/* OS Tabs */}
                  <div className="flex flex-wrap gap-2 bg-background/50 p-1 border border-outline-variant rounded-none shrink-0 self-start xl:self-auto">
                    {(["android", "ios", "windows"] as const).map((os) => (
                      <button
                        key={os}
                        type="button"
                        onClick={() => {
                          setSelectedOS(os);
                          // Auto-select the best format based on target OS
                          if (os === "android") {
                            setVideoFormat("MP4");
                          } else if (os === "ios") {
                            setVideoFormat("MOV");
                          } else {
                            setVideoFormat("MP4");
                          }
                        }}
                        className={`px-4 py-2 text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-none flex items-center gap-1.5 ${
                          selectedOS === os
                            ? "bg-primary text-on-primary shadow-[2px_2px_0px_rgba(26,26,26,0.15)]"
                            : "text-on-surface/70 hover:bg-background"
                        }`}
                      >
                        {os === "ios" && <Laptop className="w-3.5 h-3.5" />}
                        {os === "android" && <Smartphone className="w-3.5 h-3.5" />}
                        {os === "windows" && <Monitor className="w-3.5 h-3.5" />}
                        <span>{os === "ios" ? "Apple iOS / Mac" : os === "android" ? "Google Android" : "Microsoft Windows"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected OS Compatibility Report */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-background p-4 border border-outline-variant">
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span>
                        Optimization Report: {selectedOS === "ios" ? "Apple Ecosystem (iOS, iPadOS, macOS)" : selectedOS === "android" ? "Android Mobile Platform" : "Microsoft Windows & PC Players"}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {selectedOS === "ios" && (
                        "Apple devices natively support MOV (QuickTime) and MP4 formats. For direct integration with your Photos Library, Files app, or QuickTime player on iPhone/iPad/Mac, the MOV video container is highly recommended. High-fidelity audio streams are fully supportable via MP3."
                      )}
                      {selectedOS === "android" && (
                        "Google Android (including Samsung, Google Pixel, OnePlus, etc.) natively runs MP4 video containers with maximum performance. Video download will be optimized with standard H.264 video streams and AAC audio channels. High-fidelity audio extraction utilizes the universal MP3 stream format."
                      )}
                      {selectedOS === "windows" && (
                        "Microsoft Windows PCs support all containers out of the box. For instant playback within Windows Media Player, Movies & TV app, or PowerPoint presentations without external codecs, standard MP4 is recommended. Advanced media enthusiasts can also utilize MOV or lossless MP3."
                      )}
                    </p>
                  </div>

                  <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-outline-variant/60 pt-4 md:pt-0 md:pl-4 flex flex-col justify-center space-y-2.5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                      Optimized Selection
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-secondary/15 text-secondary border border-secondary/30 font-mono text-[10px] font-bold uppercase rounded-none">
                        Video: {selectedOS === "ios" ? "MOV (Native QuickTime)" : "MP4 (H.264 Universal)"}
                      </span>
                      <span className="px-2.5 py-1 bg-secondary/15 text-secondary border border-secondary/30 font-mono text-[10px] font-bold uppercase rounded-none">
                        Audio: MP3 (Standard Audio)
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-on-surface-variant/70 uppercase">
                      Selecting this OS automatically adjusts the download package structure.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action State: Idle Results vs Downloading Progress vs Completed Success */}
            {status === "results" && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 bg-[#e4eaf0] dark:bg-surface-container p-4 border border-primary">
                {/* Auto-copy toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none group w-full sm:w-auto">
                  <div className="relative">
                    <input 
                      type="checkbox"
                      checked={autoCopy}
                      onChange={(e) => setAutoCopy(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 transition-all duration-200 border-2 border-primary ${autoCopy ? 'bg-secondary' : 'bg-background'}`}>
                      <div className={`w-3.5 h-3.5 bg-primary absolute top-[3px] transition-all duration-200 ${autoCopy ? 'left-[19px] bg-background' : 'left-[3px]'}`} />
                    </div>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans font-bold uppercase tracking-wider text-primary group-hover:text-secondary transition-all">
                      Auto-Copy Asset Link
                    </span>
                    <p className="text-[10px] font-mono text-on-surface-variant/80 uppercase">
                      Copies direct download URL automatically on seal
                    </p>
                  </div>
                </label>

                {/* Main Download Button */}
                <button 
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-primary hover:bg-secondary text-on-primary py-3.5 px-8 rounded-none font-bold text-[11px] tracking-[0.18em] uppercase cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#c5c0b5]"
                >
                  <Download className="w-4 h-4" />
                  <span>PRESERVE SELECTED PACKAGE</span>
                </button>
              </div>
            )}

            {status === "downloading" && (
              <ExtractionProgressBar
                progress={downloadProgress}
                videoFormat={videoFormat}
                selectedVideo={selectedVideo}
                selectedAudio={selectedAudio}
                videoFilter={videoFilter}
                aspectRatio={aspectRatio}
                watermarkText={watermarkText}
                title={extractedData?.title || "Target URL Stream Source"}
                enableTrim={enableTrim}
                trimStart={trimStart}
                trimEnd={trimEnd}
              />
            )}

            {status === "complete" && (
              <div className="bg-[#e1eae2] border border-[#4f5e7c]/40 p-8 rounded-none space-y-6 text-center shadow-[4px_4px_0px_#4f5e7c] transition-all duration-300">
                <div className="flex justify-center mb-1">
                  <CheckCircle2 className="w-12 h-12 text-tertiary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-normal text-2xl text-on-surface">Extraction Packaged Successfully</h3>
                  <p className="text-xs font-mono text-[#4f5e7c] uppercase tracking-wider">
                    Digital asset scales completed. Byte stream transferred to client storage.
                  </p>
                </div>

                {/* Generated Link Panel */}
                <div className="max-w-xl mx-auto bg-background/55 border border-[#4f5e7c]/25 p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#4f5e7c]">
                    <span>Generated Asset Link</span>
                    {copiedLink ? (
                      <span className="text-tertiary flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        AUTO-COPIED TO CLIPBOARD
                      </span>
                    ) : (
                      <span className="text-on-surface-variant/70">READY TO SHARE</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://extractile.app/download/extractile-${extractedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${videoFormat.toLowerCase()}`}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-background border border-outline-variant font-mono text-xs px-3 py-2.5 focus:outline-none select-all text-on-surface text-left rounded-none"
                    />
                    <button
                      onClick={() => {
                        const link = `https://extractile.app/download/extractile-${extractedData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${videoFormat.toLowerCase()}`;
                        navigator.clipboard.writeText(link)
                          .then(() => {
                            setCopiedLink(true);
                            onTriggerAlert?.("Copied to Clipboard", "The link to your extracted asset has been copied to your clipboard.");
                          })
                          .catch(err => {
                            console.error("Manual copy failed:", err);
                          });
                      }}
                      className="px-4 py-2.5 bg-primary hover:bg-secondary text-on-primary font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 rounded-none shadow-[2px_2px_0px_#1b222c]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY LINK</span>
                    </button>
                  </div>
                </div>

                {/* OS Native Compatibility Playback Instructions */}
                <div className="max-w-xl mx-auto bg-[#f4f1ea] border border-[#4f5e7c]/25 p-4 text-left space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4f5e7c]">
                    <Info className="w-3.5 h-3.5 text-secondary" />
                    <span>OS Playback & Compatibility Guide</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 bg-background border border-[#4f5e7c]/10 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wide text-primary">
                        <Smartphone className="w-3 h-3 text-secondary" />
                        <span>Google Android</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        MP4/MP3 are 100% native. Locate the file in your system <b>Downloads</b> directory. Open via Files, VLC, or Photos app.
                      </p>
                    </div>
                    
                    <div className="p-2.5 bg-background border border-[#4f5e7c]/10 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wide text-primary">
                        <Laptop className="w-3 h-3 text-secondary" />
                        <span>Apple iOS / Mac</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        MOV/MP4 are fully supported. Save to the <b>Files</b> app. Double-tap to play or export directly to your Camera Roll.
                      </p>
                    </div>
                    
                    <div className="p-2.5 bg-background border border-[#4f5e7c]/10 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wide text-primary">
                        <Monitor className="w-3 h-3 text-secondary" />
                        <span>Microsoft Win</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-normal">
                        Natively plays MP4/MOV/MP3 in <b>Windows Media Player</b> or <b>Movies & TV</b> instantly. No special codecs required.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 bg-tertiary text-on-tertiary font-bold text-[10px] tracking-[0.15em] uppercase rounded-none cursor-pointer active:scale-95 transition-all"
                  >
                    EXTRACT NEXT PROTOCOL
                  </button>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 border border-outline text-primary font-bold text-[10px] tracking-[0.15em] uppercase rounded-none hover:bg-background transition-all"
                  >
                    RETURN TO JOURNAL
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <UniversalExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={exportModalData.title}
        filename={exportModalData.filename}
        mimeType={exportModalData.mimeType}
        content={exportModalData.content}
        imageUrl={exportModalData.imageUrl}
        type={exportModalData.type}
        onTriggerAlert={onTriggerAlert || ((title, msg) => alert(`${title}: ${msg}`))}
      />
    </div>
  );
}
