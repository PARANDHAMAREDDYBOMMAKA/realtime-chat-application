"use client";

import React from "react";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { useEncryption } from "@/hooks/useEncryption";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EncryptionBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function EncryptionBadge({
  className,
  showLabel = false,
}: EncryptionBadgeProps) {
  const { isInitialized, hasKeys } = useEncryption();

  if (!isInitialized) {
    return (
      <div className={cn("flex items-center gap-1.5 text-muted-foreground", className)}>
        <Shield className="h-4 w-4" />
        {showLabel && <span className="text-xs">Initializing...</span>}
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400",
                className
              )}
            >
              <ShieldAlert className="h-4 w-4" />
              {showLabel && <span className="text-xs">Not encrypted</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Encryption not enabled</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 text-green-600 dark:text-green-400",
              className
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {showLabel && <span className="text-xs">Encrypted</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">End-to-end encrypted</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
