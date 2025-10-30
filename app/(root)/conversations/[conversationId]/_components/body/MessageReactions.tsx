"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Reaction = {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string; image: string }>;
  userReacted: boolean;
};

type Props = {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
};

const MessageReactions = ({ reactions, onToggleReaction }: Props) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <TooltipProvider>
        {reactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-2 py-0 rounded-full text-sm gap-1 transition-all hover:scale-105",
                  {
                    "bg-primary/10 border-primary/50 hover:bg-primary/20":
                      reaction.userReacted,
                    "bg-muted/50 hover:bg-muted": !reaction.userReacted,
                  }
                )}
                onClick={() => onToggleReaction(reaction.emoji)}
              >
                <span className="text-base leading-none">{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {reaction.users.map((user, idx) => (
                  <div key={user.id}>
                    {user.name}
                    {idx < reaction.users.length - 1 && ", "}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default MessageReactions;
