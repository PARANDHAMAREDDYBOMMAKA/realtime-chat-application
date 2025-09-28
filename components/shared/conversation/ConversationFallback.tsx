"use client";

import { Card } from "@/components/ui/card";
import { MessageCircle, Users, Plus, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";

const ConversationFallback = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="hidden lg:flex h-full w-full p-8 flex-col items-center justify-center bg-gradient-to-br from-background via-background/50 to-muted/30 text-foreground relative overflow-hidden border-border/40">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-conic from-primary/10 via-transparent to-primary/10 rounded-full blur-3xl animate-spin duration-[20s]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto space-y-8">
        {/* Icon with animation */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full animate-ping" />
          <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-primary/25">
            <MessageCircle className="w-10 h-10 text-primary-foreground animate-bounce" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
        </div>

        {/* Main heading */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome to Converse
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Select a conversation from the sidebar or start a new chat to begin messaging
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>Group Chats</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Plus className="w-4 h-4 text-primary" />
              <span>Add Friends</span>
            </div>
          </div>
        </div>

        {/* Subtle animation hint */}
        <div className="pt-8">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60 animate-pulse">
            <div className="w-2 h-2 bg-primary/40 rounded-full animate-ping" />
            <span>Ready to connect</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-4 right-4 text-muted-foreground/20">
        <MessageCircle className="w-32 h-32 transform rotate-12" />
      </div>
      <div className="absolute top-4 left-4 text-muted-foreground/10">
        <Users className="w-24 h-24 transform -rotate-12" />
      </div>
    </Card>
  );
};

export default ConversationFallback;
