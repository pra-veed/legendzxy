import { motion } from "motion/react";
import { ShieldCheck, CheckCircle2, Cpu, Activity, Sparkles } from "lucide-react";

interface CircularProgressBarProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  variant?: "primary" | "emerald" | "amber" | "sky";
  showIcon?: boolean;
  className?: string;
}

export default function CircularProgressBar({
  progress,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  variant = "primary",
  showIcon = true,
  className = ""
}: CircularProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Variant color mappings
  const variantStyles = {
    primary: {
      stroke: "#f39c12", // Secondary Gold accent
      strokeTrack: "rgba(243, 156, 18, 0.15)",
      badgeBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300",
      textColor: "text-amber-600 dark:text-amber-400",
      glowColor: "rgba(243, 156, 18, 0.3)"
    },
    emerald: {
      stroke: "#10b981", // Emerald Green
      strokeTrack: "rgba(16, 185, 129, 0.15)",
      badgeBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300",
      textColor: "text-emerald-600 dark:text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.3)"
    },
    amber: {
      stroke: "#f59e0b", // Amber Warning / Active
      strokeTrack: "rgba(245, 158, 11, 0.15)",
      badgeBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300",
      textColor: "text-amber-600 dark:text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.3)"
    },
    sky: {
      stroke: "#0284c7", // Sky Blue
      strokeTrack: "rgba(2, 132, 199, 0.15)",
      badgeBg: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-sky-300",
      textColor: "text-sky-600 dark:text-sky-400",
      glowColor: "rgba(2, 132, 199, 0.3)"
    }
  };

  const style = variantStyles[variant];

  return (
    <div className={`flex flex-col items-center justify-center p-2 relative select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Ambient Glow Aura */}
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-40 transition-all duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${style.glowColor} 0%, transparent 70%)`
          }}
        />

        {/* SVG Circular Track & Progress Ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 relative z-10"
        >
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={style.strokeTrack}
            fill="none"
          />

          {/* Inner Dashed Guides Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 1.5}
            strokeWidth="1"
            stroke="currentColor"
            strokeDasharray="3,3"
            className="text-primary/20"
            fill="none"
          />

          {/* Animated Main Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={style.stroke}
            strokeLinecap="round"
            fill="none"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Rotating Radar Scanner Pulse Ring (when processing) */}
        {clampedProgress > 0 && clampedProgress < 100 && (
          <div 
            className="absolute inset-1 rounded-full border border-dashed border-primary/40 animate-spin-slow pointer-events-none"
            style={{ animationDuration: "10s" }}
          />
        )}

        {/* Center Percentage Display & Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-1">
          {showIcon && clampedProgress === 100 ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center"
            >
              <CheckCircle2 className={`w-6 h-6 ${style.textColor} mb-0.5`} />
              <span className="font-mono font-black text-xs text-primary tracking-tight">100%</span>
            </motion.div>
          ) : (
            <>
              <motion.span 
                key={clampedProgress}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="font-mono font-black text-xl text-primary leading-none tracking-tight"
              >
                {clampedProgress}%
              </motion.span>
              {clampedProgress < 100 && (
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-on-surface-variant/70 mt-0.5 animate-pulse">
                  ACTIVE
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Optional Outer Labels */}
      {(label || sublabel) && (
        <div className="mt-2 text-center space-y-0.5">
          {label && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center justify-center gap-1">
              {clampedProgress < 100 && <Activity className="w-3 h-3 text-secondary animate-spin-slow" />}
              <span>{label}</span>
            </div>
          )}
          {sublabel && (
            <div className="text-[9px] font-mono text-on-surface-variant/80">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
