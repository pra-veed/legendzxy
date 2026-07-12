import { motion, AnimatePresence } from "motion/react";
import { Terminal, Shield, AlertTriangle, X } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, title, message, onClose }: NotificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md bg-[#e4eaf0] border border-primary p-6 md:p-8 shadow-[8px_8px_0px_#1b222c] z-10 flex flex-col gap-6"
          >
            {/* Close Cross button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-[#dae2ec] border border-transparent hover:border-primary transition-all cursor-pointer rounded-none text-primary"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Identity */}
            <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
              <div className="p-2.5 bg-background border border-primary text-secondary">
                <Terminal className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase text-secondary tracking-widest block">EXTRACTILE SECURE SYSTEM</span>
                <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider block">TRANSMISSION DIALOGUE</span>
              </div>
            </div>

            {/* Content Message */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xl text-primary tracking-tight leading-tight">{title}</h3>
              <p className="text-xs md:text-sm font-mono text-on-surface-variant leading-relaxed">
                {message}
              </p>
            </div>

            {/* Disclaimer pill */}
            <div className="flex gap-2.5 items-start bg-background p-3.5 border border-primary/25 rounded-none">
              <Shield className="w-4.5 h-4.5 text-secondary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-on-surface-variant leading-relaxed uppercase">
                ALL SYSTEM VECTORS ARE ISOLATED AND SECURED BY PRIVATE ENCRYPTION PROTOCOLS.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary hover:bg-secondary text-on-primary text-[10px] tracking-[0.18em] uppercase font-bold transition-all cursor-pointer rounded-none active:scale-95 shadow-[3px_3px_0px_#4f5e7c]"
              >
                DISMISS SYSTEM BLUEPRINT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
