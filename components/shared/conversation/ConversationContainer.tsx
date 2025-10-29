"use client";

import { Card } from "@/components/ui/card";
import React from "react";
import { motion } from "framer-motion";

type Props = React.PropsWithChildren<object>;

const ConversationContainer = ({ children }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-[calc(100svh-32px)] lg:h-full"
    >
      <Card className="w-full h-full p-2 flex flex-col gap-2 border border-border/40 shadow-xl relative overflow-hidden bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-sm">
        {/* Background elements for modern look */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="absolute inset-0 bg-noise opacity-[0.015]"></div>
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/3 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-primary/3 to-transparent"></div>
        </div>

        {/* Content with relative positioning to stay above background */}
        <div className="relative z-10 w-full h-full flex flex-col gap-2">
          {children}
        </div>

        <style jsx global>{`
          .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          }
        `}</style>
      </Card>
    </motion.div>
  );
};

export default ConversationContainer;
