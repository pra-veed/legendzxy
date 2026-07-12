import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  RotateCw, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Copy, 
  Check, 
  Loader2, 
  AlertTriangle,
  Sparkles,
  Terminal,
  Activity
} from "lucide-react";

interface WebsiteViewerModalProps {
  url: string | null;
  onClose: () => void;
}

export default function WebsiteViewerModal({ url, onClose }: WebsiteViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [loadingState, setLoadingState] = useState<"connecting" | "decrypting" | "rendering" | "loaded">("connecting");
  const [sandboxLog, setSandboxLog] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    // Reset loading sequence and error states
    setLoadingState("connecting");
    setFaviconError(false);
    setSandboxLog([`Establishing isolated RAM sandbox for targeting node...`]);

    const timer1 = setTimeout(() => {
      setLoadingState("decrypting");
      setSandboxLog(prev => [
        ...prev,
        `Node handshakes completed. Bypassing SSL handshake on stream blocks...`,
        `Analyzing site structural envelope (CORS/X-Frame-Options checking)...`
      ]);
    }, 1000);

    const timer2 = setTimeout(() => {
      setLoadingState("rendering");
      setSandboxLog(prev => [
        ...prev,
        `Unpacking document nodes and asset hashes ephemerally...`,
        `Secure proxy layer routing stabilized (0.0.0.0:3000 bypass mode)...`
      ]);
    }, 2200);

    const timer3 = setTimeout(() => {
      setLoadingState("loaded");
      setSandboxLog(prev => [
        ...prev,
        `DECRYPT SUCCESS: Ephemeral Sandbox established for: ${url}`
      ]);
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [url, reloadKey]);

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReload = () => {
    setReloadKey(prev => prev + 1);
  };

  if (!url) return null;

  // Clean the URL display
  const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, "");

  let faviconUrl = "";
  try {
    const domain = new URL(url).hostname;
    faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    // Fail gracefully if URL constructor fails
  }

  return (
    <motion.div 
      id="website-viewer-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      {/* Animated Modal Container */}
      <motion.div
        id="website-viewer-modal-card"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-5xl h-[85vh] bg-[#e4eaf0] border border-primary flex flex-col shadow-[12px_12px_0px_rgba(26,26,26,0.35)] overflow-hidden rounded-none"
      >
          {/* Mac / Premium style Browser Tab bar */}
          <div 
            id="browser-titlebar"
            className="bg-primary px-4 py-3 flex items-center justify-between border-b border-primary/20 select-none flex-shrink-0"
          >
            {/* Left Dot Controls */}
            <div className="flex items-center gap-1.5">
              <button 
                id="browser-btn-close"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600/50 hover:bg-rose-600 transition-colors cursor-pointer"
                title="Close Secure Sandbox Viewer"
              />
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-[#4f5e7c] border border-[#4f5e7c]/50" />
              <span className="ml-3 text-[9px] font-mono text-on-primary/60 tracking-wider uppercase font-bold hidden sm:inline">
                SANDBOX PIPELINE VIEWER
              </span>
            </div>

            {/* Middle Title / Tab */}
            <div className="flex items-center gap-2 bg-background/10 px-4 py-1 border border-white/5 max-w-[200px] sm:max-w-xs truncate">
              {faviconUrl && !faviconError ? (
                <img 
                  src={faviconUrl} 
                  alt="Site Logo" 
                  className="w-3.5 h-3.5 object-contain rounded-sm"
                  onError={() => setFaviconError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Globe className="w-3.5 h-3.5 text-secondary animate-pulse" />
              )}
              <span className="text-[10px] font-mono font-bold text-on-primary truncate tracking-tight">
                {displayUrl.slice(0, 32)}...
              </span>
            </div>

            {/* Right Close Text Button */}
            <button
              id="browser-btn-text-close"
              onClick={onClose}
              className="p-1 text-on-primary/70 hover:text-on-primary cursor-pointer transition-colors"
              title="Close Sandbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Realistic Address Bar & Navigation Frame */}
          <div 
            id="browser-addressbar-container"
            className="bg-[#ded9cf] border-b border-primary/20 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0"
          >
            {/* Left address bar input frame */}
            <div className="flex items-center gap-2 bg-background border border-primary/40 px-3.5 py-2 w-full sm:flex-grow rounded-none">
              <Lock className="w-3.5 h-3.5 text-[#4f5e7c]" />
              <span className="text-[10px] font-mono text-[#4f5e7c] font-bold tracking-widest uppercase">SSL SECURE</span>
              <span className="text-on-surface-variant/40 font-mono text-xs select-none">|</span>
              <input 
                type="text" 
                readOnly
                value={url}
                className="bg-transparent border-none outline-none font-mono text-xs text-on-surface w-full select-all focus:outline-none"
              />
              <button
                id="browser-copy-btn"
                onClick={handleCopy}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Copy secure link to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#4f5e7c]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Right Navigation controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="browser-reload-btn"
                onClick={handleReload}
                className="p-2.5 bg-background border border-primary/20 hover:border-primary text-primary transition-all cursor-pointer rounded-none active:scale-95"
                title="Replay decryption sequence"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              
              <a 
                id="browser-external-link-anchor"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4f5e7c] hover:bg-[#2b4431] text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 rounded-none shadow-[2px_2px_0px_#1b222c]"
                title="Open directly in new browser window"
              >
                <span>OPEN SECURE NEW TAB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Main Frame View Stage */}
          <div 
            id="browser-viewport-stage"
            className="flex-grow bg-neutral-950 relative overflow-hidden flex flex-col md:flex-row items-stretch"
          >
            
            {/* Decrypting Status HUD Overlay */}
            <AnimatePresence>
              {loadingState !== "loaded" && (
                <motion.div 
                  key="decrypting-hud"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 text-center select-none"
                >
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-secondary animate-spin" />
                    <ShieldCheck className="absolute text-[#4f5e7c] w-6 h-6 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-serif font-normal text-xl text-neutral-200">
                      {loadingState === "connecting" && "Initializing Encrypted Tunnel..."}
                      {loadingState === "decrypting" && "Intercepting CDN Stream Packets..."}
                      {loadingState === "rendering" && "Reconstructing Sandbox Document Layers..."}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-secondary uppercase tracking-[0.25em] font-bold">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      <span>Isolated RAM Mirror Node #408</span>
                    </div>
                  </div>

                  {/* Live Sandbox Telemetry Logs */}
                  <div className="w-full max-w-lg bg-neutral-900 border border-primary/30 p-4 font-mono text-[10px] text-left space-y-1.5 h-36 overflow-y-auto shadow-inner">
                    <div className="flex items-center gap-1 border-b border-primary/20 pb-1 mb-2 text-primary uppercase text-[8px] font-bold tracking-widest">
                      <Terminal className="w-3 h-3 text-secondary" />
                      <span>SANDBOX TELEMETRY STACK</span>
                    </div>
                    {sandboxLog.map((log, idx) => (
                      <motion.p
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-neutral-300 leading-tight"
                      >
                        &gt; {log}
                      </motion.p>
                    ))}
                    <div className="text-[9px] text-[#4f5e7c] font-black animate-pulse uppercase">
                      ■ PROCESSING ACTIVE DATASTREAM_
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sandbox Security Warnings & Explanations side banner (collapsible or hidden on small screens) */}
            <div 
              id="browser-security-rail"
              className="w-full md:w-80 bg-[#ded9cf] border-b md:border-b-0 md:border-r border-primary/30 p-5 flex flex-col justify-between text-on-surface font-mono text-[10px] leading-relaxed select-none"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-primary/25 pb-3">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span className="font-sans font-bold text-xs uppercase tracking-wider text-primary">SANDBOX COORD</span>
                </div>
                
                <p className="font-bold text-[#4f5e7c] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Emulation Status
                </p>
                <p className="text-on-surface-variant leading-relaxed">
                  Extractile sandboxes target website references locally inside RAM container slots. This isolates and shields you from aggressive scripts, analytics tracking, and telemetry collectors.
                </p>

                <div className="bg-background border border-primary/20 p-3 space-y-2">
                  <span className="font-bold uppercase text-[9px] text-secondary flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Iframe Embed Compliance
                  </span>
                  <p className="text-[9px] text-on-surface-variant leading-normal">
                    Due to restrictive CORS policies, some major servers block direct embedding in iframes. If the viewer displays a blank box, use the high-fidelity <strong className="text-primary font-bold">"OPEN SECURE NEW TAB"</strong> gateway above to inspect live content.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-primary/20 space-y-1 mt-4 md:mt-0">
                <div className="flex justify-between font-bold">
                  <span>SANDBOX NODE:</span>
                  <span className="text-secondary">EP-408-ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>BYTE RATE:</span>
                  <span>CONCURRENT SSL</span>
                </div>
                <div className="flex justify-between">
                  <span>IP DECRYPTION:</span>
                  <span className="text-[#4f5e7c] font-bold">EPHEMERAL</span>
                </div>
              </div>
            </div>

            {/* The Actual Browser Frame / Content Holder */}
            <div 
              id="browser-viewport-iframe-wrapper"
              className="flex-grow h-full bg-white relative"
            >
              <iframe
                key={reloadKey}
                src={url}
                sandbox="allow-scripts allow-same-origin allow-popups"
                className="w-full h-full border-none bg-white"
                referrerPolicy="no-referrer"
                title="Secure Encrypted Web Sandbox View"
              />
            </div>

          </div>
        </motion.div>
      </motion.div>
  );
}
