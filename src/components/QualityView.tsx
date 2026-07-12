import { motion } from "motion/react";
import { 
  Music, 
  Tv, 
  Cpu, 
  ArrowRight, 
  Settings2, 
  Activity, 
  Percent 
} from "lucide-react";

export default function QualityView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-12"
    >
      {/* Hero Section */}
      <section className="text-center py-6 relative">
        <span className="text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary mb-3 block">
          METRIC SPECIFICATIONS
        </span>
        <h1 className="font-serif font-normal text-4xl md:text-6xl text-primary mb-4 tracking-tight leading-tight">
          Engineering <span className="italic text-secondary">High-Fidelity.</span>
        </h1>
        <p className="text-[14px] md:text-[15px] text-on-surface-variant max-w-2xl mx-auto font-serif italic leading-relaxed">
          Uncompromising precision in every bit. Our direct extraction pipeline guarantees bit-perfect audio transfer and dynamically reconstructed visual plates for elite production.
        </p>
      </section>

      {/* Bento Grid Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Lossless Audio Card */}
        <div className="md:col-span-7 bg-[#e4eaf0] border border-primary rounded-none p-6 md:p-8 flex flex-col relative overflow-hidden group shadow-[4px_4px_0px_rgba(26,26,26,0.15)]">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-background border border-primary text-secondary">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-xl text-on-surface">Lossless Audio Preservation</h3>
          </div>

          <p className="text-xs md:text-sm text-on-surface-variant font-mono leading-relaxed mb-8 relative z-10 flex-grow">
            Our pipeline copies stream blocks directly from remote container files. By bypassing standard server re-encoding pipelines, we retain the absolute studio master. Zero compression artifacting.
          </p>

          <div className="relative z-10 mt-auto space-y-3">
            <div className="h-3 w-full bg-background rounded-none overflow-hidden border border-primary">
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-primary origin-left"
              />
            </div>
            <div className="flex justify-between items-center font-mono text-[11px] text-primary font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                48kHz / 24-bit PCM
              </span>
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                0% Transcode Degradation
              </span>
            </div>
          </div>
        </div>

        {/* Video Neural Card */}
        <div className="md:col-span-5 bg-[#e4eaf0] border border-primary rounded-none p-6 md:p-8 flex flex-col relative overflow-hidden group shadow-[4px_4px_0px_#4f5e7c]">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-background border border-primary text-secondary">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-xl text-on-surface">1080p Neural Re-scaling</h3>
          </div>

          <p className="text-xs md:text-sm text-on-surface-variant font-mono leading-relaxed mb-8 relative z-10 flex-grow">
            Sub-HD streaming frames are reconstructed via neural networks to bring out lost textural details, sharpen motion paths, and minimize macroblocking.
          </p>

          <div className="relative z-10 mt-auto bg-background rounded-none border border-primary p-3.5 flex justify-between items-center font-mono text-xs font-semibold">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-on-surface-variant uppercase font-sans font-bold tracking-wider">Source Codec</span>
              <span className="text-rose-800">720p H.264 Web</span>
            </div>
            <ArrowRight className="w-4 h-4 text-secondary" />
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[9px] text-on-surface-variant uppercase font-sans font-bold tracking-wider">Output Stream</span>
              <span className="text-[#4f5e7c]">1080p Master</span>
            </div>
          </div>
        </div>

      </section>

      {/* Tech Stack and Speed Graphic Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* Tech Stack (Quantum Extraction Engine) */}
        <div className="bg-[#e4eaf0] border border-primary rounded-none p-6 md:p-8 flex flex-col justify-center gap-4 shadow-[4px_4px_0px_rgba(26,26,26,0.1)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background border border-primary text-secondary">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-lg md:text-xl text-on-surface">The Archival Core</h4>
          </div>
          
          <p className="text-xs md:text-sm text-on-surface-variant font-mono leading-relaxed">
            Engineered inside an isolated, highly concurrent Rust runtime. Bypassing high-level interpreter slow-paths, it interacts directly with network buffer sockets to reach hardware limits.
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 bg-background border border-primary/25 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              RUST COMPILED
            </span>
            <span className="px-3 py-1 bg-background border border-primary/25 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              SIMD PARALLEL
            </span>
            <span className="px-3 py-1 bg-background border border-primary/25 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              EPOLL SOCKETS
            </span>
          </div>
        </div>

        {/* Speed Velocity Chart */}
        <div className="bg-[#e4eaf0] border border-primary rounded-none p-6 md:p-8 flex flex-col gap-6 min-h-[280px]">
          <div className="flex items-center justify-between border-b border-primary/10 pb-3">
            <h4 className="font-serif font-bold text-lg text-on-surface flex items-center gap-2">
              <Activity className="w-4 h-4 text-secondary" />
              Transfer Velocity
            </h4>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest bg-background px-2.5 py-1 rounded-none border border-primary/20">
              MB/S INDEX
            </span>
          </div>

          <div className="flex items-end gap-4 md:gap-8 flex-grow h-32 pt-4 relative">
            
            {/* Generic standard */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "25%" }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                className="w-full bg-background/50 border border-primary/40 rounded-none relative hover:bg-background transition-colors"
              />
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase">Average</span>
            </div>

            {/* Pro Tools */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "55%" }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                className="w-full bg-primary/20 border border-primary rounded-none relative hover:bg-primary/30 transition-all"
              />
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase">Pro Tools</span>
            </div>

            {/* Extractile */}
            <div id="velocity-bar-extractile" className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <motion.div 
                id="velocity-fill-extractile"
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 80 }}
                className="w-full bg-primary border border-primary rounded-none relative hover:bg-secondary transition-all shadow-[4px_4px_0px_#4f5e7c]"
              />
              <span className="font-sans font-bold text-[10px] text-secondary tracking-widest uppercase">Extractile</span>
            </div>

          </div>
        </div>

      </section>
    </motion.div>
  );
}
