import { motion } from "framer-motion";
import { memo } from "react";

export const AmbientMotion = memo(function AmbientMotion() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Subtle Background Shimmer */}
      <motion.div
        className="absolute inset-0 bg-[var(--brand-blue)]"
        animate={{ opacity: [0.01, 0.02, 0.01] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "opacity" }}
      />

      {/* Soft Light Movement */}
      <motion.div
        className="absolute w-[80vw] h-[80vh] bg-[var(--brand-blue)]/[0.010] blur-[100px] rounded-full"
        animate={{
          x: ["-20%", "40%", "-20%"],
          y: ["-10%", "20%", "-10%"],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
      />
      <motion.div
        className="absolute right-0 top-1/3 w-[60vw] h-[60vh] bg-[var(--brand-blue)]/[0.010] blur-[120px] rounded-full"
        animate={{
          x: ["20%", "-30%", "20%"],
          y: ["20%", "-10%", "20%"],
        }}
        transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
      />

      {/* Tiny glowing neural dots / slow drifting particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-white/40 shadow-[0_0_8px_rgba(48,84,255,0.3)]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            willChange: "transform, opacity",
          }}
          animate={{
            y: [0, -100 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, Math.random() * 0.15 + 0.05, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        />
      ))}

      {/* Occasional Signal Pulses */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)]/10 to-transparent"
          style={{
            top: `${20 + i * 30}%`,
            willChange: "opacity, transform",
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            delay: i * 5 + Math.random() * 10,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});
