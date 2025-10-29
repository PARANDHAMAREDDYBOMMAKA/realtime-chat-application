"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface IncomingCallNotificationProps {
  callerName: string;
  callerImage?: string;
  callType: "video" | "audio";
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallNotification({
  callerName,
  callerImage,
  callType,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Play ringing sound (you can add actual audio here)
    const interval = setInterval(() => {
      setIsRinging((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center"
      >
        <div className="text-center space-y-8 p-8">
          {/* Caller Avatar with Ring Animation */}
          <div className="relative">
            <motion.div
              animate={{
                scale: isRinging ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
            />
            <Avatar className="h-32 w-32 mx-auto relative border-4 border-primary/50">
              <AvatarImage src={callerImage} />
              <AvatarFallback className="text-4xl">
                {callerName.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{callerName}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              {callType === "video" ? (
                <Video className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
              <p className="text-lg">
                Incoming {callType} call...
              </p>
            </div>
          </div>

          {/* Call Actions */}
          <div className="flex items-center justify-center gap-8">
            {/* Reject Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={onReject}
                size="lg"
                className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </motion.div>

            {/* Accept Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: isRinging ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Button
                onClick={onAccept}
                size="lg"
                className="h-20 w-20 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50"
              >
                <Phone className="h-8 w-8" />
              </Button>
            </motion.div>
          </div>

          {/* Hint Text */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm text-muted-foreground"
          >
            Tap to answer
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
