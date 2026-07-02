import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const Particles = memo(function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across width
      size: Math.random() * 4 + 2, // 2 to 6 px size
      duration: Math.random() * 15 + 10, // 10 to 25 seconds upward travel
      delay: Math.random() * 10, // 0 to 10 seconds stagger
      opacity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0 base opacity
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bottom-[-20px] rounded-full bg-blue-300 shadow-[0_0_15px_rgba(147,197,253,1)]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            willChange: "transform, opacity",
          }}
          animate={{
            y: [0, -1200], // move upwards well past the screen height
            opacity: [0, p.opacity, 0], // fade in and fade out
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
});
