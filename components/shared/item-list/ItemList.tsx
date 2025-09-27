"use client";

import { Card } from "@/components/ui/card";
import { useConversation } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = React.PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
}>;

const ItemList = ({ children, title, action: Action }: Props) => {
  const { isActive } = useConversation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className={cn("hidden h-full w-full lg:flex-none lg:w-80", {
          block: !isActive,
          "lg:block": isActive,
        })}
      >
        <Card className="h-full w-full p-4 border border-border/40 shadow-lg relative overflow-hidden bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-md">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
            <div className="absolute inset-0 bg-noise opacity-[0.02]"></div>
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-primary/5 to-transparent"></div>
            <motion.div
              className="absolute -inset-1 bg-gradient-to-tr from-primary/10 to-transparent opacity-30 blur-2xl"
              animate={{
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1, 1.05, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            <motion.div
              className="mb-4 flex items-center justify-between border-b border-border/20 pb-3"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent relative">
                {title}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/80 via-primary/50 to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </h1>
              {Action && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {Action}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="w-full h-[calc(100%-3rem)] flex flex-col items-center justify-start gap-2 overflow-y-auto pr-1 custom-scrollbar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {children}
            </motion.div>
          </div>

          {/* Custom scrollbar styles */}
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(
                to bottom,
                var(--primary),
                transparent
              );
              border-radius: 3px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: var(--primary);
            }

            .bg-noise {
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }
          `}</style>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ItemList;
