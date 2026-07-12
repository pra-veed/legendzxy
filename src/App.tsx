import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FeaturesView from "./components/FeaturesView";
import QualityView from "./components/QualityView";
import FaqView from "./components/FaqView";
import FeedbackView from "./components/FeedbackView";
import HistoryView from "./components/HistoryView";
import UserProfile from "./components/UserProfile";
import ShowcaseView from "./components/ShowcaseView";
import NotificationModal from "./components/NotificationModal";
import LiveChat from "./components/LiveChat";
import WebsiteViewerModal from "./components/WebsiteViewerModal";
import { ActiveTab } from "./types";
import { auth, getUserPreferences } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("features");
  const [liveChatOpen, setLiveChatOpen] = useState(false);
  const [previewWebsiteUrl, setPreviewWebsiteUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Custom non-disruptive alert box states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Load and apply theme preference
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        // Dispatch security login alert if not already notified in this session
        const sessionKey = `login_notified_${currentUser.uid}`;
        const alreadyNotified = sessionStorage.getItem(sessionKey);
        
        if (!alreadyNotified && currentUser.email) {
          sessionStorage.setItem(sessionKey, "true");
          try {
            fetch("/api/login-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: currentUser.email,
                displayName: currentUser.displayName || "Valued Operator",
              }),
            });
            console.log("Login security notification triggered successfully.");
          } catch (err) {
            console.error("Failed to trigger login security notification:", err);
          }
        }

        try {
          const fetchedPrefs = await getUserPreferences(currentUser.uid);
          if (fetchedPrefs && fetchedPrefs.themePreference) {
            const root = window.document.documentElement;
            if (fetchedPrefs.themePreference === "dark") {
              root.classList.add("dark");
            } else {
              root.classList.remove("dark");
            }
          }
        } catch (err) {
          console.error("Error loading theme preference", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartExtracting = () => {
    setActiveTab("features");
    // Scroll to input container smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTriggerAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "features":
        return <FeaturesView onOpenWebsite={setPreviewWebsiteUrl} onTriggerAlert={handleTriggerAlert} user={user} authLoading={authLoading} setActiveTab={setActiveTab} />;
      case "quality":
        return <QualityView />;
      case "faq":
        return <FaqView onOpenLiveChat={() => setLiveChatOpen(true)} />;
      case "feedback":
        return <FeedbackView onTriggerAlert={handleTriggerAlert} />;
      case "showcase":
        return <ShowcaseView onTriggerAlert={handleTriggerAlert} />;
      case "history":
        return <HistoryView setActiveTab={setActiveTab} onTriggerAlert={handleTriggerAlert} onOpenWebsite={setPreviewWebsiteUrl} />;
      case "profile":
        return <UserProfile onTriggerAlert={handleTriggerAlert} setActiveTab={setActiveTab} user={user} authLoading={authLoading} />;
      default:
        return <FeaturesView onOpenWebsite={setPreviewWebsiteUrl} onTriggerAlert={handleTriggerAlert} user={user} authLoading={authLoading} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative grid-bg overflow-x-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-10 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[350px] h-[350px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onStartExtracting={handleStartExtracting}
        onTriggerAlert={handleTriggerAlert}
        user={user}
        authLoading={authLoading}
      />

      {/* Main Container Stage */}
      <main className="flex-grow pt-24 pb-16 px-4 md:px-10 max-w-7xl w-full mx-auto flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-grow flex flex-col w-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floatable priority chat triage queue */}
      <LiveChat 
        isOpen={liveChatOpen} 
        onClose={() => setLiveChatOpen(false)} 
      />

      {/* Action Support Button floating on desktop */}
      {!liveChatOpen && (
        <button
          onClick={() => setLiveChatOpen(true)}
          className="fixed bottom-6 right-6 p-3.5 rounded-none bg-[#e4eaf0] text-primary border border-primary shadow-[4px_4px_0px_#1b222c] hover:bg-[#dae2ec] cursor-pointer active:scale-95 transition-all z-40 hidden md:flex items-center justify-center gap-2"
          aria-label="Open technical triage bot"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-4 h-4 text-primary"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase">TRIAGE</span>
        </button>
      )}

      {/* Elegant Custom dialogue alerts */}
      <NotificationModal 
        isOpen={alertOpen} 
        title={alertTitle} 
        message={alertMessage} 
        onClose={() => setAlertOpen(false)} 
      />

      {/* Elegant Custom Website Sandbox Viewer */}
      <AnimatePresence>
        {previewWebsiteUrl && (
          <WebsiteViewerModal 
            url={previewWebsiteUrl} 
            onClose={() => setPreviewWebsiteUrl(null)} 
          />
        )}
      </AnimatePresence>

      {/* Global Footer */}
      <Footer 
        setActiveTab={setActiveTab} 
        onOpenSupport={() => setLiveChatOpen(true)} 
        onTriggerAlert={handleTriggerAlert}
      />
    </div>
  );
}
