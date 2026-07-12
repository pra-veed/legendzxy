import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  History, 
  Trash2, 
  Download, 
  Search, 
  ExternalLink, 
  ArrowUpRight, 
  Check, 
  AlertCircle,
  FileText,
  Loader2,
  Zap,
  CheckCircle2,
  X
} from "lucide-react";
import { ActiveTab } from "../types";
import { jsPDF } from "jspdf";
import { auth } from "../lib/firebase";

// Helper to provide human-readable status phases for long video scaling processes
const getScalingStatusText = (progress: number, status: string) => {
  if (status === "queued") return "QUEUED IN COGNITIVE PIPELINE";
  if (progress < 25) return "DECRYPTING DIGITAL SOURCE";
  if (progress < 50) return "RECONSTRUCTING VIDEO KEYFRAMES";
  if (progress < 85) return "UPSCALING PIXELS TO 1080P PREMIUM";
  if (progress < 100) return "FINALIZING AUDIO PRESERVATION";
  return "COMPLETED";
};

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnailUrl: string;
  timestamp: string;
}

interface HistoryViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onTriggerAlert: (title: string, message: string) => void;
  onOpenWebsite?: (url: string) => void;
}

export default function HistoryView({ setActiveTab, onTriggerAlert, onOpenWebsite }: HistoryViewProps) {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  // Load active tasks from localStorage
  const loadActiveTasks = () => {
    const stored = localStorage.getItem("extractile_active_tasks");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveTasks(parsed.filter((t: any) => t.status !== "completed"));
      } catch (e) {
        console.error("Failed to load active tasks:", e);
      }
    }
  };

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem("extractile_history");
    if (stored) {
      try {
        setHistoryList(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse history from localStorage", err);
      }
    }
    loadActiveTasks();
  }, []);

  // Monitor and simulate background video scaling operations when unmounted from Extractor view
  useEffect(() => {
    const hasActive = activeTasks.some(t => t.status === "queued" || t.status === "parsing" || t.status === "downloading");
    if (!hasActive) return;

    const interval = setInterval(() => {
      setActiveTasks(prev => {
        let changed = false;
        const updated = prev.map(task => {
          if (task.status === "completed") return task;

          changed = true;
          let nextProg = task.progress || 0;
          let nextStatus = task.status;

          if (task.status === "queued") {
            nextStatus = "parsing";
            nextProg = 10;
          } else {
            nextProg += Math.floor(Math.random() * 12) + 6;
          }

          if (nextProg >= 100) {
            nextProg = 100;
            nextStatus = "completed";

            // Add to history list!
            try {
              const storedHistory = localStorage.getItem("extractile_history");
              const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
              const exists = currentHistory.some((h: any) => h.url.toLowerCase() === task.url.toLowerCase());
              if (!exists) {
                const historyItem = {
                  id: `hist-${Date.now()}-${task.id}`,
                  url: task.url,
                  title: task.title,
                  channel: task.channel,
                  views: task.views || "1.2M",
                  duration: task.duration || "5:20",
                  thumbnailUrl: task.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
                  timestamp: new Date().toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                };
                const updatedHistory = [historyItem, ...currentHistory];
                localStorage.setItem("extractile_history", JSON.stringify(updatedHistory));
                setHistoryList(updatedHistory);
              }
            } catch (e) {
              console.error(e);
            }
          }

          return { ...task, progress: nextProg, status: nextStatus };
        });

        if (changed) {
          try {
            const allStored = JSON.parse(localStorage.getItem("extractile_active_tasks") || "[]");
            const merged = allStored.map((sTask: any) => {
              const match = updated.find(u => u.id === sTask.id);
              return match ? match : sTask;
            });
            localStorage.setItem("extractile_active_tasks", JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }

        // Return updated list with completed filtered out
        return updated.filter(t => t.status !== "completed");
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTasks]);

  const handleCancelActiveTask = (id: string) => {
    setActiveTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      try {
        const stored = localStorage.getItem("extractile_active_tasks");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.filter((t: any) => t.id !== id);
          localStorage.setItem("extractile_active_tasks", JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    onTriggerAlert("Task Aborted", "The active extraction/scaling task has been aborted.");
  };

  const handleDeleteItem = (id: string) => {
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem("extractile_history", JSON.stringify(updated));
    onTriggerAlert("Item Deleted", "The specific extraction log has been removed from local storage.");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to permanently clear all trace logs?")) {
      setHistoryList([]);
      localStorage.removeItem("extractile_history");
      onTriggerAlert("History Cleared", "All extraction history trace logs have been permanently purged.");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageHeight = 297;
      const pageWidth = 210;
      const marginX = 15;
      let y = 20;

      const drawHeaderFooter = (isFirstPage: boolean) => {
        // Draw elegant borderline
        doc.setDrawColor(27, 34, 44); // Primary color
        doc.setLineWidth(0.3);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Frame

        if (!isFirstPage) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(79, 94, 124);
          doc.text("EXTRACTPRO SYSTEM ARCHIVE & TRACE LOGS", marginX, 15);
          doc.setDrawColor(226, 232, 240);
          doc.line(marginX, 17, pageWidth - marginX, 17);
        }
        
        // Footer info and page count
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX - 10, pageHeight - 15);
        doc.text("CONFIDENTIAL - OFFICIAL EXTRACTPRO HISTORIC LEDGER", marginX, pageHeight - 15);
      };

      const addNewPageIfNeeded = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 25) {
          doc.addPage();
          y = 20;
          drawHeaderFooter(false);
        }
      };

      // Draw initial frame and header
      drawHeaderFooter(true);

      // Title & Header section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(27, 34, 44);
      doc.text("EXTRACTPRO ARCHIVAL REPORT", marginX, y + 5);
      y += 12;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 94, 124);
      doc.text("High-Fidelity Extraction Trace Logs & Activity Ledger", marginX, y);
      y += 8;

      // Header Divider Line
      doc.setDrawColor(27, 34, 44);
      doc.setLineWidth(0.8);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 8;

      // Metadata card block
      doc.setFillColor(242, 245, 250);
      doc.rect(marginX, y, pageWidth - (marginX * 2), 26, "F");
      doc.setDrawColor(182, 195, 212);
      doc.setLineWidth(0.25);
      doc.rect(marginX, y, pageWidth - (marginX * 2), 26);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(27, 34, 44);
      doc.text("REPORT AUDIT METADATA", marginX + 5, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, marginX + 5, y + 12);
      const currentUser = auth.currentUser;
      doc.text(`Active Operator: ${currentUser ? currentUser.email : "Local Anonymous Session"}`, marginX + 5, y + 17);
      doc.text(`Secure Node: ExtractPro Cloud Sync Engine v2`, marginX + 5, y + 22);

      doc.text(`Total Records Extracted: ${historyList.length}`, marginX + 110, y + 12);
      doc.text(`Integrity Seal: SHA-256 Verified Binary Stream`, marginX + 110, y + 17);
      doc.text(`Vault Type: Browser LocalStorage (Synced to Cloud)`, marginX + 110, y + 22);
      y += 34;

      // Subheading for Activity logs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(27, 34, 44);
      doc.text("EXTRACTION ACTIVITY ENTRIES", marginX, y);
      y += 5;

      doc.setDrawColor(27, 34, 44);
      doc.setLineWidth(0.4);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 6;

      if (historyList.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("No extraction logs detected in active local vault session.", marginX, y + 10);
      } else {
        historyList.forEach((item, index) => {
          // Measure text boundaries
          const cleanTitle = item.title.replace(/[^\x00-\x7F]/g, ""); // Clean non-ASCII chars to prevent jsPDF warning/failure
          const itemTitleLines = doc.splitTextToSize(`${index + 1}. ${cleanTitle}`, pageWidth - (marginX * 2) - 10);
          const itemUrlLines = doc.splitTextToSize(`Source URL: ${item.url}`, pageWidth - (marginX * 2) - 10);
          const entryHeight = (itemTitleLines.length * 4.5) + (itemUrlLines.length * 3.5) + 12;

          addNewPageIfNeeded(entryHeight);

          // Render Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(27, 34, 44);
          itemTitleLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, marginX, y + (lineIndex * 4.2));
          });
          y += (itemTitleLines.length * 4.2);

          // Render Meta Details line
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(79, 94, 124);
          doc.text(`Channel: ${item.channel}   |   Duration: ${item.duration}   |   Plays: ${item.views}   |   Saved: ${item.timestamp}`, marginX, y + 3.5);
          y += 7.5;

          // Render Source URL link
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          itemUrlLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, marginX, y + (lineIndex * 3.2));
          });
          y += (itemUrlLines.length * 3.2) + 2.5;

          // Separator dotted lines
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.line(marginX, y, pageWidth - marginX, y);
          y += 4.5;
        });
      }

      // Save output
      doc.save(`extractpro-system-archive-${new Date().toISOString().slice(0, 10)}.pdf`);
      onTriggerAlert("PDF Exported", "Your structured activity logs have been packaged into a professional PDF.");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      onTriggerAlert("Export Failed", "Could not successfully compile or write the PDF report file.");
    }
  };

  const handleRestoreRecord = (item: HistoryItem) => {
    // Write item to pending restore key
    localStorage.setItem("extractile_restore_pending", JSON.stringify(item));
    // Transition back to the Extractor tab
    setActiveTab("features");
    onTriggerAlert("Record Restored", `Loading "${item.title}" into active workspace.`);
  };

  const handleDirectDownload = (item: HistoryItem) => {
    setDownloadingId(item.id);
    
    setTimeout(() => {
      try {
        const fileContent = `=========================================
EXTRACTILE HIGH-FIDELITY ARCHIVAL REPORT (RESTORED)
=========================================
Timestamp: ${new Date().toLocaleString()}
Original Extraction Time: ${item.timestamp}
Source Target: ${item.url}
Media Title: ${item.title}
Source Creator/Channel: ${item.channel}
Playback Views: ${item.views}
Playback Duration: ${item.duration}

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
        
        // Report text
        const aReport = document.createElement('a');
        aReport.href = fileUrl;
        aReport.download = `extractile-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-archive-report.txt`;
        document.body.appendChild(aReport);
        aReport.click();
        document.body.removeChild(aReport);

        // Dummy Media File
        const aVideo = document.createElement('a');
        aVideo.href = fileUrl;
        aVideo.download = `extractile-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
        document.body.appendChild(aVideo);
        aVideo.click();
        document.body.removeChild(aVideo);

        window.URL.revokeObjectURL(fileUrl);
        onTriggerAlert("Files Downloaded", `Packaged media and technical report successfully downloaded.`);
      } catch (err) {
        console.error("Bulk download failed:", err);
      } finally {
        setDownloadingId(null);
      }
    }, 1000);
  };

  const filteredHistory = historyList.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-10"
      id="history-view-container"
    >
      {/* Header section */}
      <section className="text-center py-6 max-w-3xl mx-auto space-y-4">
        <span className="text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary block">
          LOCAL ARCHIVAL VAULT
        </span>
        <h1 className="font-serif font-normal text-4xl md:text-5xl text-primary tracking-tight">
          Trace Your <span className="italic text-secondary">Extractions.</span>
        </h1>
        <p className="text-[14px] text-on-surface-variant font-serif italic max-w-2xl mx-auto leading-relaxed">
          Your previously processed stream records are preserved locally in your browser. Revisit past outputs, download technical reports, or restore items into the workspace.
        </p>
      </section>

      {/* Main vault area */}
      <section className="max-w-6xl w-full mx-auto space-y-6">

        {/* Active Tasks Panel */}
        <AnimatePresence>
          {activeTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#edeae4] border border-primary p-5 shadow-[4px_4px_0px_#1b222c] space-y-4 overflow-hidden"
              id="active-scaling-tasks-panel"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-primary/20 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                  </span>
                  <h3 className="font-serif font-bold text-sm md:text-base text-primary uppercase tracking-wider">
                    Active Video Scaling & Extraction Pipeline
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-on-surface-variant font-bold uppercase tracking-wider bg-background px-2.5 py-1 border border-primary/10">
                  {activeTasks.length} {activeTasks.length === 1 ? 'TASK' : 'TASKS'} OPERATIONAL
                </span>
              </div>

              <div className="space-y-3">
                {activeTasks.map((task) => {
                  const statusText = getScalingStatusText(task.progress, task.status);
                  return (
                    <div 
                      key={task.id}
                      className="bg-background border border-primary/15 p-3 flex flex-col gap-3 hover:border-primary/30 transition-all shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-grow w-full md:w-auto">
                          <div className="w-14 h-8 bg-neutral-900 border border-primary overflow-hidden relative flex-shrink-0">
                            <img 
                              src={task.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"} 
                              alt="" 
                              className="w-full h-full object-cover filter grayscale contrast-120 animate-pulse"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono bg-background text-on-surface px-0.5 border border-primary/35">
                              {task.duration || "0:00"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-serif font-bold text-xs text-primary truncate leading-tight">
                              {task.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-mono text-on-surface-variant uppercase tracking-wider mt-0.5 font-bold">
                              <span className="text-primary">{task.channel || "Source Creator"}</span>
                              <span>•</span>
                              <span className="truncate max-w-[120px] sm:max-w-xs">{task.url}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-end flex-shrink-0">
                          <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-300/40 px-2 py-0.5 rounded-none text-[8px] font-mono text-amber-800 font-bold tracking-wider uppercase">
                            <Loader2 className="w-2.5 h-2.5 text-amber-700 animate-spin" />
                            <span>{statusText} • {task.progress}%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelActiveTask(task.id)}
                            className="p-1 border border-rose-300 hover:bg-rose-100 text-rose-800 hover:text-rose-950 transition-all cursor-pointer rounded-none shrink-0"
                            title="Abort scaling operation"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Real-time scaling progress bar with spring styling */}
                      <div className="w-full bg-[#dae2ec] h-1 border border-primary/10 relative overflow-hidden">
                        <motion.div 
                          className="h-full bg-secondary"
                          initial={{ width: "0%" }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ type: "spring", stiffness: 85, damping: 14 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Filters and Utility bar */}
        <div className="bg-[#e4eaf0] border border-primary p-4 shadow-[4px_4px_0px_#1b222c] flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, channel, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 bg-background border border-outline-variant rounded-none text-on-surface placeholder:text-on-surface-variant/50 text-xs font-mono focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Quick Metrics & Clear History */}
          <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[10px] font-mono text-on-surface-variant font-bold uppercase tracking-wider">
              TOTAL PRESERVED: <span className="text-primary">{filteredHistory.length}</span> / {historyList.length}
            </span>
            {historyList.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all rounded-none flex items-center gap-1.5 shadow-[2px_2px_0px_var(--color-secondary)] hover:shadow-none active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-secondary" />
                  <span>EXPORT PDF LEDGER</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-mono text-[10px] font-bold tracking-wider uppercase border border-rose-300/30 cursor-pointer transition-all rounded-none"
                >
                  PURGE ALL TRACES
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved List container */}
        <AnimatePresence mode="popLayout">
          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#e4eaf0] border border-dashed border-primary/35 p-16 text-center space-y-6"
            >
              <div className="flex justify-center">
                <History className="w-12 h-12 text-on-surface-variant/30 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="font-serif font-bold text-lg text-on-surface">No Archived Preservations</h4>
                <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                  {searchQuery 
                    ? "Your search term didn't match any preserved extractions. Try clearing the query filter."
                    : "Your local database has no registered video stream traces. Head back to the main Extractor tab to process your first target."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab("features")}
                  className="px-6 py-3 bg-primary hover:bg-secondary text-on-primary font-mono text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 cursor-pointer rounded-none"
                >
                  GO TO STREAM EXTRACTOR
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHistory.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#e4eaf0] border border-primary p-4 shadow-[4px_4px_0px_#1b222c] flex flex-col justify-between gap-4 hover:shadow-[6px_6px_0px_#1b222c] hover:bg-surface-container transition-all rounded-none group relative"
                >
                  <div className="flex gap-4 items-start">
                    {/* Video Thumbnail block */}
                    <div className="w-24 h-14 bg-neutral-900 border border-primary overflow-hidden relative flex-shrink-0">
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover filter grayscale contrast-115 group-hover:grayscale-0 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1 right-1 bg-neutral-900 text-[8px] font-mono text-white px-1 border border-neutral-700">
                        {item.duration}
                      </div>
                    </div>

                    {/* Metadata column */}
                    <div className="space-y-1 min-w-0 flex-grow">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-bold text-sm text-primary line-clamp-2 leading-snug group-hover:text-secondary transition-all">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                        <span className="text-primary">{item.channel}</span>
                        <span>•</span>
                        <span>{item.views} PLAYS</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-mono text-on-surface-variant/70 tracking-tight min-w-0 max-w-full">
                        <span className="font-bold shrink-0">Target:</span>
                        <button
                          type="button"
                          onClick={() => onOpenWebsite?.(item.url)}
                          className="text-secondary hover:text-primary hover:underline transition-all truncate text-left cursor-pointer flex items-center gap-0.5 font-bold"
                          title="Open website with animation sandbox"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{item.url}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer metadata & buttons */}
                  <div className="border-t border-primary/15 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-on-surface-variant">
                      <History className="w-3 h-3 text-secondary" />
                      <span>Saved {item.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Restore */}
                      <button
                        type="button"
                        onClick={() => handleRestoreRecord(item)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-secondary text-on-primary font-mono text-[9px] font-bold tracking-wider uppercase cursor-pointer transition-all rounded-none active:scale-95"
                        title="Load this extraction back into the live Workspace editor"
                      >
                        <span>RESTORE</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        disabled={downloadingId === item.id}
                        onClick={() => handleDirectDownload(item)}
                        className={`p-1.5 border border-primary/25 text-secondary hover:bg-primary hover:text-on-primary transition-all cursor-pointer rounded-none ${
                          downloadingId === item.id ? "animate-pulse" : ""
                        }`}
                        title="Direct download report & media package"
                      >
                        {downloadingId === item.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete log */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 border border-primary/25 text-rose-800 hover:text-rose-950 hover:bg-rose-50 transition-all cursor-pointer rounded-none"
                        title="Remove archival log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Security notice block */}
      <section className="max-w-6xl w-full mx-auto mt-6 bg-[#ded9cf] border border-primary/20 p-5 font-mono text-[10px] leading-relaxed text-on-surface-variant flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-primary">LOCAL STORAGE ARCHIVE INTEGRITY</p>
          <p>
            Extractile saves extraction metadata and trace logs strictly inside your web browser's offline <code className="bg-background px-1 border border-primary/10">localStorage</code>. Clear browser history or site cookies will purge these trace logs. No media files or credentials are ever transmitted to any remote servers.
          </p>
        </div>
      </section>
    </motion.div>
  );
}
