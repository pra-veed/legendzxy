import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Star, MessageSquare, Heart, ShieldCheck, Loader2, CheckCircle } from "lucide-react";

export default function FeedbackView({ onTriggerAlert }: { onTriggerAlert: (title: string, message: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState("quality");
  const [comments, setComments] = useState("");

  const [formStatus, setFormStatus] = useState<"idle" | "packaging" | "transmitted">("idle");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name.trim()) tempErrors.name = "Your identity or nickname is required.";
    if (!email.trim()) {
      tempErrors.email = "Return address (Email) is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Return address format is invalid.";
    }
    if (!comments.trim()) tempErrors.comments = "Feedback comments cannot be empty.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormStatus("packaging");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          rating,
          feedbackType,
          comments,
        }),
      });

      if (!response.ok) {
        throw new Error("Feedback gateway error");
      }

      const data = await response.json();
      setFormStatus("transmitted");
      onTriggerAlert("Feedback Submitted", data.message || "Thank you! Your feedback has been registered.");
    } catch (err) {
      console.error("Feedback submit error:", err);
      setFormStatus("idle");
      onTriggerAlert("Submission Error", "Failed to send feedback. Please ensure the server is fully running and try again.");
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setRating(5);
    setFeedbackType("quality");
    setComments("");
    setErrors({});
    setFormStatus("idle");
  };

  const categoryDescriptions: { [key: string]: string } = {
    quality: "Ingestion Resolution and Audio Fidelity Quality",
    feature: "Unsolicited or Requested Capability Enhancement",
    bug: "Technical Glitch, Parsing Error, or Container Issue",
    speed: "ConcurrentTime Packet Processing Performance",
    ux: "Typography, Grid Rhythm, or Aspect Ratios Interface Feedback",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-12"
      id="feedback-view-container"
    >
      {/* Header section */}
      <section className="text-center py-6 max-w-3xl mx-auto space-y-4">
        <span className="text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary block">
          COMMUNITY FEEDBACK REGISTRY
        </span>
        <h1 className="font-serif font-normal text-4xl md:text-5xl text-primary tracking-tight">
          Shape the Future of <span className="italic text-secondary">Fidelity.</span>
        </h1>
        <p className="text-[14px] text-on-surface-variant font-serif italic max-w-2xl mx-auto leading-relaxed">
          Your insights direct our concurrent stream reconstruction algorithms and modern format exports. Tell us how we can perfect the Extractile experience.
        </p>
      </section>

      {/* Grid Layout (Form on Left, Guidelines on Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-6xl mx-auto w-full items-stretch">
        
        {/* Left column: Feedback Form */}
        <div className="lg:col-span-7 bg-[#e4eaf0] border border-primary p-6 md:p-8 shadow-[6px_6px_0px_#1b222c] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {formStatus === "idle" && (
              <motion.form
                key="feedback-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="border-b border-primary/20 pb-3">
                  <h3 className="font-serif font-bold text-lg text-on-surface">Feedback Ticket Entry</h3>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-on-surface-variant/75">SHARE YOUR EXPERIENCE WITH EXTRACTILE</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Identity/Nickname</label>
                    <input
                      type="text"
                      placeholder="e.g. Robin Weaver"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors ${
                        errors.name ? "border-rose-800" : "border-outline-variant"
                      }`}
                    />
                    {errors.name && <span className="text-[9px] font-mono text-rose-800 block">{errors.name}</span>}
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Your Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. robin@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors ${
                        errors.email ? "border-rose-800" : "border-outline-variant"
                      }`}
                    />
                    {errors.email && <span className="text-[9px] font-mono text-rose-800 block">{errors.email}</span>}
                  </div>
                </div>

                {/* Rating Stars Selection */}
                <div className="space-y-2 bg-background/40 border border-primary/10 p-4">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
                    Product Rating ({rating} of 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="p-1 cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-90"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors duration-150 ${
                            star <= (hoveredRating ?? rating)
                              ? "fill-secondary text-secondary"
                              : "text-outline-variant hover:text-secondary/60"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-on-surface-variant font-bold ml-2">
                      {rating === 5 ? "Pristine Standard" : rating === 4 ? "Very High Fidelity" : rating === 3 ? "Standard Performance" : rating === 2 ? "Needs Calibration" : "Ingestion Failure"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Feedback Category</label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="w-full bg-background border border-outline-variant rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="quality">Extract Resolution & Audio Fidelity</option>
                      <option value="feature">Enhancement or Feature Proposal</option>
                      <option value="bug">Bug Report / Processing Glitch</option>
                      <option value="speed">Extraction & Server Performance</option>
                      <option value="ux">Layout, Styling, and Interaction</option>
                    </select>
                    <p className="text-[10px] font-mono text-on-surface-variant italic mt-1 pl-1">
                      Target Vector: {categoryDescriptions[feedbackType]}
                    </p>
                  </div>
                </div>

                {/* Comments field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Comments / Suggestions</label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed feedback on what features you want next, or how we can make stream extraction even easier..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className={`w-full bg-background border rounded-none p-3 font-mono text-xs focus:outline-none focus:border-secondary transition-colors resize-none ${
                      errors.comments ? "border-rose-800" : "border-outline-variant"
                    }`}
                  />
                  {errors.comments && <span className="text-[9px] font-mono text-rose-800 block">{errors.comments}</span>}
                </div>

                {/* Interactive Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-secondary text-on-primary py-3.5 px-6 rounded-none font-sans font-bold text-[10px] tracking-[0.18em] uppercase cursor-pointer transition-all active:scale-98 flex justify-center items-center gap-2 shadow-[4px_4px_0px_#4f5e7c] hover:shadow-[2px_2px_0px_#1b222c]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT REGISTRY FEEDBACK</span>
                  </button>
                </div>
              </motion.form>
            )}

            {formStatus === "packaging" && (
              <motion.div
                key="packaging-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center justify-center space-y-4 text-center"
              >
                <Loader2 className="w-12 h-12 text-secondary animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-lg text-primary">Transmitting Feedback Packet...</h4>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant">Writing to feedback logs</p>
                </div>
              </motion.div>
            )}

            {formStatus === "transmitted" && (
              <motion.div
                key="transmitted-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="p-3 bg-[#4f5e7c]/10 border border-[#4f5e7c]/35 text-[#4f5e7c] rounded-full">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="font-serif font-normal text-2xl text-on-surface">Feedback Transmitted</h3>
                  <p className="text-xs font-mono text-on-surface-variant leading-relaxed">
                    Thank you <span className="font-bold text-primary">{name}</span>! Your rating of <span className="font-bold text-primary">{rating}/5 stars</span> has been logged. We read every community entry to improve our pipelines.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-primary hover:bg-secondary text-on-primary font-mono text-[10px] tracking-widest uppercase rounded-none cursor-pointer"
                  >
                    SUBMIT MORE FEEDBACK
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Info details */}
        <div className="lg:col-span-5 bg-[#e4eaf0] border border-primary p-6 md:p-8 flex flex-col justify-between shadow-[4px_4px_0px_rgba(26,26,26,0.12)]">
          <div className="space-y-6">
            <div className="border-b border-primary/20 pb-4">
              <h3 className="font-serif font-bold text-lg text-on-surface">Community Pipeline</h3>
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-on-surface-variant/75">HOW WE TUNE EXTRACTILE</p>
            </div>

            <p className="text-xs font-mono text-on-surface-variant leading-relaxed">
              We compile and analyze aggregated feedback ticket registries directly to identify:
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-3 items-start">
                <div className="p-1.5 bg-background border border-primary text-secondary font-mono text-xs font-bold">
                  01
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold text-on-surface tracking-wider uppercase block">Extraction Success Rates</span>
                  <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">We track and flag video domains that suffer stream decryption issues to re-route extraction paths.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-1.5 bg-background border border-primary text-secondary font-mono text-xs font-bold">
                  02
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold text-on-surface tracking-wider uppercase block">Export Format Preferences</span>
                  <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">High demand for target export containers (like Matroska or WEBP) shapes our download profile enhancements.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-1.5 bg-background border border-primary text-secondary font-mono text-xs font-bold">
                  03
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold text-on-surface tracking-wider uppercase block">Performance Optimization</span>
                  <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">Your input tells us when chunked packaging bottlenecks occur, enabling us to calibrate the high-speed Rust-based nodes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-primary/15 space-y-3">
            <div className="flex items-center gap-2 text-secondary text-[10px] font-sans font-bold tracking-widest uppercase">
              <Heart className="fill-secondary/20 w-4 h-4 text-secondary animate-pulse" />
              <span>COMMUNITY GUARANTEE</span>
            </div>
            <p className="text-[11px] font-mono text-on-surface-variant leading-relaxed">
              Extractile is a community-driven high-fidelity project. We never monetize or distribute your details. All logs are securely archived.
            </p>
          </div>
        </div>

      </section>
    </motion.div>
  );
}
