import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ChevronDown, 
  Headphones, 
  MessageSquare, 
  Mail, 
  Clock 
} from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqViewProps {
  onOpenLiveChat: () => void;
}

export default function FaqView({ onOpenLiveChat }: FaqViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqData: FaqItem[] = [
    {
      id: "legal",
      question: "Archival Compliance Guidelines",
      answer: "Extractile interfaces exclusively with publicly visible stream containers. The platform does not retain, cache, or distribute user extraction history. It is the responsibility of the user to ensure that their target asset captures align with copyright fair-use statutes and destination guidelines."
    },
    {
      id: "formats",
      question: "Supported Codecs & Container Envelopes",
      answer: "We support direct extraction to raw MP3, AAC, FLAC, and high-bitrate MP4 container bundles. Developers can also invoke our free API to stream raw frame telemetry payloads directly to cloud-native disk buckets in JSON or Parquet formats."
    },
    {
      id: "limit",
      question: "Stream Concurrent Ingestion Limits",
      answer: "Extractile is 100% free with absolutely no limits. Standard and advanced users alike enjoy unlimited daily extractions, unrestricted active lanes, and dynamic routing rotation to preserve high-fidelity media seamlessly."
    },
    {
      id: "bug",
      question: "Triage Pipeline for Failed Extractions",
      answer: "In the rare event that a stream block fails to unpack, please record the unique Core ID shown on your dashboard. Submitting this code directly to our active desk will instantly prioritize the route for manual node correction."
    }
  ];

  const filteredFaqs = faqData.filter(
    item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-10"
    >
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-primary/20 pb-8">
        <div className="space-y-3 max-w-3xl">
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary block">
            DOCUMENTATION & TRIAGE DESK
          </span>
          <h1 className="font-serif font-normal text-4xl md:text-5xl text-primary tracking-tight">
            Support & <span className="italic text-secondary">Reference</span>
          </h1>
          <p className="text-[14px] text-on-surface-variant font-serif italic leading-relaxed">
            Standard operating documentation regarding stream replication compliance, neural container unpacking, and concurrent bandwidth allocations.
          </p>
        </div>

        {/* System status pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#4f5e7c]/10 border border-[#4f5e7c]/30 text-[#4f5e7c] rounded-none font-mono text-[10px] font-bold uppercase tracking-wider select-none">
          <span className="w-2 h-2 rounded-full bg-[#4f5e7c] inline-block" />
          <span>Nodes: Active & Pristine</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-3xl relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
        <input 
          type="text"
          placeholder="Search documentation catalog..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-4 pl-12 pr-4 bg-background border border-primary rounded-none text-on-surface placeholder:text-on-surface-variant/40 text-sm font-mono focus:border-secondary focus:outline-none transition-all"
        />
      </div>

      {/* Grid Layout (Faq accordions + support Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Accordion elements */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <motion.div 
                    key={item.id}
                    layout
                    className="bg-[#e4eaf0] border border-primary rounded-none overflow-hidden transition-all duration-300 shadow-[2px_2px_0px_rgba(26,26,26,0.1)]"
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-background/40 transition-colors cursor-pointer select-none"
                    >
                      <span className={`font-serif text-lg transition-colors ${
                        isExpanded ? "text-secondary font-semibold" : "text-primary"
                      }`}>
                        {item.question}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${
                        isExpanded ? "rotate-180 text-secondary" : ""
                      }`} />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="border-t border-primary/10"
                        >
                          <div className="p-6 bg-background/50 text-xs md:text-sm font-mono text-on-surface-variant leading-relaxed">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border border-dashed border-primary/30 rounded-none text-xs font-mono text-on-surface-variant"
              >
                No reference articles matched your query. Try searching for "Guidelines" or "Concurrent".
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Priority queue Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-[#e4eaf0] border border-primary rounded-none p-6 flex flex-col gap-6 shadow-[4px_4px_0px_rgba(26,26,26,0.15)]">
            <div className="flex items-center gap-4 border-b border-primary/20 pb-5">
              <div className="p-3 bg-background border border-primary text-secondary">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-on-surface leading-snug">Priority Desk</h3>
                <p className="text-[9px] font-mono font-bold tracking-widest text-on-surface-variant uppercase mt-0.5">DIRECT ENCRYPTED PIPELINE</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
              Facing complex CDN obstacles, custom headers, or rate-limiting blockades? Our specialized engineering pool responds in real-time.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={onOpenLiveChat}
                className="w-full py-3.5 bg-primary hover:bg-secondary text-on-primary font-bold text-[10px] tracking-[0.18em] uppercase rounded-none cursor-pointer active:scale-95 transition-all duration-200 shadow-[2px_2px_0px_#4f5e7c] flex justify-center items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>START DESK SESSION</span>
              </button>
              <button className="w-full py-3.5 bg-transparent border border-primary hover:bg-background text-on-surface font-bold text-[10px] tracking-[0.18em] uppercase rounded-none cursor-pointer active:scale-95 transition-all duration-200 flex justify-center items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>EMAIL DISPATCH</span>
              </button>
            </div>

            <div className="mt-2 bg-background border border-primary/30 p-4 rounded-none flex flex-col items-center justify-center gap-1">
              <span className="font-mono text-[9px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Triage Interval
              </span>
              <span className="font-serif font-bold text-lg text-[#4f5e7c]">~4 Minutes</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
