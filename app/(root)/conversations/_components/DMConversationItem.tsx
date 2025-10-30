import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { User, Image, Video, Mic, FileText } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { capitalizeName } from "@/lib/utils";

type Props = {
  id: Id<"conversations">;
  imageUrl: string;
  username: string;
  lstMsgSender?: string;
  lstMsgContent?: string;
  lstMsgType?: string;
  index?: number;
  userStatus?: "online" | "offline" | "away";
  unreadCount?: number;
};

const DMConversationItem = React.memo(({
  id,
  imageUrl,
  username,
  lstMsgContent,
  lstMsgSender,
  lstMsgType = "text",
  index = 0,
  userStatus = "offline",
  unreadCount = 0,
}: Props) => {
  const prefersReducedMotion = useReducedMotion();

  // Status color mapping
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  };

  // Get icon for message type - memoized for performance
  const messageIcon = useMemo(() => {
    switch (lstMsgType) {
      case "image":
        return <Image className="h-3.5 w-3.5 text-blue-500" />;
      case "video":
        return <Video className="h-3.5 w-3.5 text-purple-500" />;
      case "audio":
        return <Mic className="h-3.5 w-3.5 text-green-500" />;
      case "file":
        return <FileText className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return null;
    }
  }, [lstMsgType]);
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : index * 0.05 }}
      className="w-full"
      layoutId={`conversation-${id}`}
    >
      <Link href={`/conversations/${id}`} className="w-full block">
        <motion.div
          whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          style={{ willChange: "transform" }}
        >
          <Card className="p-3 flex flex-row items-center gap-4 truncate border border-border/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md bg-gradient-to-r hover:from-primary/5 hover:to-transparent relative overflow-hidden group">
            {/* Background elements - optimized */}
            {!prefersReducedMotion && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
                <div className="absolute -inset-[100%] bg-gradient-to-tr from-primary/10 via-transparent to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000 ease-in-out will-change-transform"></div>
              </div>
            )}

            {/* Content */}
            <div className="flex flex-row items-center gap-4 truncate w-full relative z-10">
              <motion.div
                className="relative"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary-foreground/20 blur-md opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                )}
                <Avatar className="border-2 border-border/30 group-hover:border-primary/50 transition-all duration-300 h-10 w-10 ring-2 ring-background shadow-sm">
                  <AvatarImage src={imageUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-muted/80 to-muted-foreground/10">
                    <User className="text-foreground/70 h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Dynamic status indicator */}
                <motion.span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${statusColors[userStatus]} ring-2 ring-background`}
                  animate={
                    !prefersReducedMotion && userStatus === "online"
                      ? { scale: [1, 1.2, 1] }
                      : undefined
                  }
                  transition={
                    userStatus === "online"
                      ? { duration: 2, repeat: Infinity }
                      : undefined
                  }
                />
                {!prefersReducedMotion && userStatus === "online" && (
                  <motion.span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500"
                    animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div className="flex flex-col truncate w-full">
                <div className="flex items-center justify-between">
                  <h4 className="truncate font-medium group-hover:text-primary transition-colors duration-300 flex items-center gap-1">
                    {capitalizeName(username)}
                    <motion.span
                      className="inline-block h-1 w-1 rounded-full bg-primary/80 opacity-0 group-hover:opacity-100"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </h4>

                  {/* Unread count badge */}
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="relative"
                    >
                      <motion.div
                        className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-xs font-bold text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}
                </div>

                {lstMsgSender && lstMsgContent ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 truncate overflow-ellipsis">
                    <p className={`font-semibold ${unreadCount > 0 ? "text-foreground" : ""}`}>
                      {capitalizeName(lstMsgSender)}
                      {":"}&nbsp;
                    </p>
                    {lstMsgType !== "text" && (
                      <span className="flex-shrink-0">{messageIcon}</span>
                    )}
                    <motion.p
                      className={`truncate overflow-ellipsis ${unreadCount > 0 ? "text-foreground font-medium" : ""}`}
                      initial={{ color: unreadCount > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
                      whileHover={{ color: "var(--foreground)" }}
                    >
                      {lstMsgContent}
                    </motion.p>
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground truncate italic group-hover:text-muted-foreground/80">
                    <motion.span
                      initial={{ backgroundPosition: "0% 100%" }}
                      whileHover={{ backgroundPosition: "100% 100%" }}
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, var(--muted-foreground), var(--primary))",
                        backgroundSize: "200% 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                        backgroundRepeat: "no-repeat",
                        display: "inline-block",
                      }}
                      transition={{ duration: 0.8 }}
                    >
                      Start the conversation!
                    </motion.span>
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
});

DMConversationItem.displayName = "DMConversationItem";

export default DMConversationItem;
