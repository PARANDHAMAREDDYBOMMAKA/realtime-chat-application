"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Sparkles } from "lucide-react";

type LoadingType = "messages" | "conversations" | "general" | "typing";

interface EnhancedLoadingProps {
  type?: LoadingType;
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function EnhancedLoading({
  type = "general",
  message,
  size = "md"
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const containerClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4"
  };

  if (type === "typing") {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">Someone is typing...</span>
      </div>
    );
  }

  const getIcon = () => {
    switch (type) {
      case "messages":
        return MessageCircle;
      case "conversations":
        return Users;
      default:
        return Sparkles;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case "messages":
        return "Loading messages...";
      case "conversations":
        return "Loading conversations...";
      default:
        return "Loading...";
    }
  };

  const Icon = getIcon();

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} py-8`}>
      {/* Main loading animation */}
      <div className="relative">
        {/* Outer spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: size === "lg" ? 56 : size === "md" ? 40 : 32,
            height: size === "lg" ? 56 : size === "md" ? 40 : 32,
          }}
        >
          <motion.div
            className="absolute rounded-full bg-primary w-1 h-1 left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Pulsing background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            width: size === "lg" ? 56 : size === "md" ? 40 : 32,
            height: size === "lg" ? 56 : size === "md" ? 40 : 32,
          }}
        />

        {/* Icon in center */}
        <motion.div
          className={`relative ${sizeClasses[size]} flex items-center justify-center text-primary`}
          animate={{
            scale: [1, 1.1, 1],
            rotate: type === "general" ? [0, 180, 360] : 0
          }}
          transition={{
            duration: type === "general" ? 3 : 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Icon className="w-full h-full" />
        </motion.div>

        {/* Floating particles */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/40"
            style={{
              width: 4,
              height: 4,
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos(i * 120 * Math.PI / 180) * 30],
              y: [0, Math.sin(i * 120 * Math.PI / 180) * 30],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Loading message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.p
          className={`text-muted-foreground ${
            size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs"
          }`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          {message || getDefaultMessage()}
        </motion.p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}