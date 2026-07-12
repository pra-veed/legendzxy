import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Loader2 } from "lucide-react";
import { ActiveTab } from "../types";
import { auth, signInWithGoogle, logout } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onStartExtracting: () => void;
  onTriggerAlert: (title: string, message: string) => void;
  user: User | null;
  authLoading: boolean;
}

export default function Navbar({ activeTab, setActiveTab, onStartExtracting, onTriggerAlert, user, authLoading }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      onTriggerAlert("Welcome back!", "Successfully signed in via Google Secure Authentication.");
    } catch (err: any) {
      console.error("Sign-In Error caught in Navbar:", err);
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

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: "features", label: "Extractor" },
    { id: "quality", label: "Fidelity" },
    { id: "feedback", label: "Feedback" },
    { id: "history", label: "History" },
    ...(user ? [{ id: "profile" as const, label: "Profile" }] : []),
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 flex items-center transition-all duration-300 ${
      isScrolled 
        ? "h-16 bg-background/80 backdrop-blur-md border-b border-outline/10 shadow-sm" 
        : "h-20 bg-transparent border-b border-transparent"
    }`}>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 flex justify-between items-center gap-10">
        {/* Logo */}
        <div 
          onClick={() => {
            setActiveTab("features");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} 
          className="font-display font-bold text-2xl text-primary tracking-tight cursor-pointer flex items-center select-none hover:opacity-80 transition-opacity"
        >
          <img 
            src="/favicon.svg" 
            alt="Extractile Logo" 
            className="w-8 h-8 object-contain mr-4 border border-primary/20 shadow-[1.5px_1.5px_0px_rgba(26,26,26,0.1)] rounded-sm" 
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold uppercase tracking-tight text-primary italic no-underline">Extract</span>
          <span className="font-bold italic text-secondary tracking-wide lowercase no-underline">ile</span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block mb-1 ml-1.5 animate-pulse"></span>
        </div>

        {/* Desktop Navigation links */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 px-3 text-[11px] tracking-wider uppercase font-sans font-bold transition-all duration-200 cursor-pointer border-b-2 ${
                  isActive
                    ? "text-primary border-secondary pb-0.5"
                    : "text-on-surface-variant hover:text-primary border-transparent hover:border-secondary/40 pb-0.5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Action & Login Buttons */}
        <div className="hidden md:flex items-center gap-6">
          {authLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/70">Syncing...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 bg-surface-container-low/40 p-1 px-2 border border-outline/10">
              <div 
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                title="View Profile Settings"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-6 h-6 rounded-full border border-secondary" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 bg-secondary text-primary flex items-center justify-center font-bold text-[10px] uppercase rounded-full">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden lg:flex flex-col">
                  <span className="text-[10px] font-bold text-primary font-sans leading-none">{user.displayName?.split(" ")[0] || "Operator"}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-mono font-bold text-secondary hover:text-primary transition-colors uppercase flex items-center gap-1 cursor-pointer ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3.5 py-2 text-[10px] tracking-wider uppercase font-bold border border-primary/30 hover:border-secondary text-primary hover:bg-[#e4eaf0] transition-all flex items-center gap-1.5 cursor-pointer rounded-none"
              title="Sign in with your Google account"
            >
              <LogIn className="w-3.5 h-3.5 text-secondary" />
              <span>SIGN IN</span>
            </button>
          )}

          <button 
            onClick={onStartExtracting}
            className="px-5 py-2 text-[10px] tracking-wider uppercase font-bold bg-primary text-on-primary hover:bg-secondary cursor-pointer transition-all duration-200 active:scale-95 rounded-none shadow-[3px_3px_0px_#4f5e7c]"
          >
            EXTRACT NOW
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button 
            onClick={onStartExtracting}
            className="px-3 py-1.5 text-[9px] tracking-wider uppercase font-bold bg-primary text-on-primary cursor-pointer active:scale-95 rounded-none"
          >
            Extract
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-none border border-outline/30 text-primary active:scale-95 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b border-outline/30 flex flex-col p-6 gap-6 z-40 shadow-lg transition-all duration-300">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left p-2.5 text-[10px] tracking-[0.15em] uppercase font-bold transition-all ${
                    isActive
                      ? "bg-surface-container text-primary border-l-2 border-primary pl-3"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-outline/25 w-full" />
          
          {/* Mobile Login Row */}
          <div className="bg-surface-container-low/60 p-4 border border-outline/10">
            {authLoading ? (
              <div className="flex items-center gap-2 py-1.5 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Checking Session...</span>
              </div>
            ) : user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="w-8 h-8 rounded-full border border-secondary" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary text-primary flex items-center justify-center font-bold text-xs uppercase rounded-full">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary font-sans">{user.displayName || "Operator"}</span>
                    <span className="text-[9px] font-mono text-on-surface-variant/70">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 flex items-center justify-center gap-2 border border-red-500/20 text-red-500 font-bold text-[10px] tracking-widest uppercase hover:bg-red-500/5 cursor-pointer transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> SIGN OUT
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider text-center block">Cloud Sync Enabled</span>
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#e4eaf0] hover:bg-[#d5dde4] border border-primary/25 text-primary font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer rounded-none"
                >
                  <LogIn className="w-3.5 h-3.5" /> SIGN IN WITH GOOGLE
                </button>
              </div>
            )}
          </div>
          
          <div className="h-px bg-outline/25 w-full" />
          
          <button 
            onClick={() => {
              onStartExtracting();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 text-center text-[10px] tracking-widest uppercase font-bold rounded-none bg-primary text-on-primary cursor-pointer"
          >
            EXTRACT NOW
          </button>
        </div>
      )}
    </nav>
  );
}
