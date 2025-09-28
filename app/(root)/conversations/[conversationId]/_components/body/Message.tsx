import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";

type Props = {
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  type: string;
  seen?: boolean;
};

const Message = ({
  fromCurrentUser,
  senderImage,
  senderName,
  lastByUser,
  content,
  createdAt,
  type,
  seen,
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatTime = (timeStamp: number) => {
    return format(timeStamp, "HH:mm");
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 transition-all duration-300 transform",
        {
          "justify-end": fromCurrentUser,
          "opacity-0 translate-y-4": !isVisible,
          "opacity-100 translate-y-0": isVisible
        }
      )}
    >
      {/* Avatar for non-current user messages */}
      {!fromCurrentUser && (
        <Avatar
          className={cn("h-8 w-8 ring-2 ring-border/20 transition-all duration-200", {
            "invisible": lastByUser,
            "hover:ring-primary/50": !lastByUser
          })}
        >
          <AvatarImage src={senderImage} alt={senderName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn("flex flex-col max-w-[70%] transition-all duration-200", {
          "items-end": fromCurrentUser,
          "items-start": !fromCurrentUser,
        })}
      >
        {/* Sender name for group messages */}
        {!fromCurrentUser && !lastByUser && (
          <span className="text-xs text-muted-foreground mb-1 px-3 font-medium">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md group",
            {
              // Current user styling
              "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20": fromCurrentUser,
              "rounded-br-md": fromCurrentUser && !lastByUser,

              // Other user styling
              "bg-gradient-to-br from-muted to-muted/80 text-foreground border border-border/50": !fromCurrentUser,
              "rounded-bl-md": !fromCurrentUser && !lastByUser,

              // Hover effects
              "hover:shadow-primary/30": fromCurrentUser,
              "hover:border-primary/30": !fromCurrentUser,
            }
          )}
        >
          {/* Message content */}
          {type === "text" && (
            <div className="space-y-1">
              <p className="text-wrap break-words whitespace-pre-wrap leading-relaxed">
                {content}
              </p>
            </div>
          )}

          {/* Timestamp and status */}
          <div
            className={cn("flex items-center justify-between mt-2 gap-2", {
              "justify-end": fromCurrentUser,
              "justify-start": !fromCurrentUser,
            })}
          >
            <span
              className={cn("text-xs opacity-70 group-hover:opacity-90 transition-opacity", {
                "text-primary-foreground/80": fromCurrentUser,
                "text-muted-foreground": !fromCurrentUser,
              })}
            >
              {formatTime(createdAt)}
            </span>

            {/* Read status for current user messages */}
            {fromCurrentUser && (
              <div className="flex items-center">
                {seen ? (
                  <CheckCheck className="w-3 h-3 text-green-400 opacity-80" />
                ) : (
                  <Check className="w-3 h-3 text-primary-foreground/60" />
                )}
              </div>
            )}
          </div>

          {/* Message bubble tail */}
          <div
            className={cn("absolute top-3 w-3 h-3 transform rotate-45", {
              "right-[-6px] bg-gradient-to-br from-primary to-primary/90": fromCurrentUser && !lastByUser,
              "left-[-6px] bg-gradient-to-br from-muted to-muted/80 border-l border-t border-border/50": !fromCurrentUser && !lastByUser,
              "hidden": lastByUser
            })}
          />
        </div>
      </div>

      {/* Avatar for current user messages */}
      {fromCurrentUser && (
        <Avatar
          className={cn("h-8 w-8 ring-2 ring-primary/20 transition-all duration-200", {
            "invisible": lastByUser,
            "hover:ring-primary/50": !lastByUser
          })}
        >
          <AvatarImage src={senderImage} alt={senderName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default Message;
