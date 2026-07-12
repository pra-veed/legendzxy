import React, { useState, useEffect } from "react";
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Smartphone, 
  Laptop, 
  Info, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Sparkles, 
  ArrowRight,
  Monitor,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface UniversalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  mimeType: string;
  content: string; // The file content (for text/json/markdown) or URL (for video/photo)
  imageUrl?: string; // Optional image URL for preview/saving
  type: "video" | "photo" | "post" | "ai_lab";
  onTriggerAlert?: (title: string, message: string) => void;
}

export default function UniversalExportModal({
  isOpen,
  onClose,
  title,
  filename,
  mimeType,
  content,
  imageUrl,
  type,
  onTriggerAlert
}: UniversalExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [detectedOS, setDetectedOS] = useState<"iOS" | "Android" | "Desktop">("Desktop");
  const [activeInstructionTab, setActiveInstructionTab] = useState<"iOS" | "Android" | "Desktop">("Desktop");

  // Detect OS and Share capabilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      
      const os = isIOS ? "iOS" : isAndroid ? "Android" : "Desktop";
      setDetectedOS(os);
      setActiveInstructionTab(os);

      // Check if native sharing is supported for text/files
      if (navigator.share) {
        setShareSupported(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle traditional browser download
  const handleDownload = () => {
    try {
      let urlBlob = "";
      if (type === "photo" && imageUrl) {
        // For photos, if we have imageUrl we can download it
        urlBlob = imageUrl;
      } else {
        const blob = new Blob([content], { type: mimeType });
        urlBlob = URL.createObjectURL(blob);
      }

      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      
      // On some mobile browsers, target="_blank" is required for blob downloads
      if (detectedOS !== "Desktop") {
        link.target = "_blank";
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (type !== "photo" && !imageUrl) {
        URL.revokeObjectURL(urlBlob);
      }

      onTriggerAlert?.("Export Started", `Successfully requested download for ${filename}.`);
    } catch (err) {
      console.error("Standard download failed:", err);
      // Fallback
      window.open(imageUrl || content, "_blank");
    }
  };

  // Copy content to clipboard
  const handleCopy = () => {
    try {
      const textToCopy = type === "photo" ? imageUrl || content : content;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onTriggerAlert?.("Copied to Clipboard", "Content successfully copied to clipboard.");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Trigger Native Share (Highly responsive and perfect for modern mobile devices)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      onTriggerAlert?.("Share Unsupported", "Native sharing is not supported by this browser.");
      return;
    }

    try {
      // Build share parameters
      const shareData: ShareData = {
        title: `Extractile Export: ${title}`,
        text: `Check out this exported asset from Extractile: ${filename}`
      };

      // If it's text-based content, we can either share the text directly or compile as file
      if (type !== "photo" && type !== "video" && content.length < 5000) {
        shareData.text = content;
      } else {
        // Try to share as a virtual File object (Supported in Safari iOS & Chrome Android on HTTPS)
        try {
          const blob = new Blob([content], { type: mimeType });
          const file = new File([blob], filename, { type: mimeType });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          } else {
            // Fallback to sharing URL or text summary
            shareData.url = window.location.href;
          }
        } catch (fileErr) {
          console.warn("Could not attach file to native share, falling back:", fileErr);
        }
      }

      await navigator.share(shareData);
      onTriggerAlert?.("Shared Successfully", "Native sharing panel closed.");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Native share failed:", err);
        // Fallback to opening in new window
        window.open(imageUrl || content, "_blank");
      }
    }
  };

  // Open in a new tab (Essential backup for iOS Safari)
  const handleOpenNewTab = () => {
    try {
      if (type === "photo" && imageUrl) {
        window.open(imageUrl, "_blank");
      } else {
        const blob = new Blob([content], { type: mimeType });
        const urlBlob = URL.createObjectURL(blob);
        window.open(urlBlob, "_blank");
      }
    } catch (err) {
      console.error("Open in new tab failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        id="universal-export-modal"
        className="w-full max-w-2xl bg-surface border-2 border-primary text-primary shadow-[6px_6px_0px_#1b222c] overflow-hidden flex flex-col max-h-[90vh] rounded-none animate-scale-up"
      >
        {/* Modal Header */}
        <div className="p-4 bg-primary text-on-primary flex justify-between items-center border-b-2 border-primary">
          <div className="flex items-center gap-2">
            {type === "video" && <Video className="w-5 h-5 text-secondary" />}
            {type === "photo" && <ImageIcon className="w-5 h-5 text-secondary" />}
            {type === "post" && <FileText className="w-5 h-5 text-secondary" />}
            {type === "ai_lab" && <Sparkles className="w-5 h-5 text-secondary" />}
            <span className="font-display font-extrabold text-sm uppercase tracking-wider">
              Cross-OS Export Portal
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-secondary hover:text-primary transition-colors cursor-pointer text-on-primary"
            title="Close Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container with Independent scroll for small mobile screens */}
        <div className="p-5 overflow-y-auto flex-grow flex flex-col gap-5">
          {/* Main Info */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display font-black text-lg uppercase leading-tight tracking-tight text-primary">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-on-surface-variant">
              <span className="bg-primary/5 px-2 py-0.5 border border-primary/10">Filename: <span className="text-secondary font-bold">{filename}</span></span>
              <span className="bg-primary/5 px-2 py-0.5 border border-primary/10">Mime-Type: <span className="text-primary/80 font-bold">{mimeType}</span></span>
            </div>
          </div>

          {/* Visual Preview Section */}
          <div className="border border-outline/30 bg-surface-container-lowest p-4 flex flex-col gap-3 min-h-[140px] justify-center">
            <span className="text-[9px] font-mono uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Pipeline Artifact Preview
            </span>

            {type === "photo" && imageUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative border border-primary p-1 bg-white max-w-full md:max-w-md shadow-sm">
                  <img 
                    src={imageUrl} 
                    alt="Export preview" 
                    className="max-h-[220px] object-contain w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant text-center max-w-md">
                  <span className="font-bold text-secondary">Mobile Tip:</span> You can long-press the image preview above and select <b>"Save Image"</b> or <b>"Share"</b> directly on iOS and Android.
                </p>
              </div>
            ) : type === "video" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-[#1b222c]/5 p-3 border border-dashed border-primary/30">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/25 shrink-0">
                    <Video className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">Video Archival Container Ready</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">File ready for stream reconstructions. High performance format.</span>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  We package a high-fidelity diagnostic report (.txt) along with your video container file.
                </p>
              </div>
            ) : (
              <div className="relative">
                <pre className="text-[10px] font-mono bg-[#1b222c] text-[#a9b2c3] p-3 rounded-none overflow-x-auto max-h-[180px] border border-outline/25 leading-relaxed whitespace-pre-wrap select-all">
                  {content.length > 1200 ? `${content.substring(0, 1200)}\n\n... [Content truncated in preview. Full content will be exported] ...` : content}
                </pre>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button 
                    onClick={handleCopy}
                    className="p-1.5 bg-[#1b222c]/80 hover:bg-[#1b222c] text-[#a9b2c3] hover:text-white border border-[#a9b2c3]/20 transition-all rounded-sm cursor-pointer"
                    title="Copy Full Content"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Portal Buttons */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary/80">
              Select Export Route
            </h4>
            
            {/* Primary Multi-OS Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Native Mobile Share Button (Perfect for iOS/Android on Vercel HTTPS) */}
              {shareSupported ? (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-primary font-bold text-xs tracking-widest uppercase hover:bg-secondary/90 border-2 border-primary cursor-pointer transition-all shadow-[2px_2px_0px_#1b222c]"
                >
                  <Share2 className="w-4 h-4 text-primary" /> NATIVE MOBILE SHARE
                </button>
              ) : (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-primary font-bold text-xs tracking-widest uppercase hover:bg-secondary/90 border-2 border-primary cursor-pointer transition-all shadow-[2px_2px_0px_#1b222c]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" /> COPIED TO CLIPBOARD
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary" /> COPY RAW CONTENT
                    </>
                  )}
                </button>
              )}

              {/* Standard File Download Button */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-on-primary font-bold text-xs tracking-widest uppercase hover:bg-primary/95 border-2 border-primary cursor-pointer transition-all shadow-[2px_2px_0px_#1b222c]"
              >
                <Download className="w-4 h-4 text-secondary" /> DIRECT DOWNLOAD FILE
              </button>
            </div>

            {/* Secondary Action Link Buttons (Fallback for strict browser environments) */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-primary/5 p-3 border border-primary/10">
              <span className="text-[10px] font-sans text-on-surface-variant flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-secondary" /> Having trouble with downloading?
              </span>
              <div className="flex gap-2">
                {type !== "video" && (
                  <button 
                    onClick={handleCopy}
                    className="text-[9px] font-mono font-bold text-primary hover:underline uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Text
                  </button>
                )}
                <button 
                  onClick={handleOpenNewTab}
                  className="text-[9px] font-mono font-bold text-secondary hover:underline uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open in New Tab
                </button>
              </div>
            </div>
          </div>

          {/* OS-Specific Safe Instruction Center */}
          <div className="border border-outline/30 bg-surface shadow-sm">
            {/* Instruction Tabs Header */}
            <div className="flex border-b border-outline/30 bg-surface-container-low">
              <button
                onClick={() => setActiveInstructionTab("iOS")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-r border-outline/20 transition-all ${activeInstructionTab === "iOS" ? "bg-surface text-secondary border-b-2 border-b-secondary" : "text-primary/60 hover:text-primary"}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Apple iOS
              </button>
              <button
                onClick={() => setActiveInstructionTab("Android")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-r border-outline/20 transition-all ${activeInstructionTab === "Android" ? "bg-surface text-secondary border-b-2 border-b-secondary" : "text-primary/60 hover:text-primary"}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Google Android
              </button>
              <button
                onClick={() => setActiveInstructionTab("Desktop")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${activeInstructionTab === "Desktop" ? "bg-surface text-secondary border-b-2 border-b-secondary" : "text-primary/60 hover:text-primary"}`}
              >
                <Laptop className="w-3.5 h-3.5" /> Desktop / Laptop
              </button>
            </div>

            {/* Instruction Tab Content */}
            <div className="p-4 bg-surface text-[11px] leading-relaxed text-on-surface-variant">
              {activeInstructionTab === "iOS" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                    <span>To save to your files, click <b>NATIVE MOBILE SHARE</b> and select <b>"Save to Files"</b> 📤. This is the most secure method for Safari on iOS.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                    <span>Alternatively, click <b>"Open in New Tab"</b>. Once opened, tap Safari's native Share icon in the toolbar and choose <b>"Save to Files"</b> or <b>"Save Image"</b>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                    <span>For pictures, long-press the thumbnail preview above and tap <b>"Add to Photos"</b>.</span>
                  </div>
                </div>
              )}

              {activeInstructionTab === "Android" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                    <span>Click <b>DIRECT DOWNLOAD FILE</b>. Modern Android systems running Chrome will save the file immediately inside your <b>Downloads</b> folder.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                    <span>Alternatively, you can tap <b>NATIVE MOBILE SHARE</b> to directly send the document/media file to Google Drive, Keep, Gmail, or active messaging chats.</span>
                  </div>
                </div>
              )}

              {activeInstructionTab === "Desktop" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                    <span>Clicking <b>DIRECT DOWNLOAD FILE</b> triggers an immediate browser file-save stream. Supports Chrome, Safari, Edge, and Firefox.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                    <span>Under strict corporate or academic intranets, click <b>COPY RAW CONTENT</b> to save to clipboard or <b>Open in New Tab</b> to view natively.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline/25 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-600">
              Vercel Edge-Optimized Stream Protocol Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-1.5 bg-primary/10 hover:bg-primary hover:text-on-primary text-primary font-bold text-[10px] tracking-wider uppercase border border-primary transition-all cursor-pointer rounded-none"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
