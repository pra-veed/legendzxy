import { ActiveTab } from "../types";

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSupport: () => void;
  onTriggerAlert: (title: string, message: string) => void;
}

export default function Footer({ setActiveTab, onOpenSupport, onTriggerAlert }: FooterProps) {
  const links = [
    { 
      id: "terms",
      label: "Terms", 
      action: () => onTriggerAlert(
        "Archival Terms of Service", 
        "All media extraction actions performed through Extractile nodes operate on ephemeral memory. Users represent and warrant that they possess legal fair-use authority over requested stream links."
      ) 
    },
    { 
      id: "privacy",
      label: "Privacy Policy", 
      action: () => onTriggerAlert(
        "Secure Ephemeral Privacy", 
        "Extractile does not persist search logs, user addresses, or stream payloads. Sessions live entirely in RAM and are permanently wiped clean instantly upon download completion."
      ) 
    },
    { id: "history", label: "Archival History", action: () => setActiveTab("history") },
    { id: "feedback", label: "Product Feedback", action: () => setActiveTab("feedback") },
    { id: "support", label: "Triage Desk", action: onOpenSupport },
  ];

  return (
    <footer id="global-footer" className="w-full bg-[#e4eaf0] border-t border-outline/25 py-12 px-4 md:px-10 mt-auto transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Brand */}
        <div 
          id="footer-brand"
          onClick={() => setActiveTab("features")}
          className="font-display font-bold text-lg text-primary hover:opacity-80 transition-opacity cursor-pointer select-none tracking-tight flex items-center"
        >
          <img 
            src="/favicon.svg" 
            alt="Extractile Logo" 
            className="w-5 h-5 object-contain mr-3 border border-primary/20 shadow-[1px_1px_0px_rgba(26,26,26,0.1)] rounded-sm" 
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold uppercase tracking-tight text-primary">Extract</span>
          <span className="font-medium italic text-secondary tracking-wide lowercase">ile</span>
          <span className="w-1 h-1 rounded-full bg-secondary inline-block mb-0.5 ml-1"></span>
        </div>

        {/* Links */}
        <div id="footer-links" className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] tracking-[0.18em] uppercase font-sans font-bold text-on-surface-variant">
          {links.map((link) => (
            <button
              id={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              key={link.label}
              onClick={link.action}
              className="hover:text-secondary cursor-pointer transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Copyright */}
        <div id="footer-copyright" className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 text-center md:text-right font-sans max-w-sm leading-relaxed">
          © 2026 EXTRACTILE SYSTEMS. <br/>
          <span className="opacity-60 text-[9px]">VOL. 08 • PRECISION MEDIA CAPTURE</span>
        </div>
      </div>
    </footer>
  );
}
