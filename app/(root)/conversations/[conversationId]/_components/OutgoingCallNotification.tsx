"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Video, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OutgoingCallNotificationProps {
  recipientName: string;
  recipientImage?: string;
  callType: "video" | "audio";
  onCancel: () => void;
}

export default function OutgoingCallNotification({
  recipientName,
  recipientImage,
  callType,
  onCancel,
}: OutgoingCallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center"
    >
      <div className="text-center space-y-8 p-8">
        {/* Recipient Avatar with Ring Animation */}
        <div className="relative">
          <motion.div
            animate={{
              scale: isRinging ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
          />
          <Avatar className="h-32 w-32 rounded-full mx-auto relative border-4 border-primary/50">
            <AvatarImage src={recipientImage} className="rounded-full object-cover" />
            <AvatarFallback className="rounded-full text-4xl">
              {recipientName.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Recipient Info */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">{recipientName}</h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {callType === "video" ? (
              <Video className="h-5 w-5" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg"
            >
              Calling...
            </motion.p>
          </div>
        </div>

        {/* Cancel Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={onCancel}
            size="lg"
            className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </motion.div>

        <p className="text-sm text-muted-foreground">
          Waiting for answer...
        </p>
      </div>
    </motion.div>
  );
}
