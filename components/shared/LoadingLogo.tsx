"use client";

import Image from "next/image";
// import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  size?: number;
};

const LoadingLogo = ({ size = 100 }: Props) => {
  // const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show theme-aware content after mounting to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <div
          style={{ width: size, height: size }}
          className="bg-muted/30 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex justify-center items-center">
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
        }}
      >
        {/* Ambient glow */}
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-2xl"
          style={{ width: size * 1.8, height: size * 1.8 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Spinning ring */}
        <motion.div
          className="absolute rounded-full border-2 border-primary/20"
          style={{ width: size * 1.4, height: size * 1.4 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="absolute rounded-full bg-primary h-3 w-3 left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Logo with pulse */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={size}
            height={size}
            className="drop-shadow-lg relative z-10"
          />
        </motion.div>

        {/* Optional particles */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/70 h-1 w-1"
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              x:
                Math.random() > 0.5
                  ? [0, Math.random() * 50 - 25]
                  : [0, Math.random() * -50 + 25],
              y:
                Math.random() > 0.5
                  ? [0, Math.random() * 50 - 25]
                  : [0, Math.random() * -50 + 25],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.6,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default LoadingLogo;
